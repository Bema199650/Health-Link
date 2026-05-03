const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'health_worker', 'dho_admin', 'super_admin'],
    default: 'patient'
  },
  healthFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthFacility'
  },
  district: {
    type: String,
    default: 'Blantyre'
  },
  preferredChannel: {
    type: String,
    enum: ['sms', 'whatsapp', 'ussd'],
    default: 'sms'
  },
  language: {
    type: String,
    enum: ['en', 'ny'],
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);