const mongoose = require('mongoose');

const healthWorkerReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  healthWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: [
      'drug_stockout',
      'equipment_failure',
      'staff_shortage',
      'infrastructure_issue',
      'emergency',
      'other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  healthFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthFacility',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['submitted', 'acknowledged', 'in_progress', 'resolved'],
    default: 'submitted'
  },
  items: [{
    drugName: String,
    quantityNeeded: Number,
    urgency: String
  }],
  acknowledgement: {
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: Date,
    message: String
  },
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    actionTaken: String
  },
  channel: {
    type: String,
    enum: ['ussd', 'sms', 'whatsapp', 'web'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

healthWorkerReportSchema.pre('save', function(next) {
  if (!this.reportId) {
    this.reportId = 'RPT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('HealthWorkerReport', healthWorkerReportSchema);