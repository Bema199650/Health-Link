const mongoose = require('mongoose');

const healthFacilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['hospital', 'health_center', 'clinic', 'dispensary'],
    required: true
  },
  district: {
    type: String,
    default: 'Blantyre'
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contactPhone: String,
  contactEmail: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HealthFacility', healthFacilitySchema);