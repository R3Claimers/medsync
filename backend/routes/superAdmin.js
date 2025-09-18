const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/hospitals', auth, role(['super-admin']), superAdminController.createHospitalAndAdmin);
router.get('/hospitals', auth, role(['super-admin']), superAdminController.getAllHospitals);
router.put('/hospitals/:id', auth, role(['super-admin']), superAdminController.updateHospital);
router.delete('/hospitals/:id', auth, role(['super-admin']), superAdminController.deleteHospital);

// Admin management routes
router.post('/admins', auth, role(['super-admin']), superAdminController.createAdmin);
router.put('/admins/:id', auth, role(['super-admin']), superAdminController.updateAdmin);
router.delete('/admins/:id', auth, role(['super-admin']), superAdminController.deleteAdmin);
router.get('/hospitals/:hospitalId/admins', auth, role(['super-admin']), superAdminController.getAdminsByHospital);

module.exports = router; 