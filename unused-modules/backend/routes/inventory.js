const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Create inventory item (pharmacist, admin)
router.post('/', auth, role(['pharmacist', 'admin']), inventoryController.createInventory);
// Get all inventory items (pharmacist, admin, doctor)
router.get('/', auth, role(['pharmacist', 'admin', 'doctor']), inventoryController.getInventories);
// Get inventory alerts (pharmacist, admin)
router.get('/alerts', auth, role(['pharmacist', 'admin']), inventoryController.getInventoryAlerts);
// Get single inventory item (pharmacist, admin, doctor)
router.get('/:id', auth, role(['pharmacist', 'admin', 'doctor']), inventoryController.getInventory);
// Update inventory item (pharmacist, admin)
router.put('/:id', auth, role(['pharmacist', 'admin']), inventoryController.updateInventory);
// Restock inventory item (pharmacist, admin)
router.put('/:id/restock', auth, role(['pharmacist', 'admin']), inventoryController.restockInventory);
// Delete inventory item (pharmacist, admin)
router.delete('/:id', auth, role(['pharmacist', 'admin']), inventoryController.deleteInventory);

module.exports = router; 