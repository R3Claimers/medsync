const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true },
  department: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema); 