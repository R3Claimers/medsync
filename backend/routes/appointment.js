const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create appointment (admin, receptionist, patient, doctor)
router.post('/', auth, role(['admin', 'receptionist', 'patient', 'doctor']), appointmentController.createAppointment);
// Get appointments for the currently authenticated doctor
router.get('/doctor', auth, role(['doctor']), appointmentController.getDoctorAppointments);
// Get doctor statistics
router.get('/doctor/stats', auth, role(['doctor']), appointmentController.getDoctorStats);
// Update appointment by doctor (doctor can update status and notes)
router.put('/doctor/:id', auth, role(['doctor']), appointmentController.updateAppointmentByDoctor);
// Get patient appointment history
router.get('/patient/:patientId/history', auth, role(['doctor', 'admin', 'receptionist']), appointmentController.getPatientHistory);
// Send appointment reminder
router.post('/:appointmentId/reminder', auth, role(['doctor', 'admin', 'receptionist']), appointmentController.sendAppointmentReminder);
// Get all appointments (admin, receptionist, doctor, patient)
router.get('/', auth, role(['admin', 'receptionist', 'doctor', 'patient']), appointmentController.getAppointments);
// Get single appointment (self, admin, receptionist, doctor)
router.get('/:id', auth, role(['admin', 'receptionist', 'doctor', 'patient']), appointmentController.getAppointment);
// Update appointment (admin, receptionist)
router.put('/:id', auth, role(['admin', 'receptionist']), appointmentController.updateAppointment);
// Delete appointment (admin, receptionist)
router.delete('/:id', auth, role(['admin', 'receptionist']), appointmentController.deleteAppointment);

module.exports = router;