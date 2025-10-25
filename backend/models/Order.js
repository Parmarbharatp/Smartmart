import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required']
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      return `ORD-${timestamp}-${random}`;
    }
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    type: String,
    trim: true,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'credit_card', 'debit_card', 'upi', 'net_banking'],
    default: 'cash_on_delivery'
  },
  paymentId: {
    type: String,
    default: ''
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed'],
    default: null
  },
  deliveryNotes: {
    type: String,
    default: ''
  },
  items: [orderItemSchema],
  // Additional order fields
  shippingCost: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: ''
  },
  estimatedDeliveryDate: {
    type: Date,
    default: null
  },
  actualDeliveryDate: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancellationDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
orderSchema.index({ customerId: 1 });
orderSchema.index({ shopId: 1 });
orderSchema.index({ deliveryBoyId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order's customer
orderSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for order's shop
orderSchema.virtual('shop', {
  ref: 'Shop',
  localField: 'shopId',
  foreignField: '_id',
  justOne: true
});

// Virtual for order's delivery boy
orderSchema.virtual('deliveryBoy', {
  ref: 'User',
  localField: 'deliveryBoyId',
  foreignField: '_id',
  justOne: true
});

// Virtual for order's products
orderSchema.virtual('products', {
  ref: 'Product',
  localField: 'items.productId',
  foreignField: '_id'
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  
  this.updatedAt = new Date();
  next();
});

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

// Static method to find orders by shop
orderSchema.statics.findByShop = function(shopId) {
  return this.find({ shopId }).sort({ createdAt: -1 });
};

// Static method to find orders by delivery boy
orderSchema.statics.findByDeliveryBoy = function(deliveryBoyId) {
  return this.find({ deliveryBoyId }).sort({ createdAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(filters = {}) {
  const matchStage = {};
  
  if (filters.shopId) matchStage.shopId = filters.shopId;
  if (filters.customerId) matchStage.customerId = filters.customerId;
  if (filters.status) matchStage.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    matchStage.orderDate = {};
    if (filters.dateFrom) matchStage.orderDate.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.orderDate.$lte = new Date(filters.dateTo);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmedCount: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        shippedCount: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
        deliveredCount: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        refundedCount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } }
      }
    }
  ]);
};

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  this.notes = notes;
  
  if (newStatus === 'delivered') {
    this.actualDeliveryDate = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancellationDate = new Date();
  }
  
  return this.save();
};

// Instance method to assign delivery boy
orderSchema.methods.assignDeliveryBoy = function(deliveryBoyId) {
  this.deliveryBoyId = deliveryBoyId;
  this.deliveryStatus = 'assigned';
  return this.save();
};

// Instance method to calculate order total
orderSchema.methods.calculateTotal = function() {
  const itemsTotal = this.items.reduce((sum, item) => {
    return sum + (item.priceAtPurchase * item.quantity);
  }, 0);
  
  this.totalAmount = itemsTotal + this.shippingCost + this.taxAmount - this.discountAmount;
  return this.totalAmount;
};

// Instance method to mark payment as completed when delivery is successful
orderSchema.methods.completePaymentOnDelivery = function() {
  if (this.status === 'delivered' && this.paymentStatus === 'pending') {
    this.paymentStatus = 'paid';
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to check if order is fully completed (delivered and paid)
orderSchema.methods.isFullyCompleted = function() {
  return this.status === 'delivered' && this.paymentStatus === 'paid';
};

const Order = mongoose.model('Order', orderSchema);

export { Order };
