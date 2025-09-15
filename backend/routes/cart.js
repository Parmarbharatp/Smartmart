import express from 'express';
import { body, validationResult } from 'express-validator';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateCartItem = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private (Customer)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can access cart'
      });
    }
    
    const cart = await Cart.findByCustomer(req.user.id);
    
    if (!cart) {
      // Create empty cart if doesn't exist
      const newCart = await Cart.getOrCreateCart(req.user.id);
      return res.status(200).json({
        status: 'success',
        data: { cart: newCart }
      });
    }
    
    // Validate and update cart items
    await cart.validateItems();
    await cart.calculateTotal();
    
    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching cart'
    });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private (Customer)
router.post('/add', verifyToken, validateCartItem, async (req, res) => {
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
        message: 'Only customers can add items to cart'
      });
    }
    
    const { productId, quantity } = req.body;
    
    // Verify product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    if (product.status !== 'available') {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not available'
      });
    }
    
    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient stock. Available: ${product.stockQuantity}`
      });
    }
    
    // Get or create cart
    const cart = await Cart.getOrCreateCart(req.user.id);
    
    // Check if item already exists in cart and validate total quantity
    const existingItem = cart.items.find(item => 
      item.productId.toString() === productId.toString()
    );
    
    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    
    if (totalQuantity > product.stockQuantity) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot add ${quantity} more items. Total would exceed available stock of ${product.stockQuantity}`
      });
    }
    
    // Add item to cart
    await cart.addItem(productId, quantity);
    await cart.calculateTotal();
    
    res.status(200).json({
      status: 'success',
      message: 'Item added to cart successfully',
      data: { cart }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while adding item to cart'
    });
  }
});

// @route   PUT /api/cart/update
// @desc    Update item quantity in cart
// @access  Private (Customer)
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required'
      });
    }
    
    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity cannot be negative'
      });
    }
    
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can update cart'
      });
    }
    
    // Verify product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    if (product.status !== 'available') {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not available'
      });
    }
    
    if (quantity > product.stockQuantity) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient stock. Available: ${product.stockQuantity}`
      });
    }
    
    // Get cart
    const cart = await Cart.findByCustomer(req.user.id);
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }
    
    // Update item quantity
    await cart.updateItemQuantity(productId, quantity);
    await cart.calculateTotal();
    
    res.status(200).json({
      status: 'success',
      message: 'Cart updated successfully',
      data: { cart }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating cart'
    });
  }
});

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private (Customer)
router.delete('/remove/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can remove items from cart'
      });
    }
    
    // Get cart
    const cart = await Cart.findByCustomer(req.user.id);
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }
    
    // Remove item from cart
    await cart.removeItem(productId);
    await cart.calculateTotal();
    
    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart successfully',
      data: { cart }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while removing item from cart'
    });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear cart
// @access  Private (Customer)
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can clear cart'
      });
    }
    
    // Get cart
    const cart = await Cart.findByCustomer(req.user.id);
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }
    
    // Clear cart
    await cart.clearCart();
    
    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully',
      data: { cart }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while clearing cart'
    });
  }
});

// @route   GET /api/cart/summary
// @desc    Get cart summary
// @access  Private (Customer)
router.get('/summary', verifyToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can access cart summary'
      });
    }
    
    // Get cart
    const cart = await Cart.findByCustomer(req.user.id);
    if (!cart) {
      return res.status(200).json({
        status: 'success',
        data: {
          summary: {
            totalItems: 0,
            totalAmount: 0,
            items: []
          }
        }
      });
    }
    
    // Validate items and get summary
    await cart.validateItems();
    const summary = await cart.getSummary();
    
    res.status(200).json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching cart summary'
    });
  }
});

// @route   POST /api/cart/validate
// @desc    Validate cart items
// @access  Private (Customer)
router.post('/validate', verifyToken, async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can validate cart'
      });
    }
    
    // Get cart
    const cart = await Cart.findByCustomer(req.user.id);
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      });
    }
    
    // Validate items
    await cart.validateItems();
    await cart.calculateTotal();
    
    res.status(200).json({
      status: 'success',
      message: 'Cart validated successfully',
      data: { cart }
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while validating cart'
    });
  }
});

// @route   POST /api/cart/check-stock
// @desc    Check stock availability for a product
// @access  Private (Customer)
router.post('/check-stock', verifyToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can check stock'
      });
    }
    
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required'
      });
    }
    
    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Check if product is available
    if (product.status !== 'available') {
      return res.status(400).json({
        status: 'error',
        message: 'Product is not available',
        data: { available: false, stockQuantity: 0 }
      });
    }
    
    // Check stock
    const available = product.stockQuantity >= quantity;
    
    res.status(200).json({
      status: 'success',
      data: {
        available,
        stockQuantity: product.stockQuantity,
        requestedQuantity: quantity,
        message: available 
          ? 'Product is available' 
          : `Only ${product.stockQuantity} items available in stock`
      }
    });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while checking stock'
    });
  }
});

export default router;
