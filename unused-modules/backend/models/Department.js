const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  utilization: { type: String },
  status: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema); 