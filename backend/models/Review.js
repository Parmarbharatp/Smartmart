import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  // Additional review fields
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  images: [{
    type: String,
    default: []
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isHelpful: {
    type: Number,
    default: 0
  },
  isNotHelpful: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  moderationNotes: {
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
reviewSchema.index({ productId: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ orderId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate reviews
reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });

// Virtual for review's customer
reviewSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for review's product
reviewSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Virtual for review's order
reviewSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Update timestamp on save
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find reviews by product
reviewSchema.statics.findByProduct = function(productId, options = {}) {
  const query = { productId, isApproved: true };
  
  if (options.rating) {
    query.rating = options.rating;
  }
  
  return this.find(query)
    .populate('customer', 'name email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to find reviews by customer
reviewSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customerId })
    .populate('product', 'productName imageUrls')
    .sort({ createdAt: -1 });
};

// Static method to get product rating statistics
reviewSchema.statics.getProductRatingStats = function(productId) {
  return this.aggregate([
    { $match: { productId, isApproved: true } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: {
          $reduce: {
            input: '$ratingDistribution',
            initialValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [
                      {
                        k: { $toString: '$$this' },
                        v: { $add: [{ $arrayElemAt: ['$$value', { $subtract: ['$$this', 1] }] }, 1] }
                      }
                    ]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Static method to find helpful reviews
reviewSchema.statics.findHelpful = function(productId, limit = 10) {
  return this.find({ productId, isApproved: true })
    .populate('customer', 'name email')
    .sort({ isHelpful: -1, createdAt: -1 })
    .limit(limit);
};

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = function() {
  this.isHelpful += 1;
  return this.save();
};

// Instance method to mark as not helpful
reviewSchema.methods.markNotHelpful = function() {
  this.isNotHelpful += 1;
  return this.save();
};

// Instance method to approve review
reviewSchema.methods.approve = function() {
  this.isApproved = true;
  return this.save();
};

// Instance method to reject review
reviewSchema.methods.reject = function(notes = '') {
  this.isApproved = false;
  this.moderationNotes = notes;
  return this.save();
};

const Review = mongoose.model('Review', reviewSchema);

export { Review };
