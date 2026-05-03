const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'waiting_time',
      'staff_attitude',
      'drug_availability',
      'equipment',
      'cleanliness',
      'discrimination',
      'other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  healthFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthFacility'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  response: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  channel: {
    type: String,
    enum: ['ussd', 'sms', 'whatsapp', 'web'],
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate ticket ID
complaintSchema.pre('save', function(next) {
  if (!this.ticketId) {
    this.ticketId = 'TKT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);