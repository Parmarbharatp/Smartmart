const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cart');

const router = express.Router();

// Validation middleware
const cartItemValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Please provide a valid product ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/add', cartItemValidation, addToCart);
router.put('/update/:itemId', cartItemValidation, updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router; 