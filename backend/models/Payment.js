import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
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
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash_on_delivery', 'credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // Payment gateway specific fields
  gatewayTransactionId: {
    type: String,
    default: ''
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Additional payment fields
  paymentDate: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date,
    default: null
  },
  refundReason: {
    type: String,
    default: ''
  },
  // UPI specific fields
  upiId: {
    type: String,
    default: ''
  },
  // Card specific fields
  cardLast4: {
    type: String,
    default: ''
  },
  cardType: {
    type: String,
    default: ''
  },
  // Bank specific fields
  bankName: {
    type: String,
    default: ''
  },
  accountNumber: {
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
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ shopId: 1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for payment's order
paymentSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for payment's customer
paymentSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for payment's shop
paymentSchema.virtual('shop', {
  ref: 'Shop',
  localField: 'shopId',
  foreignField: '_id',
  justOne: true
});

// Generate payment ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.paymentId = `PAY-${timestamp}-${random}`;
  }
  
  this.updatedAt = new Date();
  next();
});

// Static method to find payments by customer
paymentSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customerId })
    .populate('order', 'orderNumber totalAmount status')
    .populate('shop', 'shopName')
    .sort({ createdAt: -1 });
};

// Static method to find payments by shop
paymentSchema.statics.findByShop = function(shopId) {
  return this.find({ shopId })
    .populate('order', 'orderNumber totalAmount status')
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find payments by status
paymentSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('order', 'orderNumber totalAmount')
    .populate('customer', 'name email')
    .populate('shop', 'shopName')
    .sort({ createdAt: -1 });
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(filters = {}) {
  const matchStage = {};
  
  if (filters.shopId) matchStage.shopId = filters.shopId;
  if (filters.customerId) matchStage.customerId = filters.customerId;
  if (filters.status) matchStage.status = filters.status;
  if (filters.paymentMethod) matchStage.paymentMethod = filters.paymentMethod;
  if (filters.dateFrom || filters.dateTo) {
    matchStage.createdAt = {};
    if (filters.dateFrom) matchStage.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance method to mark payment as completed
paymentSchema.methods.markCompleted = function(gatewayTransactionId = '', gatewayResponse = {}) {
  this.status = 'completed';
  this.paymentDate = new Date();
  this.gatewayTransactionId = gatewayTransactionId;
  this.gatewayResponse = gatewayResponse;
  
  return this.save();
};

// Instance method to mark payment as failed
paymentSchema.methods.markFailed = function(failureReason = '') {
  this.status = 'failed';
  this.failureReason = failureReason;
  
  return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function(refundAmount, refundReason = '') {
  this.status = 'refunded';
  this.refundAmount = refundAmount;
  this.refundDate = new Date();
  this.refundReason = refundReason;
  
  return this.save();
};

// Instance method to cancel payment
paymentSchema.methods.cancelPayment = function() {
  this.status = 'cancelled';
  
  return this.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

export { Payment };
