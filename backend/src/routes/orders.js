const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getUserOrders
} = require('../controllers/orders');

const router = express.Router();

// Validation middleware
const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Please provide valid product IDs'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('billingAddress')
    .isObject()
    .withMessage('Billing address is required')
];

const orderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status')
];

// Protected routes
router.use(protect);

// User routes
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrder);
router.post('/', orderValidation, createOrder);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.get('/', authorize('admin'), getOrders);
router.put('/:id/status', authorize('admin'), orderStatusValidation, updateOrderStatus);

module.exports = router; 