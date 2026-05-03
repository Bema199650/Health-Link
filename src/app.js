const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));





// DEBUG: Show available static files
app.get('/debug-files', (req, res) => {
    const fs = require('fs');
    const webPath = path.join(__dirname, '..', 'web');
    try {
        const files = fs.readdirSync(webPath);
        res.json({
            webPath: webPath,
            exists: true,
            files: files
        });
    } catch (err) {
        res.json({
            webPath: webPath,
            exists: false,
            error: err.message
        });
    }
});







// Serve static files from web folder
app.use(express.static(path.join(__dirname, '..', 'web')));

// In-memory database (replace with MongoDB later)
const db = {
  complaints: [],
  reports: [],
  alerts: [],
  users: []
};

// ============ AUTH ROUTES ============
app.post('/api/auth/register', (req, res) => {
  const { phoneNumber, name, role } = req.body;
  
  const user = {
    id: Date.now().toString(),
    phoneNumber,
    name,
    role: role || 'patient',
    createdAt: new Date()
  };
  
  db.users.push(user);
  
  res.json({
    success: true,
    message: 'User registered successfully',
    data: user
  });
});

app.post('/api/auth/login', (req, res) => {
  const { phoneNumber } = req.body;
  const user = db.users.find(u => u.phoneNumber === phoneNumber);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Login successful',
    data: user
  });
});

// ============ PATIENT FEEDBACK ROUTES ============
app.post('/api/feedback', (req, res) => {
  const { phoneNumber, name, category, description, channel } = req.body;
  
  const complaint = {
    ticketId: 'TKT-' + Date.now().toString(36).toUpperCase(),
    phoneNumber,
    name,
    category,
    description,
    channel: channel || 'web',
    status: 'pending',
    response: null,
    createdAt: new Date()
  };
  
  db.complaints.push(complaint);
  
  console.log(`New complaint: ${complaint.ticketId} - ${category}`);
  
  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: {
      ticketId: complaint.ticketId,
      message: 'We will respond within 24 hours'
    }
  });
});

app.get('/api/feedback', (req, res) => {
  const { status } = req.query;
  let complaints = db.complaints;
  
  if (status) {
    complaints = complaints.filter(c => c.status === status);
  }
  
  res.json({
    success: true,
    count: complaints.length,
    data: complaints.sort((a, b) => b.createdAt - a.createdAt)
  });
});

app.get('/api/feedback/status/:ticketId', (req, res) => {
  const complaint = db.complaints.find(c => c.ticketId === req.params.ticketId);
  
  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }
  
  res.json({
    success: true,
    data: complaint
  });
});

app.put('/api/feedback/respond/:ticketId', (req, res) => {
  const { message } = req.body;
  const complaint = db.complaints.find(c => c.ticketId === req.params.ticketId);
  
  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }
  
  complaint.status = 'resolved';
  complaint.response = {
    message,
    respondedAt: new Date()
  };
  
  res.json({
    success: true,
    message: 'Response sent successfully'
  });
});

// ============ HEALTH WORKER REPORT ROUTES ============
app.post('/api/reports', (req, res) => {
  const { phoneNumber, workerName, facility, reportType, description, priority, channel } = req.body;
  
  const report = {
    reportId: 'RPT-' + Date.now().toString(36).toUpperCase(),
    phoneNumber,
    workerName,
    facility,
    reportType,
    description,
    priority: priority || 'medium',
    channel: channel || 'web',
    status: 'submitted',
    createdAt: new Date()
  };
  
  db.reports.push(report);
  
  console.log(`New report: ${report.reportId} - ${reportType} from ${facility}`);
  
  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: {
      reportId: report.reportId
    }
  });
});

app.get('/api/reports', (req, res) => {
  const { status } = req.query;
  let reports = db.reports;
  
  if (status) {
    reports = reports.filter(r => r.status === status);
  }
  
  res.json({
    success: true,
    count: reports.length,
    data: reports.sort((a, b) => b.createdAt - a.createdAt)
  });
});

app.put('/api/reports/:reportId/status', (req, res) => {
  const { status } = req.body;
  const report = db.reports.find(r => r.reportId === req.params.reportId);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  report.status = status;
  
  res.json({
    success: true,
    message: 'Report status updated',
    data: report
  });
});

// ============ ALERT ROUTES ============
app.post('/api/alerts', (req, res) => {
  const { title, message, type, priority, channels, targetDistrict } = req.body;
  
  const alert = {
    alertId: 'ALT-' + Date.now().toString(36).toUpperCase(),
    title,
    message,
    type: type || 'general',
    priority: priority || 'medium',
    channels: channels || ['sms'],
    targetDistrict: targetDistrict || 'Blantyre',
    sentCount: 0,
    status: 'sent',
    createdAt: new Date()
  };
  
  db.alerts.push(alert);
  
  console.log(`ALERT SENT: ${title}`);
  console.log(`Message: ${message}`);
  console.log(`Channels: ${channels?.join(', ')}`);
  
  res.status(201).json({
    success: true,
    message: 'Alert sent successfully',
    data: alert
  });
});

app.get('/api/alerts', (req, res) => {
  res.json({
    success: true,
    count: db.alerts.length,
    data: db.alerts.sort((a, b) => b.createdAt - a.createdAt)
  });
});

// ============ USSD ROUTE (Simulation) ============
app.post('/api/ussd', (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  
  console.log(`📞 USSD Request:`);
  console.log(`   Session: ${sessionId}`);
  console.log(`   Phone: ${phoneNumber}`);
  console.log(`   Text: "${text}" (type: ${typeof text}, length: ${text ? text.length : 0})`);
  
  let response;
  
  // IMPORTANT: Check if this is the first request (empty or undefined text)
  if (!text || text === '' || text === undefined || text === null) {
    // First time dialing - show main menu
    console.log('   → Showing MAIN MENU');
    response = `CON Welcome to HealthLink Malawi
1. Patient Services
2. Health Worker Services
3. Health Information
4. Exit`;
  } 
  else if (text === '1') {
    console.log('   → Patient Services menu');
    response = `CON Patient Services
1. Report a Complaint
2. Check Complaint Status
3. Health Tips
0. Back`;
  } 
  else if (text === '1*1') {
    console.log('   → Complaint categories');
    response = `CON Select complaint category:
1. Waiting Time
2. Staff Attitude
3. Drug Availability
4. Equipment Issues
5. Cleanliness
6. Other`;
  } 
  else if (text.match(/^1\*1\*\d$/)) {
    // User selected a complaint category
    const categories = {
      '1': 'waiting_time',
      '2': 'staff_attitude',
      '3': 'drug_availability',
      '4': 'equipment',
      '5': 'cleanliness',
      '6': 'other'
    };
    const categoryNum = text.split('*')[2];
    const category = categories[categoryNum] || 'other';
    
    const ticketId = 'TKT-' + Date.now().toString(36).toUpperCase();
    db.complaints.push({
      ticketId,
      phoneNumber,
      name: 'USSD User',
      category: category,
      description: 'Submitted via USSD',
      channel: 'ussd',
      status: 'pending',
      createdAt: new Date()
    });
    
    console.log(`   → Complaint submitted! Ticket: ${ticketId}`);
    
    response = `END Your complaint has been received.
Ticket ID: ${ticketId}
We will respond within 24 hours.
Dial *224# for more options.`;
  } 
  else if (text === '2') {
    console.log('   → Health Worker menu');
    response = `CON Health Worker Services
1. Submit Report
2. Report Drug Stockout
3. Equipment Failure
4. Staff Shortage
0. Back`;
  } 
  else if (text.match(/^2\*\d$/)) {
    // Health worker submitted a report type
    const reportTypes = {
      '1': 'general',
      '2': 'drug_stockout',
      '3': 'equipment_failure',
      '4': 'staff_shortage'
    };
    const typeNum = text.split('*')[1];
    const reportType = reportTypes[typeNum] || 'other';
    
    const reportId = 'RPT-' + Date.now().toString(36).toUpperCase();
    db.reports.push({
      reportId,
      phoneNumber,
      workerName: 'Health Worker',
      facility: 'USSD Report',
      reportType: reportType,
      description: 'Submitted via USSD',
      channel: 'ussd',
      priority: 'medium',
      status: 'submitted',
      createdAt: new Date()
    });
    
    console.log(`   → Report submitted! ID: ${reportId}`);
    
    response = `END Report submitted successfully!
Report ID: ${reportId}
DHO has been notified.
Thank you.`;
  } 
  else if (text === '3') {
    console.log('   → Health tips');
    const tips = [
      "Wash hands regularly with soap & water",
      "Sleep under treated mosquito nets",
      "Visit health center for regular check-ups",
      "Drink clean, safe water",
      "Vaccinate children on schedule"
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    response = `END Health Tip:
${tip}
Dial *224# for more services.`;
  } 
  else if (text === '0') {
    console.log('   → Going back to main menu');
    response = `CON Welcome to HealthLink Malawi
1. Patient Services
2. Health Worker Services
3. Health Information
4. Exit`;
  }
  else {
    // Unknown input - show main menu again
    console.log(`   → Unknown input: "${text}", showing main menu`);
    response = `CON Welcome to HealthLink Malawi
1. Patient Services
2. Health Worker Services
3. Health Information
4. Exit`;
  }
  
  console.log(`   Response type: ${response.startsWith('CON') ? 'CON (continue)' : 'END (end)'}`);
  
  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// ============ SMS ROUTE (Simulation) ============
app.post('/api/sms/send', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  console.log(`SMS to ${phoneNumber}: ${message}`);
  
  res.json({
    success: true,
    message: 'SMS sent successfully'
  });
});

// ============ WHATSAPP ROUTE (Simulation) ============
app.post('/api/whatsapp/send', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  console.log(`WhatsApp to ${phoneNumber}: ${message}`);
  
  res.json({
    success: true,
    message: 'WhatsApp message sent successfully'
  });
});

// ============ DASHBOARD ROUTES ============
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {
    totalComplaints: db.complaints.length,
    pendingComplaints: db.complaints.filter(c => c.status === 'pending').length,
    resolvedComplaints: db.complaints.filter(c => c.status === 'resolved').length,
    totalReports: db.reports.length,
    pendingReports: db.reports.filter(r => r.status === 'submitted').length,
    totalAlerts: db.alerts.length,
    recentComplaints: db.complaints.slice(-5).reverse(),
    recentReports: db.reports.slice(-5).reverse()
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// ============ WEB PORTAL ROUTES ============
// Serve the main web interface at both / and /portal
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, '..', 'web', 'index.html');
  res.sendFile(filePath);
});

app.get('/portal', (req, res) => {
  const filePath = path.join(__dirname, '..', 'web', 'index.html');
  res.sendFile(filePath);
});

// ============ API INFO ============
app.get('/api', (req, res) => {
  res.json({
    name: 'HealthLink Malawi API',
    version: '1.0.0',
    status: 'running',
    webPortal: 'http://localhost:3000',
    endpoints: {
      feedback: '/api/feedback',
      reports: '/api/reports',
      alerts: '/api/alerts',
      ussd: '/api/ussd',
      dashboard: '/api/dashboard/stats'
    }
  });
});













// ============ EXPORT & REPORTING ROUTES ============
const ExportService = require('./services/export.service');

// Export complaints as CSV
app.get('/api/export/complaints/csv', (req, res) => {
  try {
    const csv = ExportService.generateCSV(db.complaints, 'complaints');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export complaints as JSON
app.get('/api/export/complaints/json', (req, res) => {
  try {
    const json = ExportService.generateJSON(db.complaints);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints.json');
    res.send(json);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate summary report
app.get('/api/reports/summary', (req, res) => {
  try {
    const summary = ExportService.generateReportSummary(db.complaints, db.reports);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ SEARCH ENDPOINT ============
app.get('/api/search', (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const results = {
      complaints: [],
      reports: [],
      alerts: []
    };
    
    const searchTerm = q.toLowerCase();
    
    if (!type || type === 'complaints') {
      results.complaints = db.complaints.filter(c =>
        c.ticketId.toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm) ||
        c.name.toLowerCase().includes(searchTerm) ||
        c.phoneNumber.includes(searchTerm) ||
        c.healthFacility?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (!type || type === 'reports') {
      results.reports = db.reports.filter(r =>
        r.reportId.toLowerCase().includes(searchTerm) ||
        r.description.toLowerCase().includes(searchTerm) ||
        r.workerName.toLowerCase().includes(searchTerm) ||
        r.facility.toLowerCase().includes(searchTerm)
      );
    }
    
    if (!type || type === 'alerts') {
      results.alerts = db.alerts.filter(a =>
        a.title.toLowerCase().includes(searchTerm) ||
        a.message.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      query: q,
      results: {
        totalComplaints: results.complaints.length,
        totalReports: results.reports.length,
        totalAlerts: results.alerts.length,
        complaints: results.complaints.slice(0, 20),
        reports: results.reports.slice(0, 20),
        alerts: results.alerts.slice(0, 20)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ SEED SAMPLE DATA ============
app.post('/api/seed/sample-data', (req, res) => {
  try {
    const facilities = [
      'Queen Elizabeth Central Hospital',
      'Bangwe Health Centre',
      'Chilomoni Health Centre',
      'Limbe Health Centre',
      'Ndirande Health Centre',
      'Mbayani Health Centre',
      'Zingwangwa Health Centre',
      'Sunnyside Clinic'
    ];
    
    const categories = [
      'waiting_time', 'staff_attitude', 'drug_availability',
      'equipment', 'cleanliness', 'other'
    ];
    
    const descriptions = [
      'Had to wait over 3 hours before seeing a doctor',
      'Nurse was very rude and dismissive',
      'Could not find prescribed medication at the pharmacy',
      'Blood pressure machine was not working',
      'Toilets were very dirty',
      'The facility was overcrowded',
      'Doctor was very helpful and professional',
      'No painkillers available in stock',
      'Long queue at the registration desk',
      'Received wrong medication from pharmacy'
    ];
    
    const names = [
      'Grace Banda', 'John Phiri', 'Mary Chirwa', 'Peter Mwale',
      'Agnes Tembo', 'David Nyirenda', 'Sarah Kumwenda', 'James Gondwe',
      'Patricia Mbewe', 'Michael Zulu'
    ];
    
    // Generate sample complaints
    const sampleComplaints = [];
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const isResolved = Math.random() > 0.5;
      
      const complaint = {
        ticketId: 'TKT-' + (Date.now() - i * 3600000).toString(36).toUpperCase(),
        phoneNumber: `+265888${Math.floor(100000 + Math.random() * 900000)}`,
        name: names[Math.floor(Math.random() * names.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        channel: ['web', 'ussd', 'sms', 'whatsapp'][Math.floor(Math.random() * 4)],
        healthFacility: facilities[Math.floor(Math.random() * facilities.length)],
        status: isResolved ? 'resolved' : 'pending',
        createdAt,
        updatedAt: createdAt
      };
      
      if (isResolved) {
        complaint.response = {
          message: 'Thank you for your feedback. We are working on addressing this issue.',
          respondedAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
        };
        complaint.resolutionTime = 24;
      }
      
      sampleComplaints.push(complaint);
    }
    
    // Generate sample reports
    const sampleReports = [];
    const reportTypes = ['drug_stockout', 'equipment_failure', 'staff_shortage', 'infrastructure_issue'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 20);
      
      sampleReports.push({
        reportId: 'RPT-' + (Date.now() - i * 3600000).toString(36).toUpperCase(),
        phoneNumber: `+265999${Math.floor(100000 + Math.random() * 900000)}`,
        workerName: names[Math.floor(Math.random() * names.length)],
        facility: facilities[Math.floor(Math.random() * facilities.length)],
        reportType: reportTypes[Math.floor(Math.random() * reportTypes.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        channel: ['web', 'ussd'][Math.floor(Math.random() * 2)],
        status: ['submitted', 'acknowledged', 'resolved'][Math.floor(Math.random() * 3)],
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    }
    
    // Clear existing and add sample data
    db.complaints = [...sampleComplaints, ...db.complaints];
    db.reports = [...sampleReports, ...db.reports];
    
    console.log(`✅ Seeded ${sampleComplaints.length} complaints and ${sampleReports.length} reports`);
    
    res.json({
      success: true,
      message: 'Sample data generated successfully',
      data: {
        complaintsAdded: sampleComplaints.length,
        reportsAdded: sampleReports.length,
        totalComplaints: db.complaints.length,
        totalReports: db.reports.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ FACILITIES LIST ============
app.get('/api/facilities', (req, res) => {
  const facilities = [
    { name: 'Queen Elizabeth Central Hospital', type: 'hospital', district: 'Blantyre' },
    { name: 'Bangwe Health Centre', type: 'health_centre', district: 'Blantyre' },
    { name: 'Chilomoni Health Centre', type: 'health_centre', district: 'Blantyre' },
    { name: 'Limbe Health Centre', type: 'health_centre', district: 'Blantyre' },
    { name: 'Ndirande Health Centre', type: 'health_centre', district: 'Blantyre' },
    { name: 'Mbayani Health Centre', type: 'health_centre', district: 'Blantyre' },
    { name: 'Zingwangwa Health Centre', type: 'health_centre', district: 'Blantyre' },
    { name: 'Sunnyside Clinic', type: 'clinic', district: 'Blantyre' },
    { name: 'Gateway Clinic', type: 'clinic', district: 'Blantyre' },
    { name: 'Blantyre Adventist Hospital', type: 'hospital', district: 'Blantyre' }
  ];
  
  res.json({
    success: true,
    count: facilities.length,
    data: facilities
  });
});







// Serve USSD Simulator
app.get('/ussd-simulator', (req, res) => {
    const filePath = path.join(__dirname, '..', 'web', 'ussd-simulator.html');
    res.sendFile(filePath);
});

// Serve Dashboard Enhanced
app.get('/dashboard-enhanced', (req, res) => {
    const filePath = path.join(__dirname, '..', 'web', 'dashboard-enhanced.html');
    res.sendFile(filePath);
});













// ============ START SERVER ============
app.listen(port, () => {
  console.log('========================================');
  console.log('  HealthLink Malawi - Backend Server');
  console.log('  Blantyre DHO Communication Platform');
  console.log('========================================');
  console.log(`  Server: http://localhost:${port}`);
  console.log(`  Web Portal: http://localhost:${port}/portal`);
  console.log(`  API Info: http://localhost:${port}/api`);
  console.log('========================================');
  console.log('  Available API Endpoints:');
  console.log('  POST   /api/feedback       - Submit complaint');
  console.log('  GET    /api/feedback       - Get all complaints');
  console.log('  POST   /api/reports        - Submit health worker report');
  console.log('  GET    /api/reports        - Get all reports');
  console.log('  POST   /api/alerts         - Send health alert');
  console.log('  POST   /api/ussd           - USSD callback');
  console.log('  GET    /api/dashboard/stats - Dashboard statistics');
  console.log('========================================\n');
});