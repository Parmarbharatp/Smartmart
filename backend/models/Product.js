import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  imageUrls: [{
    type: String,
    default: []
  }],
  status: {
    type: String,
    enum: ['available', 'out_of_stock', 'discontinued'],
    default: 'available'
  },
  // Additional product fields
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  weight: {
    type: Number,
    default: 0 // in grams
  },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 }
  },
  brand: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Rating and review fields
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalSold: {
    type: Number,
    default: 0
  },
  // SEO fields
  metaTitle: {
    type: String,
    default: ''
  },
  metaDescription: {
    type: String,
    default: ''
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
  // Use a separate collection to avoid conflicts with existing `products`
  collection: 'owner_products'
});

// Indexes for better query performance
productSchema.index({ shopId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ productName: 'text', description: 'text', brand: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sku: 1 });
// Ensure product name is unique within a shop
productSchema.index({ shopId: 1, productName: 1 }, { unique: true });

// Virtual for product's reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId'
});

// Virtual for product's orders
productSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'items.productId'
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate SKU if not provided
  if (!this.sku) {
    this.sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Update status based on stock
  if (this.stockQuantity === 0) {
    this.status = 'out_of_stock';
  } else if (this.stockQuantity > 0 && this.status === 'out_of_stock') {
    this.status = 'available';
  }
  
  next();
});

// Static method to find products by shop
productSchema.statics.findByShop = function(shopId) {
  return this.find({ shopId });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(categoryId) {
  return this.find({ categoryId });
};

// Static method to find available products
productSchema.statics.findAvailable = function() {
  return this.find({ status: 'available', isActive: true });
};

// Static method to search products
productSchema.statics.searchProducts = function(query, filters = {}) {
  const searchQuery = {
    $and: [
      { isActive: true },
      { status: 'available' },
      {
        $or: [
          { productName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  };
  
  // Apply additional filters
  if (filters.categoryId) {
    searchQuery.$and.push({ categoryId: filters.categoryId });
  }
  if (filters.shopId) {
    searchQuery.$and.push({ shopId: filters.shopId });
  }
  if (filters.minPrice || filters.maxPrice) {
    const priceFilter = {};
    if (filters.minPrice) priceFilter.$gte = filters.minPrice;
    if (filters.maxPrice) priceFilter.$lte = filters.maxPrice;
    searchQuery.$and.push({ price: priceFilter });
  }
  
  return this.find(searchQuery);
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
    this.totalSold += quantity;
  } else if (operation === 'add') {
    this.stockQuantity += quantity;
  }
  
  return this.save();
};

// Instance method to calculate discount
productSchema.methods.calculateDiscount = function(originalPrice) {
  if (originalPrice > this.price) {
    return Math.round(((originalPrice - this.price) / originalPrice) * 100);
  }
  return 0;
};

const Product = mongoose.model('Product', productSchema);

export { Product };
