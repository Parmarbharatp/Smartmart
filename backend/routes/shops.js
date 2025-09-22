import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateShop = [
  body('shopName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('contactInfo')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Contact info must be between 5 and 100 characters')
];

// @route   GET /api/shops
// @desc    Get all shops
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const shops = await Shop.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Shop.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        shops,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching shops'
    });
  }
});

// @route   GET /api/shops/:id
// @desc    Get shop by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('ownerId', 'name email phoneNumber')
      .populate('productsCount')
      .populate('ordersCount');
    
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }
    
    const stats = await shop.getStats();
    
    res.status(200).json({
      status: 'success',
      data: {
        shop: {
          ...shop.toObject(),
          stats
        }
      }
    });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching shop'
    });
  }
});

// @route   GET /api/shops/:id/details
// @desc    Get shop details with products and full information
// @access  Public
router.get('/:id/details', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const shop = await Shop.findById(req.params.id)
      .populate('ownerId', 'name email phoneNumber');
    
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }
    
    // Get shop products
    const Product = mongoose.model('Product');
    const products = await Product.find({ shopId: req.params.id, isActive: true })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const totalProducts = await Product.countDocuments({ shopId: req.params.id, isActive: true });
    
    // Get shop statistics
    const stats = await shop.getStats();
    
    res.status(200).json({
      status: 'success',
      data: {
        shop: {
          ...shop.toObject(),
          stats
        },
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalProducts / limit),
          total: totalProducts
        }
      }
    });
  } catch (error) {
    console.error('Get shop details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching shop details'
    });
  }
});

// @route   POST /api/shops
// @desc    Create a new shop
// @access  Private (Shop Owner)
router.post('/', verifyToken, validateShop, async (req, res) => {
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
        message: 'Only shop owners can create shops'
      });
    }
    
    // Check if user already has a shop
    const existingShop = await Shop.findOne({ ownerId: req.user.id });
    if (existingShop) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a shop registered'
      });
    }
    
    const { shopName, description, address, contactInfo, imageUrl, businessLicense, taxId, openingHours, deliveryRadius } = req.body;
    
    const shop = new Shop({
      ownerId: req.user.id,
      shopName,
      description,
      address,
      contactInfo,
      imageUrl: imageUrl || '',
      businessLicense: businessLicense || '',
      taxId: taxId || '',
      openingHours: openingHours || '9:00 AM - 9:00 PM',
      deliveryRadius: deliveryRadius || 10
    });
    
    await shop.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Shop created successfully',
      data: { shop }
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating shop'
    });
  }
});

// @route   PUT /api/shops/:id
// @desc    Update shop
// @access  Private (Shop Owner or Admin)
router.put('/:id', verifyToken, validateShop, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }
    
    // Check if user owns the shop or is admin
    if (shop.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own shop'
      });
    }
    
    const { shopName, description, address, contactInfo, imageUrl, businessLicense, taxId, openingHours, deliveryRadius } = req.body;
    
    shop.shopName = shopName;
    shop.description = description;
    shop.address = address;
    shop.contactInfo = contactInfo;
    shop.imageUrl = imageUrl || shop.imageUrl;
    shop.businessLicense = businessLicense || shop.businessLicense;
    shop.taxId = taxId || shop.taxId;
    shop.openingHours = openingHours || shop.openingHours;
    shop.deliveryRadius = deliveryRadius || shop.deliveryRadius;
    
    await shop.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Shop updated successfully',
      data: { shop }
    });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating shop'
    });
  }
});

// @route   PUT /api/shops/:id/status
// @desc    Update shop status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update shop status'
      });
    }
    
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }
    
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }
    
    shop.status = status;
    await shop.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Shop status updated successfully',
      data: { shop }
    });
  } catch (error) {
    console.error('Update shop status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating shop status'
    });
  }
});

// @route   DELETE /api/shops/:id
// @desc    Delete shop
// @access  Private (Shop Owner or Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }
    
    // Check if user owns the shop or is admin
    if (shop.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own shop'
      });
    }
    
    await Shop.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting shop'
    });
  }
});

// @route   GET /api/shops/owner/my-shop
// @desc    Get current user's shop
// @access  Private (Shop Owner)
router.get('/owner/my-shop', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'shop_owner') {
      return res.status(403).json({
        status: 'error',
        message: 'Only shop owners can access this endpoint'
      });
    }
    
    const shop = await Shop.findOne({ ownerId: req.user.id })
      .populate('productsCount')
      .populate('ordersCount');
    
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'No shop found for this user'
      });
    }
    
    const stats = await shop.getStats();
    
    res.status(200).json({
      status: 'success',
      data: {
        shop: {
          ...shop.toObject(),
          stats
        }
      }
    });
  } catch (error) {
    console.error('Get my shop error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching shop'
    });
  }
});

// @route   PUT /api/shops/:id/update-location
// @desc    Update shop location with coordinates and address details
// @access  Private (Shop Owner or Admin)
router.put('/:id/update-location', verifyToken, [
  body('coordinates.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('coordinates.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('formattedAddress').notEmpty().withMessage('Formatted address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }

    // Check if user owns the shop or is admin
    if (shop.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own shop location'
      });
    }

    const {
      coordinates,
      address,
      city,
      state,
      country,
      postalCode,
      formattedAddress,
      placeId
    } = req.body;

    // Update location data
    shop.location = {
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      },
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || '',
      postalCode: postalCode || '',
      formattedAddress: formattedAddress || '',
      placeId: placeId || '',
      lastUpdated: new Date()
    };

    await shop.save();

    res.status(200).json({
      status: 'success',
      message: 'Shop location updated successfully',
      data: {
        location: shop.location
      }
    });

  } catch (error) {
    console.error('Update shop location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating shop location'
    });
  }
});

// @route   GET /api/shops/:id/location
// @desc    Get shop's location
// @access  Public
router.get('/:id/location', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).select('location shopName');
    
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        shopName: shop.shopName,
        location: shop.location
      }
    });

  } catch (error) {
    console.error('Get shop location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching shop location'
    });
  }
});

export default router;
