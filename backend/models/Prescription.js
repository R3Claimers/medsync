const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  medications: [{
    name: String,
    quantity: Number,
    dosage: String,
    frequency: String,
    timing: [String],
    duration: String,
    food: String,
    instructions: String
  }],
  medication: { type: String }, // legacy
  quantity: { type: Number },   // legacy
  status: { type: String, enum: ['pending', 'ready', 'dispensing', 'active', 'completed'], default: 'pending' },
  date: { type: String, required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema); 