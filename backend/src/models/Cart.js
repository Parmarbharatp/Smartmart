const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for total price
cartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Pre-save middleware to update updatedAt
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get cart by user
cartSchema.statics.getByUser = function(userId) {
  return this.findOne({ user: userId })
    .populate('items.product', 'name price images stock isActive');
};

// Instance method to add item
cartSchema.methods.addItem = function(productId, quantity, price, variant = null) {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    (!variant || JSON.stringify(item.variant) === JSON.stringify(variant))
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      price,
      variant
    });
  }

  return this.save();
};

// Instance method to remove item
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      this.removeItem(itemId);
    } else {
      item.quantity = quantity;
    }
  }
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clear = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema); 