import express from 'express';
import { body, validationResult } from 'express-validator';
import { Product } from '../models/Product.js';
import { Shop } from '../models/Shop.js';
import { Category } from '../models/Category.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateProduct = [
  body('productName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required')
];

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoryId, 
      shopId, 
      minPrice, 
      maxPrice, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = { isActive: true };
    
    // Search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    // Shop filter
    if (shopId) {
      query.shopId = shopId;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(query)
      .populate('shopId', 'shopName address contactInfo')
      .populate('categoryId', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching products'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('shopId', 'shopName address contactInfo rating')
      .populate('categoryId', 'name description')
      .populate('reviews');
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching product'
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Shop Owner)
router.post('/', verifyToken, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Check if user is shop owner
    if (req.user.role !== 'shop_owner') {
      return res.status(403).json({
        status: 'error',
        message: 'Only shop owners can create products'
      });
    }
    
    // Check if shop exists and belongs to user
    const shop = await Shop.findOne({ ownerId: req.user.id });
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found. Please create a shop first.'
      });
    }
    
    // Check if category exists
    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    
    const { 
      productName, 
      description, 
      price, 
      stockQuantity, 
      categoryId, 
      imageUrls = [], 
      brand = '', 
      tags = [], 
      weight = 0,
      dimensions = {},
      metaTitle = '',
      metaDescription = ''
    } = req.body;
    
    const product = new Product({
      shopId: shop._id,
      categoryId,
      productName,
      description,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity),
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      brand,
      tags: Array.isArray(tags) ? tags : [],
      weight: parseFloat(weight),
      dimensions: {
        length: parseFloat(dimensions.length) || 0,
        width: parseFloat(dimensions.width) || 0,
        height: parseFloat(dimensions.height) || 0
      },
      metaTitle,
      metaDescription
    });
    
    await product.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating product'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Shop Owner)
router.put('/:id', verifyToken, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const product = await Product.findById(req.params.id)
      .populate('shopId', 'ownerId');
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Check if user owns the shop
    if (product.shopId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update products from your own shop'
      });
    }
    
    const { 
      productName, 
      description, 
      price, 
      stockQuantity, 
      categoryId, 
      imageUrls, 
      brand, 
      tags, 
      weight,
      dimensions,
      metaTitle,
      metaDescription
    } = req.body;
    
    product.productName = productName;
    product.description = description;
    product.price = parseFloat(price);
    product.stockQuantity = parseInt(stockQuantity);
    product.categoryId = categoryId;
    
    if (imageUrls !== undefined) {
      product.imageUrls = Array.isArray(imageUrls) ? imageUrls : [];
    }
    if (brand !== undefined) product.brand = brand;
    if (tags !== undefined) product.tags = Array.isArray(tags) ? tags : [];
    if (weight !== undefined) product.weight = parseFloat(weight);
    if (dimensions !== undefined) {
      product.dimensions = {
        length: parseFloat(dimensions.length) || 0,
        width: parseFloat(dimensions.width) || 0,
        height: parseFloat(dimensions.height) || 0
      };
    }
    if (metaTitle !== undefined) product.metaTitle = metaTitle;
    if (metaDescription !== undefined) product.metaDescription = metaDescription;
    
    await product.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating product'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Shop Owner)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('shopId', 'ownerId');
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Check if user owns the shop
    if (product.shopId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete products from your own shop'
      });
    }
    
    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting product'
    });
  }
});

// @route   GET /api/products/shop/:shopId
// @desc    Get products by shop
// @access  Public
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { shopId: req.params.shopId, isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get shop products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching shop products'
    });
  }
});

// @route   PUT /api/products/:id/stock
// @desc    Update product stock
// @access  Private (Shop Owner)
router.put('/:id/stock', verifyToken, async (req, res) => {
  try {
    const { quantity, operation = 'set' } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid quantity is required'
      });
    }
    
    const product = await Product.findById(req.params.id)
      .populate('shopId', 'ownerId');
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Check if user owns the shop
    if (product.shopId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update stock for products from your own shop'
      });
    }
    
    if (operation === 'set') {
      product.stockQuantity = parseInt(quantity);
    } else if (operation === 'add') {
      product.stockQuantity += parseInt(quantity);
    } else if (operation === 'subtract') {
      product.stockQuantity = Math.max(0, product.stockQuantity - parseInt(quantity));
    }
    
    await product.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Product stock updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating product stock'
    });
  }
});

export default router;
