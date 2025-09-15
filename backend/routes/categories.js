import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { Category } from '../models/Category.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Description must be between 5 and 200 characters')
];

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { isBuiltIn, isActive } = req.query;
    
    let query = {};
    
    if (isBuiltIn !== undefined) {
      query.isBuiltIn = isBuiltIn === 'true';
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    let categories = await Category.find(query)
      .populate('addedBy', 'name email')
      .populate('productsCount')
      .sort({ name: 1 });
    
    // Auto-seed defaults if empty collection and no filters applied
    if (categories.length === 0 && Object.keys(query).length <= 1 /* only isActive maybe */) {
      const defaultCategories = [
        { _id: new mongoose.Types.ObjectId('68bea582d67a9f688b8ba040'), name: 'Electronics', description: 'Electronic devices and accessories', isBuiltIn: true },
        { _id: new mongoose.Types.ObjectId('68bea582d67a9f688b8ba041'), name: 'Fashion', description: 'Clothing and accessories', isBuiltIn: true },
        { _id: new mongoose.Types.ObjectId('68bea582d67a9f688b8ba042'), name: 'Home & Garden', description: 'Home improvement and garden supplies', isBuiltIn: true },
        { _id: new mongoose.Types.ObjectId('68bea582d67a9f688b8ba043'), name: 'Food & Beverages', description: 'Food products and beverages', isBuiltIn: true }
      ];
      try {
        await Category.insertMany(defaultCategories, { ordered: false });
      } catch (e) {
        // ignore duplicate key errors in case of race condition
      }
      categories = await Category.find(query)
        .populate('addedBy', 'name email')
        .populate('productsCount')
        .sort({ name: 1 });
    }
    
    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching categories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('productsCount');
    
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin)
router.post('/', verifyToken, validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can create categories'
      });
    }
    
    const { name, description, imageUrl } = req.body;
    
    // Check if category name already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Category with this name already exists'
      });
    }
    
    const category = new Category({
      name,
      description,
      imageUrl: imageUrl || '',
      addedBy: req.user.id
    });
    
    await category.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin)
router.put('/:id', verifyToken, validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update categories'
      });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    
    // Check if it's a built-in category
    if (category.isBuiltIn) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot modify built-in categories'
      });
    }
    
    const { name, description, imageUrl } = req.body;
    
    // Check if category name already exists (excluding current category)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Category with this name already exists'
      });
    }
    
    category.name = name;
    category.description = description;
    category.imageUrl = imageUrl || category.imageUrl;
    
    await category.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can delete categories'
      });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    
    // Check if it's a built-in category
    if (category.isBuiltIn) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete built-in categories'
      });
    }
    
    // Check if category has products
    const Product = mongoose.model('Product');
    const productsCount = await Product.countDocuments({ categoryId: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete category. It has ${productsCount} products associated with it.`
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting category'
    });
  }
});

// @route   PUT /api/categories/:id/status
// @desc    Toggle category active status
// @access  Private (Admin)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update category status'
      });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    
    category.isActive = !category.isActive;
    await category.save();
    
    res.status(200).json({
      status: 'success',
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { category }
    });
  } catch (error) {
    console.error('Update category status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating category status'
    });
  }
});

export default router;
