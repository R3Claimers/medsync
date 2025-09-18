const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create department (admin)
router.post('/', auth, role(['admin']), departmentController.createDepartment);
// Get all departments (admin, doctor, receptionist)
router.get('/', auth, role(['admin', 'doctor', 'receptionist']), departmentController.getDepartments);
// Get single department (admin, doctor, receptionist)
router.get('/:id', auth, role(['admin', 'doctor', 'receptionist']), departmentController.getDepartment);
// Update department (admin)
router.put('/:id', auth, role(['admin']), departmentController.updateDepartment);
// Delete department (admin)
router.delete('/:id', auth, role(['admin']), departmentController.deleteDepartment);

module.exports = router; 