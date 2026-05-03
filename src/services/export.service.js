class ExportService {
  static generateCSV(data, filename) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]?.toString() || '';
        // Escape commas and quotes
        return `"${value.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  static generateJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  static generateReportSummary(complaints, reports) {
    const summary = {
      generatedAt: new Date().toISOString(),
      period: 'Last 30 days',
      complaints: {
        total: complaints.length,
        byStatus: {},
        byCategory: {},
        resolutionRate: 0
      },
      reports: {
        total: reports.length,
        byStatus: {},
        byType: {},
        byPriority: {}
      },
      topIssues: [],
      recommendations: []
    };

    // Complaints analysis
    complaints.forEach(c => {
      summary.complaints.byStatus[c.status] = (summary.complaints.byStatus[c.status] || 0) + 1;
      summary.complaints.byCategory[c.category] = (summary.complaints.byCategory[c.category] || 0) + 1;
    });

    // Reports analysis
    reports.forEach(r => {
      summary.reports.byStatus[r.status] = (summary.reports.byStatus[r.status] || 0) + 1;
      summary.reports.byType[r.reportType] = (summary.reports.byType[r.reportType] || 0) + 1;
      summary.reports.byPriority[r.priority] = (summary.reports.byPriority[r.priority] || 0) + 1;
    });

    // Resolution rate
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    summary.complaints.resolutionRate = complaints.length > 0 
      ? Math.round((resolved / complaints.length) * 100) 
      : 0;

    // Identify top issues
    const categoryCounts = Object.entries(summary.complaints.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    summary.topIssues = categoryCounts.map(([category, count]) => ({
      category: category.replace('_', ' '),
      count,
      recommendation: ExportService.getRecommendation(category)
    }));

    return summary;
  }

  static getRecommendation(category) {
    const recommendations = {
      waiting_time: 'Implement queue management system and increase staffing during peak hours',
      staff_attitude: 'Conduct customer service training for all health workers',
      drug_availability: 'Review supply chain management and stock monitoring systems',
      equipment: 'Schedule regular equipment maintenance and create replacement plan',
      cleanliness: 'Increase cleaning frequency and implement hygiene protocols',
      discrimination: 'Conduct sensitivity training and enforce anti-discrimination policies',
      drug_stockout: 'Improve inventory forecasting and establish emergency supply agreements',
      staff_shortage: 'Review staffing levels and consider recruitment or redistribution'
    };
    
    return recommendations[category] || 'Investigate and address root causes';
  }
}

module.exports = ExportService;