import express from 'express';
import { body, validationResult } from 'express-validator';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateReview = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Comment must be between 5 and 500 characters')
];

// @route   GET /api/reviews
// @desc    Get reviews with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      productId, 
      customerId, 
      rating, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = { isApproved: true };
    
    if (productId) {
      query.productId = productId;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const reviews = await Review.find(query)
      .populate('customerId', 'name email')
      .populate('productId', 'productName imageUrls')
      .populate('orderId', 'orderNumber')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching reviews'
    });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('productId', 'productName imageUrls')
      .populate('orderId', 'orderNumber');
    
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { review }
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching review'
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private (Customer)
router.post('/', verifyToken, validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can create reviews'
      });
    }
    
    const { productId, rating, comment, title = '', orderId = null, images = [] } = req.body;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ 
      productId, 
      customerId: req.user.id 
    });
    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this product'
      });
    }
    
    // If orderId is provided, verify the order belongs to the customer
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order || order.customerId.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid order or order does not belong to you'
        });
      }
    }
    
    const review = new Review({
      productId,
      customerId: req.user.id,
      orderId,
      rating: parseInt(rating),
      comment,
      title,
      images: Array.isArray(images) ? images : [],
      isVerified: !!orderId
    });
    
    await review.save();
    
    // Update product rating
    await updateProductRating(productId);
    
    res.status(201).json({
      status: 'success',
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating review'
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private (Customer)
router.put('/:id', verifyToken, validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }
    
    // Check if user owns the review
    if (review.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own reviews'
      });
    }
    
    const { rating, comment, title, images } = req.body;
    
    const oldRating = review.rating;
    review.rating = parseInt(rating);
    review.comment = comment;
    review.title = title || review.title;
    review.images = Array.isArray(images) ? images : review.images;
    
    await review.save();
    
    // Update product rating if rating changed
    if (oldRating !== review.rating) {
      await updateProductRating(review.productId);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating review'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private (Customer, Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }
    
    // Check if user owns the review or is admin
    if (review.customerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own reviews'
      });
    }
    
    const productId = review.productId;
    await Review.findByIdAndDelete(req.params.id);
    
    // Update product rating
    await updateProductRating(productId);
    
    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting review'
    });
  }
});

// @route   PUT /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private (Customer)
router.put('/:id/helpful', verifyToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can mark reviews as helpful'
      });
    }
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }
    
    await review.markHelpful();
    
    res.status(200).json({
      status: 'success',
      message: 'Review marked as helpful',
      data: { review }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while marking review as helpful'
    });
  }
});

// @route   PUT /api/reviews/:id/not-helpful
// @desc    Mark review as not helpful
// @access  Private (Customer)
router.put('/:id/not-helpful', verifyToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can mark reviews as not helpful'
      });
    }
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }
    
    await review.markNotHelpful();
    
    res.status(200).json({
      status: 'success',
      message: 'Review marked as not helpful',
      data: { review }
    });
  } catch (error) {
    console.error('Mark not helpful error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while marking review as not helpful'
    });
  }
});

// @route   GET /api/reviews/product/:productId/stats
// @desc    Get product rating statistics
// @access  Public
router.get('/product/:productId/stats', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    const stats = await Review.getProductRatingStats(productId);
    
    res.status(200).json({
      status: 'success',
      data: { 
        stats: stats[0] || { 
          totalReviews: 0, 
          averageRating: 0, 
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
        } 
      }
    });
  } catch (error) {
    console.error('Get product rating stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching product rating statistics'
    });
  }
});

// @route   GET /api/reviews/product/:productId/helpful
// @desc    Get helpful reviews for a product
// @access  Public
router.get('/product/:productId/helpful', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10 } = req.query;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    const reviews = await Review.findHelpful(productId, parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      data: { reviews }
    });
  } catch (error) {
    console.error('Get helpful reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching helpful reviews'
    });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const stats = await Review.getProductRatingStats(productId);
    const ratingData = stats[0];
    
    if (ratingData) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: ratingData.averageRating,
        totalReviews: ratingData.totalReviews
      });
    }
  } catch (error) {
    console.error('Update product rating error:', error);
  }
}

export default router;
