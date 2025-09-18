const Patient = require('../models/Patient');
const User = require('../models/User');

// Create a new patient (admin, receptionist)
exports.createPatient = async (req, res) => {
  try {
    const { name, email, password, contact, healthSummary } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    // If password is not provided, generate a random one
    const userPassword = password || Math.random().toString(36).slice(-8);
    user = new User({ name, email, password: userPassword, role: 'patient', contact });
    await user.save();
    const patient = new Patient({ user: user._id, healthSummary });
    await patient.save();
    res.status(201).json({ patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all patients (admin, doctor, receptionist)
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate('user');
    res.json({ patients });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single patient (self, doctor, admin, receptionist)
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('user');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    // If patient, only allow self
    if (req.user.role === 'patient' && patient.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get patient by user ID (for login/dashboard)
exports.getPatientByUser = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.params.userId }).populate('user');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update patient (admin, receptionist)
exports.updatePatient = async (req, res) => {
  try {
    const { healthSummary, contact } = req.body;
    const patient = await Patient.findById(req.params.id).populate('user');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    if (healthSummary) patient.healthSummary = healthSummary;
    if (contact) patient.user.contact = contact;
    await patient.user.save();
    await patient.save();
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete patient (admin, receptionist)
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    await User.findByIdAndDelete(patient.user);
    await patient.deleteOne();
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 