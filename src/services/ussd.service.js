const redis = require('../config/redis');
const Complaint = require('../models/Complaint.model');
const HealthWorkerReport = require('../models/HealthWorkerReport.model');
const User = require('../models/User.model');

class USSDService {
  constructor() {
    this.menuState = {};
  }

  // Main USSD handler
  async handleRequest(sessionId, phoneNumber, text, serviceCode) {
    try {
      // Get user session from Redis
      let session = await this.getSession(sessionId);
      
      if (!session) {
        // New session - show main menu
        session = {
          sessionId,
          phoneNumber,
          level: 0,
          state: 'MAIN_MENU',
          data: {}
        };
      }

      const textArray = text.split('*');
      const userInput = textArray[textArray.length - 1];
      
      // Process based on current state
      let response;
      switch (session.state) {
        case 'MAIN_MENU':
          response = this.getMainMenu(userInput, session);
          break;
        case 'PATIENT_MENU':
          response = await this.handlePatientMenu(userInput, session);
          break;
        case 'HEALTH_WORKER_MENU':
          response = await this.handleHealthWorkerMenu(userInput, session);
          break;
        case 'COMPLAINT_CATEGORY':
          response = this.handleComplaintCategory(userInput, session);
          break;
        case 'COMPLAINT_DESCRIPTION':
          response = await this.handleComplaintDescription(userInput, session);
          break;
        case 'REPORT_TYPE':
          response = this.handleReportType(userInput, session);
          break;
        case 'REPORT_DESCRIPTION':
          response = await this.handleReportDescription(userInput, session);
          break;
        default:
          response = this.getMainMenu('', session);
      }

      // Update session state
      await this.saveSession(sessionId, session);

      return response;
    } catch (error) {
      console.error('USSD Error:', error);
      return 'END An error occurred. Please try again later.';
    }
  }

  // Main Menu
  getMainMenu(input, session) {
    session.state = 'MAIN_MENU';
    
    if (input === '1') {
      session.state = 'PATIENT_MENU';
      return this.getPatientMenu('');
    } else if (input === '2') {
      session.state = 'HEALTH_WORKER_MENU';
      return this.getHealthWorkerMenu('');
    } else {
      return `CON Welcome to HealthLink Malawi
1. Patient Services
2. Health Worker Services
3. Health Information
4. Exit`;
    }
  }

  // Patient Menu
  getPatientMenu(input) {
    return `CON Patient Services
1. Report a Complaint
2. Check Complaint Status
3. Rate Health Services
4. Health Tips
0. Back`;
  }

  async handlePatientMenu(input, session) {
    switch (input) {
      case '1':
        session.state = 'COMPLAINT_CATEGORY';
        return `CON Select complaint category:
1. Waiting Time
2. Staff Attitude
3. Drug Availability
4. Equipment/Broken
5. Cleanliness
6. Other`;
      
      case '2':
        return await this.checkComplaintStatus(session);
      
      case '3':
        return this.rateServices(session);
      
      case '4':
        return this.getHealthTips();
      
      case '0':
        return this.getMainMenu('', session);
      
      default:
        return this.getPatientMenu('');
    }
  }

  // Complaint Category Handler
  handleComplaintCategory(input, session) {
    const categories = {
      '1': 'waiting_time',
      '2': 'staff_attitude',
      '3': 'drug_availability',
      '4': 'equipment',
      '5': 'cleanliness',
      '6': 'other'
    };

    if (categories[input]) {
      session.data.category = categories[input];
      session.state = 'COMPLAINT_DESCRIPTION';
      return `CON Please describe your complaint (max 160 characters):`;
    } else {
      return `CON Invalid option. Please select a category:
1. Waiting Time
2. Staff Attitude
3. Drug Availability
4. Equipment/Broken
5. Cleanliness
6. Other`;
    }
  }

  // Complaint Description Handler
  async handleComplaintDescription(input, session) {
    if (input.length < 10) {
      return `CON Description too short. Please provide more details:`;
    }

    try {
      // Find or create user
      let user = await User.findOne({ phoneNumber: session.phoneNumber });
      if (!user) {
        user = await User.create({
          phoneNumber: session.phoneNumber,
          name: 'USSD User',
          role: 'patient',
          preferredChannel: 'ussd'
        });
      }

      // Create complaint
      const complaint = await Complaint.create({
        user: user._id,
        category: session.data.category,
        description: input.substring(0, 160),
        channel: 'ussd',
        isAnonymous: false
      });

      // Reset session
      session.state = 'MAIN_MENU';
      session.data = {};

      return `END Your complaint has been received. Ticket ID: ${complaint.ticketId}
We will respond within 24 hours. Thank you!`;
    } catch (error) {
      console.error('Complaint submission error:', error);
      return 'END Failed to submit complaint. Please try again later.';
    }
  }

  // Health Worker Menu
  getHealthWorkerMenu(input) {
    return `CON Health Worker Services
1. Submit Report
2. Report Drug Stockout
3. Equipment Failure
4. Staff Shortage
0. Back`;
  }

  async handleHealthWorkerMenu(input, session) {
    switch (input) {
      case '1':
        session.state = 'REPORT_TYPE';
        return this.getReportTypeMenu();
      
      case '2':
        session.data.reportType = 'drug_stockout';
        session.state = 'REPORT_DESCRIPTION';
        return `CON Please list drugs out of stock (comma separated):`;
      
      case '3':
        session.data.reportType = 'equipment_failure';
        session.state = 'REPORT_DESCRIPTION';
        return `CON Please describe the equipment failure:`;
      
      case '4':
        session.data.reportType = 'staff_shortage';
        session.state = 'REPORT_DESCRIPTION';
        return `CON Please describe staffing needs:`;
      
      case '0':
        return this.getMainMenu('', session);
      
      default:
        return this.getHealthWorkerMenu('');
    }
  }

  getReportTypeMenu() {
    return `CON Select Report Type:
1. Drug Stockout
2. Equipment Failure
3. Staff Shortage
4. Infrastructure Issue
5. Other`;
  }

  // Check complaint status
  async checkComplaintStatus(session) {
    try {
      const complaints = await Complaint.find()
        .where('user').equals(
          (await User.findOne({ phoneNumber: session.phoneNumber }))?._id
        )
        .sort('-createdAt')
        .limit(5);

      if (complaints.length === 0) {
        return `END No complaints found. Dial *224# to submit a new complaint.`;
      }

      let response = 'END Your Recent Complaints:\n';
      complaints.forEach((c, i) => {
        response += `${i + 1}. ${c.ticketId} - ${c.status}\n`;
      });
      
      return response;
    } catch (error) {
      console.error('Status check error:', error);
      return 'END Failed to retrieve complaints. Please try again.';
    }
  }

  // Rate services
  rateServices(session) {
    session.state = 'RATING';
    return `CON Rate the service received (1-5):
1. Very Poor
2. Poor
3. Average
4. Good
5. Excellent`;
  }

  // Health tips
  getHealthTips() {
    const tips = [
      "Wash your hands regularly with soap and water.",
      "Ensure your children are vaccinated on schedule.",
      "Sleep under a treated mosquito net to prevent malaria.",
      "Drink clean, safe water to prevent waterborne diseases.",
      "Visit your health center for regular check-ups."
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return `END Health Tip: ${randomTip}\nStay healthy! Dial *224# for more services.`;
  }

  // Session management using Redis
  async getSession(sessionId) {
    try {
      const client = redis.getClient();
      const session = await client.get(`ussd_session:${sessionId}`);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Redis get session error:', error);
      return null;
    }
  }

  async saveSession(sessionId, session) {
    try {
      const client = redis.getClient();
      await client.setEx(
        `ussd_session:${sessionId}`,
        300, // 5 minutes expiry
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Redis save session error:', error);
    }
  }
}

module.exports = new USSDService();