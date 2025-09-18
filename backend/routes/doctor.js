const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create doctor (admin)
router.post('/', auth, role(['admin']), doctorController.createDoctor);
// Get all doctors (admin, receptionist, doctor)
router.get('/', auth, role(['admin', 'receptionist', 'doctor']), doctorController.getDoctors);
// Get doctors by hospital (admin, receptionist, doctor, patient)
router.get('/by-hospital', auth, role(['admin', 'receptionist', 'doctor', 'patient']), doctorController.getDoctorsByHospital);
// Get doctor by user ID (for login/dashboard)
router.get('/by-user/:userId', auth, role(['doctor', 'admin', 'receptionist']), doctorController.getDoctorByUser);
// Get single doctor (self, admin, receptionist)
router.get('/:id', auth, role(['admin', 'receptionist', 'doctor']), doctorController.getDoctor);
// Update doctor (admin or self)
router.put('/:id', auth, role(['admin', 'doctor']), doctorController.updateDoctor);
// Delete doctor (admin)
router.delete('/:id', auth, role(['admin']), doctorController.deleteDoctor);

module.exports = router; 