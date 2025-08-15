const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be greater than or equal to 0']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price must be greater than or equal to 0']
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please add a category']
  },
  shop: {
    type: mongoose.Schema.ObjectId,
    ref: 'Shop',
    required: [true, 'Please add a shop']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      name: String,
      price: Number,
      stock: {
        type: Number,
        default: 0
      },
      sku: String
    }]
  }],
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: String,
  weight: {
    type: Number,
    min: [0, 'Weight must be greater than or equal to 0']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePercentage: {
    type: Number,
    min: [0, 'Sale percentage must be greater than or equal to 0'],
    max: [100, 'Sale percentage cannot be more than 100']
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for sale price
productSchema.virtual('salePrice').get(function() {
  if (this.isOnSale && this.salePercentage > 0) {
    return this.price - (this.price * this.salePercentage / 100);
  }
  return this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return this.salePercentage || 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Index for search
productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
});

// Pre-save middleware to ensure at least one image is primary
productSchema.pre('save', function(next) {
  if (this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }
  next();
});

// Static method to get featured products
productSchema.statics.getFeatured = function() {
  return this.find({ isFeatured: true, isActive: true })
    .populate('category', 'name')
    .populate('shop', 'name');
};

// Static method to get products on sale
productSchema.statics.getOnSale = function() {
  return this.find({ isOnSale: true, isActive: true })
    .populate('category', 'name')
    .populate('shop', 'name');
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity) {
  this.stock = Math.max(0, this.stock + quantity);
  return this.save();
};

// Instance method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.stock > 0;
};

module.exports = mongoose.model('Product', productSchema); 