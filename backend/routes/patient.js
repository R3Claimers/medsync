const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create patient (admin, receptionist, doctor)
router.post('/', auth, role(['admin', 'receptionist', 'doctor']), patientController.createPatient);
// Get all patients (admin, doctor, receptionist)
router.get('/', auth, role(['admin', 'doctor', 'receptionist']), patientController.getPatients);
// Get single patient (self, doctor, admin, receptionist)
router.get('/:id', auth, role(['admin', 'doctor', 'receptionist', 'patient']), patientController.getPatient);
// Update patient (admin, receptionist)
router.put('/:id', auth, role(['admin', 'receptionist']), patientController.updatePatient);
// Delete patient (admin, receptionist)
router.delete('/:id', auth, role(['admin', 'receptionist']), patientController.deletePatient);
// Get patient by user ID (for login/dashboard)
router.get('/by-user/:userId', auth, role(['admin', 'doctor', 'receptionist', 'patient']), patientController.getPatientByUser);

module.exports = router; 