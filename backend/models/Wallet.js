import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  // Pending balance (from orders not yet delivered)
  pendingBalance: {
    type: Number,
    default: 0,
    min: [0, 'Pending balance cannot be negative']
  },
  // Total earnings (cumulative)
  totalEarnings: {
    type: Number,
    default: 0,
    min: [0, 'Total earnings cannot be negative']
  },
  // Total withdrawn
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: [0, 'Total withdrawn cannot be negative']
  },
  // Last transaction date
  lastTransactionDate: {
    type: Date,
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
walletSchema.index({ userId: 1 });
walletSchema.index({ balance: -1 });

// Virtual for wallet's user
walletSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to update updatedAt
walletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get or create wallet for user
walletSchema.statics.getOrCreateWallet = async function(userId) {
  let wallet = await this.findOne({ userId });
  if (!wallet) {
    wallet = new this({ userId, balance: 0, pendingBalance: 0 });
    await wallet.save();
  }
  return wallet;
};

// Instance method to add balance
walletSchema.methods.addBalance = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  this.balance += amount;
  this.totalEarnings += amount;
  this.lastTransactionDate = new Date();
  await this.save();
  return this;
};

// Instance method to deduct balance
walletSchema.methods.deductBalance = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance -= amount;
  this.totalWithdrawn += amount;
  this.lastTransactionDate = new Date();
  await this.save();
  return this;
};

// Instance method to add pending balance
walletSchema.methods.addPendingBalance = async function(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  this.pendingBalance += amount;
  await this.save();
  return this;
};

// Instance method to move pending to balance (when order is delivered)
walletSchema.methods.confirmPendingBalance = async function(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  if (this.pendingBalance < amount) {
    throw new Error('Insufficient pending balance');
  }
  this.pendingBalance -= amount;
  this.balance += amount;
  this.totalEarnings += amount;
  this.lastTransactionDate = new Date();
  await this.save();
  return this;
};

const Wallet = mongoose.model('Wallet', walletSchema);

export { Wallet };

