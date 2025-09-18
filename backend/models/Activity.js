const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout', 
      'patient_registered',
      'appointment_scheduled',
      'appointment_completed',
      'prescription_created',
      'inventory_updated',
      'user_approved',
      'user_denied',
      'profile_updated',
      'password_changed'
    ]
  },
  description: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['Patient', 'Doctor', 'User', 'Appointment', 'Prescription', 'Inventory'],
    required: false
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ hospitalId: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
