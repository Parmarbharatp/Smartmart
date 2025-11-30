import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  transactionType: {
    type: String,
    enum: ['credit', 'debit', 'payout', 'refund'],
    required: [true, 'Transaction type is required']
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
  description: {
    type: String,
    default: ''
  },
  // Revenue split information
  revenueType: {
    type: String,
    enum: ['shop_owner', 'delivery_boy', 'admin', 'customer_payment', 'payout'],
    default: null
  },
  // Balance before transaction
  balanceBefore: {
    type: Number,
    default: 0
  },
  // Balance after transaction
  balanceAfter: {
    type: Number,
    default: 0
  },
  // Payment gateway reference (if applicable)
  gatewayTransactionId: {
    type: String,
    default: ''
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  // Related payout ID (if this is a payout transaction)
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout',
    default: null
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
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ revenueType: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for transaction's user
transactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for transaction's order
transactionSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to update updatedAt
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create credit transaction
transactionSchema.statics.createCredit = async function(data) {
  const transaction = new this({
    userId: data.userId,
    orderId: data.orderId || null,
    transactionType: 'credit',
    amount: data.amount,
    currency: data.currency || 'INR',
    description: data.description || '',
    revenueType: data.revenueType || null,
    balanceBefore: data.balanceBefore || 0,
    balanceAfter: data.balanceAfter || 0,
    gatewayTransactionId: data.gatewayTransactionId || '',
    status: 'completed'
  });
  await transaction.save();
  return transaction;
};

// Static method to create debit transaction
transactionSchema.statics.createDebit = async function(data) {
  const transaction = new this({
    userId: data.userId,
    orderId: data.orderId || null,
    transactionType: 'debit',
    amount: data.amount,
    currency: data.currency || 'INR',
    description: data.description || '',
    revenueType: data.revenueType || null,
    balanceBefore: data.balanceBefore || 0,
    balanceAfter: data.balanceAfter || 0,
    payoutId: data.payoutId || null,
    status: data.status || 'completed'
  });
  await transaction.save();
  return transaction;
};

// Static method to get transactions by user
transactionSchema.statics.getUserTransactions = function(userId, filters = {}) {
  const query = { userId };
  
  if (filters.transactionType) {
    query.transactionType = filters.transactionType;
  }
  if (filters.revenueType) {
    query.revenueType = filters.revenueType;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('order', 'orderNumber totalAmount')
    .populate('payoutId', 'payoutId amount status')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .skip(filters.skip || 0);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export { Transaction };

