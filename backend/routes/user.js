const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/', auth, role(['admin']), userController.createUser);

// Change password route
router.post('/:userId/change-password', userController.changePassword);

router.put('/:userId', auth, role(['admin']), userController.updateUser);

router.delete('/:userId', auth, role(['admin']), userController.deleteUser);

router.patch('/:userId/toggle-active', auth, role(['admin']), userController.toggleUserActive);

router.get('/', auth, role(['admin']), userController.getUsers);

module.exports = router; 