const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true
    },
    variant: {
      name: String,
      option: String
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    cost: {
      type: Number,
      default: 0
    },
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date
  },
  discount: {
    amount: {
      type: Number,
      default: 0
    },
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    }
  },
  total: {
    type: Number,
    required: true
  },
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'cash_on_delivery'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  billingAddress: {
    name: String,
    email: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingAddress: {
    name: String,
    email: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: String,
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
  return {
    itemsCount: this.items.length,
    totalItems: this.items.reduce((sum, item) => sum + item.quantity, 0),
    status: this.status,
    total: this.total
  };
});

// Virtual for is paid
orderSchema.virtual('isPaid').get(function() {
  return this.payment.status === 'paid';
});

// Virtual for can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of orders for today
    const todayOrders = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), date.getDate()),
        $lt: new Date(year, date.getMonth(), date.getDate() + 1)
      }
    });
    
    this.orderNumber = `BOLT-${year}${month}${day}-${String(todayOrders + 1).padStart(4, '0')}`;
  }
  
  // Add status to history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  
  next();
});

// Static method to get orders by status
orderSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('user', 'name email')
    .populate('items.product', 'name images price')
    .sort('-createdAt');
};

// Static method to get user orders
orderSchema.statics.getUserOrders = function(userId) {
  return this.find({ user: userId })
    .populate('items.product', 'name images price')
    .sort('-createdAt');
};

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note
  });
  
  // Set specific timestamps
  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  return this.save();
};

// Instance method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + this.tax + this.shipping.cost - this.discount.amount;
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema); 