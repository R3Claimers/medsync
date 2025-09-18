const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  type: {
    type: String,
    enum: ['user_registration', 'role_change', 'permission_request'],
    default: 'user_registration'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  requestedRole: {
    type: String,
    enum: ['doctor', 'nurse', 'admin', 'receptionist', 'pharmacist'],
    required: true
  },
  requestDetails: {
    specialty: String,
    department: String,
    contact: String,
    qualifications: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  reviewComments: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Approval', approvalSchema);
