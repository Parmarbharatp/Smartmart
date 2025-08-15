const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  searchProducts,
  getFeaturedProducts,
  getProductsOnSale
} = require('../controllers/products');

const router = express.Router();

// Validation middleware
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .isMongoId()
    .withMessage('Please provide a valid category ID')
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer')
];

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/sale', getProductsOnSale);
router.get('/:id', getProduct);

// Protected routes (Admin/Shop Owner)
router.post('/', protect, authorize('admin', 'shop_owner'), productValidation, createProduct);
router.put('/:id', protect, authorize('admin', 'shop_owner'), updateProductValidation, updateProduct);
router.delete('/:id', protect, authorize('admin', 'shop_owner'), deleteProduct);
router.post('/:id/images', protect, authorize('admin', 'shop_owner'), uploadProductImages);

module.exports = router; 