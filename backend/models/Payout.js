import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  payoutId: {
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
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Payout method
  payoutMethod: {
    type: String,
    enum: ['upi', 'bank_transfer', 'wallet'],
    required: [true, 'Payout method is required']
  },
  // UPI details
  upiId: {
    type: String,
    default: ''
  },
  // Bank transfer details
  bankAccountNumber: {
    type: String,
    default: ''
  },
  bankAccountName: {
    type: String,
    default: ''
  },
  bankIFSC: {
    type: String,
    default: ''
  },
  bankName: {
    type: String,
    default: ''
  },
  // Request details
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date,
    default: null
  },
  // Admin processing
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Failure reason
  failureReason: {
    type: String,
    default: ''
  },
  // Transaction reference (simulated UPI/bank transfer ID)
  transactionReference: {
    type: String,
    default: ''
  },
  // Notes
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
payoutSchema.index({ userId: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ payoutId: 1 });
payoutSchema.index({ createdAt: -1 });

// Virtual for payout's user
payoutSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for payout's processor
payoutSchema.virtual('processor', {
  ref: 'User',
  localField: 'processedBy',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to generate payout ID and update updatedAt
payoutSchema.pre('save', function(next) {
  if (!this.payoutId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.payoutId = `POUT-${timestamp}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

// Instance method to mark as processing
payoutSchema.methods.markProcessing = function(processedBy) {
  this.status = 'processing';
  this.processedBy = processedBy;
  this.processedDate = new Date();
  return this.save();
};

// Instance method to mark as completed
payoutSchema.methods.markCompleted = function(transactionReference = '') {
  this.status = 'completed';
  this.processedDate = new Date();
  this.transactionReference = transactionReference;
  return this.save();
};

// Instance method to mark as failed
payoutSchema.methods.markFailed = function(failureReason = '') {
  this.status = 'failed';
  this.failureReason = failureReason;
  this.processedDate = new Date();
  return this.save();
};

// Instance method to cancel
payoutSchema.methods.cancel = function(notes = '') {
  this.status = 'cancelled';
  this.notes = notes;
  return this.save();
};

// Static method to get payouts by user
payoutSchema.statics.getUserPayouts = function(userId, filters = {}) {
  const query = { userId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('user', 'name email role')
    .populate('processedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50)
    .skip(filters.skip || 0);
};

// Static method to get all payouts (for admin)
payoutSchema.statics.getAllPayouts = function(filters = {}) {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.userId) {
    query.userId = filters.userId;
  }
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('user', 'name email role')
    .populate('processedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .skip(filters.skip || 0);
};

const Payout = mongoose.model('Payout', payoutSchema);

export { Payout };

