import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  isBuiltIn: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  imageUrl: {
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
  toObject: { virtuals: true }
});

// Indexes for better query performance
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ isBuiltIn: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ createdAt: -1 });

// Virtual for products count in this category
categorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Update timestamp on save
categorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find built-in categories
categorySchema.statics.findBuiltIn = function() {
  return this.find({ isBuiltIn: true });
};

// Static method to find custom categories
categorySchema.statics.findCustom = function() {
  return this.find({ isBuiltIn: false });
};

// Static method to find active categories
categorySchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

const Category = mongoose.model('Category', categorySchema);

export { Category };
