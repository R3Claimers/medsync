const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create prescription (doctor only)
router.post('/', auth, role(['doctor']), prescriptionController.createPrescription);
// Get all prescriptions (doctor, patient)
router.get('/', auth, role(['doctor', 'patient']), prescriptionController.getPrescriptions);
// Get single prescription (self, doctor)
router.get('/:id', auth, role(['doctor', 'patient']), prescriptionController.getPrescription);
// Update prescription (doctor only)
router.put('/:id', auth, role(['doctor']), prescriptionController.updatePrescription);
// Delete prescription (doctor only)
router.delete('/:id', auth, role(['doctor']), prescriptionController.deletePrescription);

module.exports = router; 