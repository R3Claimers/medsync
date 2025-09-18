const Inventory = require('../models/Inventory');

// Create inventory item (pharmacist, admin)
exports.createInventory = async (req, res) => {
  try {
    const { 
      name, description, category, currentStock, minStock, maxStock, 
      unitPrice, expirationDate, batchNumber, supplier, supplierContact, 
      location, alertThreshold, hospitalId 
    } = req.body;
    
    const inventory = new Inventory({ 
      name, description, category, currentStock, minStock, maxStock,
      unitPrice, expirationDate, batchNumber, supplier, supplierContact,
      location, alertThreshold, hospitalId
    });
    
    await inventory.save();
    res.status(201).json({ inventory });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all inventory items with enhanced filtering (pharmacist, admin, doctor)
exports.getInventories = async (req, res) => {
  try {
    const { category, status, lowStock, expiringSoon } = req.query;
    let filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    const inventories = await Inventory.find(filter).populate('hospitalId');
    
    // Apply additional filters
    let filteredInventories = inventories;
    
    if (lowStock === 'true') {
      filteredInventories = filteredInventories.filter(item => {
        const threshold = item.alertThreshold || item.minStock;
        return item.currentStock <= threshold;
      });
    }
    
    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filteredInventories = filteredInventories.filter(item => 
        item.expirationDate && item.expirationDate <= thirtyDaysFromNow
      );
    }
    
    res.json({ inventories: filteredInventories });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get inventory alerts (pharmacist, admin)
exports.getInventoryAlerts = async (req, res) => {
  try {
    const inventories = await Inventory.find().populate('hospitalId');
    
    const alerts = {
      lowStock: [],
      outOfStock: [],
      expiringSoon: [],
      expired: []
    };
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    inventories.forEach(item => {
      const threshold = item.alertThreshold || item.minStock;
      
      // Stock alerts
      if (item.currentStock <= 0) {
        alerts.outOfStock.push(item);
      } else if (item.currentStock <= threshold) {
        alerts.lowStock.push(item);
      }
      
      // Expiration alerts
      if (item.expirationDate) {
        if (item.expirationDate <= today) {
          alerts.expired.push(item);
        } else if (item.expirationDate <= thirtyDaysFromNow) {
          alerts.expiringSoon.push(item);
        }
      }
    });
    
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single inventory item (pharmacist, admin, doctor)
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update inventory item (pharmacist, admin)
exports.updateInventory = async (req, res) => {
  try {
    const { 
      name, description, category, currentStock, minStock, maxStock,
      unitPrice, expirationDate, batchNumber, supplier, supplierContact,
      location, alertThreshold, status, lastRestockDate
    } = req.body;
    
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    
    // Update fields
    if (name) inventory.name = name;
    if (description) inventory.description = description;
    if (category) inventory.category = category;
    if (currentStock !== undefined) inventory.currentStock = currentStock;
    if (minStock !== undefined) inventory.minStock = minStock;
    if (maxStock !== undefined) inventory.maxStock = maxStock;
    if (unitPrice !== undefined) inventory.unitPrice = unitPrice;
    if (expirationDate) inventory.expirationDate = expirationDate;
    if (batchNumber) inventory.batchNumber = batchNumber;
    if (supplier) inventory.supplier = supplier;
    if (supplierContact) inventory.supplierContact = supplierContact;
    if (location) inventory.location = location;
    if (alertThreshold !== undefined) inventory.alertThreshold = alertThreshold;
    if (status) inventory.status = status;
    if (lastRestockDate) inventory.lastRestockDate = lastRestockDate;
    
    await inventory.save();
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Restock inventory item (pharmacist, admin)
exports.restockInventory = async (req, res) => {
  try {
    const { addStock, newBatchNumber, newExpirationDate } = req.body;
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    
    inventory.currentStock += addStock;
    inventory.lastRestockDate = new Date();
    if (newBatchNumber) inventory.batchNumber = newBatchNumber;
    if (newExpirationDate) inventory.expirationDate = newExpirationDate;
    
    await inventory.save();
    res.json({ inventory, message: 'Inventory restocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete inventory item (pharmacist, admin)
exports.deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) return res.status(404).json({ message: 'Inventory item not found' });
    await inventory.deleteOne();
    res.json({ message: 'Inventory item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 