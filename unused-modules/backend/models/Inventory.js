const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['medicine', 'equipment', 'supplies'], default: 'medicine' },
  currentStock: { type: Number, required: true },
  minStock: { type: Number, required: true },
  maxStock: { type: Number },
  unitPrice: { type: Number },
  expirationDate: { type: Date },
  batchNumber: { type: String },
  supplier: { type: String },
  supplierContact: { type: String },
  location: { type: String }, // Storage location
  status: { type: String, enum: ['available', 'low-stock', 'out-of-stock', 'expired'], default: 'available' },
  lastRestockDate: { type: Date },
  alertThreshold: { type: Number }, // Custom alert threshold (overrides minStock)
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true }
}, { timestamps: true });

// Add virtual for stock status
InventorySchema.virtual('stockStatus').get(function() {
  const threshold = this.alertThreshold || this.minStock;
  if (this.currentStock <= 0) return 'out-of-stock';
  if (this.currentStock <= threshold) return 'low-stock';
  return 'available';
});

// Add virtual for days until expiration
InventorySchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expirationDate) return null;
  const today = new Date();
  const expiry = new Date(this.expirationDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Inventory', InventorySchema); 