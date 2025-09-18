const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Get all activities for admin's hospital
router.get('/', auth, role(['admin', 'super-admin']), activityController.getActivities);

// Get activity statistics
router.get('/stats', auth, role(['admin', 'super-admin']), activityController.getActivityStats);

module.exports = router;
