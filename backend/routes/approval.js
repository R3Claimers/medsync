const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Get all approvals (admin only)
router.get('/', auth, role(['admin']), approvalController.getApprovals);

// Approve/deny a user registration
router.put('/:id', auth, role(['admin']), approvalController.updateApproval);

module.exports = router;
