const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'], 
    default: 'pending' 
  },
  type: { type: String, default: 'Consultation' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  notes: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  treatmentProgress: {
    status: { 
      type: String, 
      enum: ['not-started', 'in-progress', 'completed', 'follow-up-required'], 
      default: 'not-started' 
    },
    progressNotes: { type: String, default: '' },
    followUpDate: { type: String, default: '' }
  },
  patientNotes: { type: String, default: '' } // Notes from patient when booking
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema); 