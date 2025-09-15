import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
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
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
    unique: true
  },
  items: [cartItemSchema],
  // Additional cart fields
  totalItems: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
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
cartSchema.index({ customerId: 1 });
cartSchema.index({ lastUpdated: -1 });

// Virtual for cart's customer
cartSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for cart's products
cartSchema.virtual('products', {
  ref: 'Product',
  localField: 'items.productId',
  foreignField: '_id'
});

// Update timestamp and totals on save
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastUpdated = new Date();
  
  // Calculate totals
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  next();
});

// Static method to find cart by customer
cartSchema.statics.findByCustomer = function(customerId) {
  return this.findOne({ customerId })
    .populate('items.productId', 'productName price imageUrls stockQuantity status');
};

// Static method to create or get cart for customer
cartSchema.statics.getOrCreateCart = function(customerId) {
  return this.findOneAndUpdate(
    { customerId },
    { customerId },
    { upsert: true, new: true }
  ).populate('items.productId', 'productName price imageUrls stockQuantity status');
};

// Instance method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1) {
  const existingItem = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ productId, quantity });
  }
  
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.productId.toString() !== productId.toString()
  );
  
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    } else {
      item.quantity = quantity;
    }
  }
  
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.totalItems = 0;
  this.totalAmount = 0;
  
  return this.save();
};

// Instance method to calculate cart total
cartSchema.methods.calculateTotal = async function() {
  const Product = mongoose.model('Product');
  
  let totalAmount = 0;
  let totalItems = 0;
  
  for (const item of this.items) {
    const product = await Product.findById(item.productId);
    if (product && product.status === 'available') {
      totalAmount += product.price * item.quantity;
      totalItems += item.quantity;
    }
  }
  
  this.totalAmount = totalAmount;
  this.totalItems = totalItems;
  
  return this.save();
};

// Instance method to validate cart items
cartSchema.methods.validateItems = async function() {
  const Product = mongoose.model('Product');
  const validItems = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.productId);
    
    if (product && product.status === 'available' && product.stockQuantity >= item.quantity) {
      validItems.push(item);
    }
  }
  
  this.items = validItems;
  return this.save();
};

// Instance method to get cart summary
cartSchema.methods.getSummary = async function() {
  const Product = mongoose.model('Product');
  
  const summary = {
    totalItems: 0,
    totalAmount: 0,
    items: []
  };
  
  for (const item of this.items) {
    const product = await Product.findById(item.productId);
    if (product && product.status === 'available') {
      const itemTotal = product.price * item.quantity;
      summary.totalItems += item.quantity;
      summary.totalAmount += itemTotal;
      summary.items.push({
        productId: item.productId,
        productName: product.productName,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
        imageUrl: product.imageUrls[0] || ''
      });
    }
  }
  
  return summary;
};

const Cart = mongoose.model('Cart', cartSchema);

export { Cart };
