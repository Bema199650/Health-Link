const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'disease_outbreak',
      'vaccination_campaign',
      'health_education',
      'emergency',
      'general'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetAudience: {
    districts: [String],
    facilities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthFacility'
    }],
    userRoles: [{
      type: String,
      enum: ['patient', 'health_worker', 'all']
    }],
    ageGroup: {
      min: Number,
      max: Number
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'all']
    }
  },
  channels: [{
    type: String,
    enum: ['sms', 'whatsapp', 'ussd', 'all']
  }],
  schedule: {
    sendNow: {
      type: Boolean,
      default: true
    },
    scheduledTime: Date,
    recurring: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly']
    }
  },
  sentCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

alertSchema.pre('save', function(next) {
  if (!this.alertId) {
    this.alertId = 'ALT-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Alert', alertSchema);