import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  contactInfo: {
    type: String,
    required: [true, 'Contact information is required'],
    trim: true,
    maxlength: [100, 'Contact info cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  imageUrl: {
    type: String,
    default: ''
  },
  // Additional fields for better shop management
  businessLicense: {
    type: String,
    default: ''
  },
  taxId: {
    type: String,
    default: ''
  },
  openingHours: {
    type: String,
    default: '9:00 AM - 9:00 PM'
  },
  deliveryRadius: {
    type: Number,
    default: 10 // in kilometers
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
  toObject: { virtuals: true },
  // Use a separate collection to avoid conflicts with existing `shops`
  collection: 'owner_shops'
});

// Indexes for better query performance
// Ensure one shop per owner
shopSchema.index({ ownerId: 1 }, { unique: true });
shopSchema.index({ status: 1 });
// Make shop names globally unique and searchable
shopSchema.index({ shopName: 1 }, { unique: true });
shopSchema.index({ shopName: 'text', description: 'text' });
shopSchema.index({ createdAt: -1 });

// Virtual for shop's products count
shopSchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'shopId',
  count: true
});

// Virtual for shop's orders count
shopSchema.virtual('ordersCount', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'shopId',
  count: true
});

// Update timestamp on save
shopSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find shops by status
shopSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to find shops by owner
shopSchema.statics.findByOwner = function(ownerId) {
  return this.find({ ownerId });
};

// Instance method to get shop statistics
shopSchema.methods.getStats = async function() {
  const Product = mongoose.model('Product');
  const Order = mongoose.model('Order');
  
  const productsCount = await Product.countDocuments({ shopId: this._id });
  const ordersCount = await Order.countDocuments({ shopId: this._id });
  const totalRevenue = await Order.aggregate([
    { $match: { shopId: this._id, status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  return {
    productsCount,
    ordersCount,
    totalRevenue: totalRevenue[0]?.total || 0
  };
};

const Shop = mongoose.model('Shop', shopSchema);

export { Shop };
