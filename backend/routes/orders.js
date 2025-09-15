import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Shop } from '../models/Shop.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('shopId')
    .isMongoId()
    .withMessage('Valid shop ID is required'),
  // Temporarily disable address validation per request
  body('shippingAddress')
    .optional()
    .isString()
    .withMessage('Shipping address must be a string'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Valid product ID is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1 for each item')
];

// @route   GET /api/orders
// @desc    Get orders (filtered by user role)
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, shopId } = req.query;
    
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'customer') {
      query.customerId = req.user.id;
    } else if (req.user.role === 'shop_owner') {
      // Get shop owned by user
      const shop = await Shop.findOne({ ownerId: req.user.id });
      if (shop) {
        query.shopId = shop._id;
      } else {
        return res.status(404).json({
          status: 'error',
          message: 'No shop found for this user'
        });
      }
    } else if (req.user.role === 'delivery_boy') {
      query.deliveryBoyId = req.user.id;
    }
    // Admin can see all orders
    
    if (status) {
      query.status = status;
    }
    
    if (shopId && req.user.role === 'admin') {
      query.shopId = shopId;
    }
    
    const orders = await Order.find(query)
      .populate('customerId', 'name email phoneNumber')
      .populate('shopId', 'shopName address contactInfo')
      .populate('deliveryBoyId', 'name phoneNumber')
      .populate('items.productId', 'productName imageUrls price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching orders'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phoneNumber address')
      .populate('shopId', 'shopName address contactInfo')
      .populate('deliveryBoyId', 'name phoneNumber')
      .populate('items.productId', 'productName imageUrls price');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check if user has access to this order
    const hasAccess = 
      order.customerId._id.toString() === req.user.id ||
      (req.user.role === 'shop_owner' && order.shopId.ownerId.toString() === req.user.id) ||
      (req.user.role === 'delivery_boy' && order.deliveryBoyId && order.deliveryBoyId._id.toString() === req.user.id) ||
      req.user.role === 'admin';
    
    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this order'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching order'
    });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Customer)
router.post('/', verifyToken, validateOrder, async (req, res) => {
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
        message: 'Only customers can create orders'
      });
    }
    
    const { shopId, shippingAddress, items, paymentMethod = 'cash_on_delivery', notes = '' } = req.body;

    // Extra guard: validate ObjectIds to avoid CastError 500s
    if (!mongoose.isValidObjectId(shopId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid shop ID format' });
    }
    for (const it of items || []) {
      if (!mongoose.isValidObjectId(it.productId)) {
        return res.status(400).json({ status: 'error', message: `Invalid product ID format: ${it.productId}` });
      }
    }
    
    // Verify shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }
    
    // Verify products and calculate total
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: `Product with ID ${item.productId} not found`
        });
      }
      
      if (product.status !== 'available') {
        return res.status(400).json({
          status: 'error',
          message: `Product ${product.productName} is not available`
        });
      }
      
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for product ${product.productName}. Available: ${product.stockQuantity}`
        });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });
    }
    
    // Create order
    const order = new Order({
      customerId: req.user.id,
      shopId,
      shippingAddress,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      items: orderItems,
      notes
    });
    
    await order.save();
    
    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQuantity: -item.quantity, totalSold: item.quantity } }
      );
    }
    
    // Populate order data for response
    await order.populate([
      { path: 'customerId', select: 'name email phoneNumber' },
      { path: 'shopId', select: 'shopName address contactInfo' },
      { path: 'items.productId', select: 'productName imageUrls price' }
    ]);
    
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Create order error:', error);
    // Help client diagnose by returning error message in development-friendly way
    const message = (error && error.message) ? error.message : 'Internal server error while creating order';
    // If CastError slipped through
    if (error && error.name === 'CastError') {
      return res.status(400).json({ status: 'error', message: `Invalid ID for ${error.path}` });
    }
    res.status(500).json({ status: 'error', message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Shop Owner, Delivery Boy, Admin)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status, notes = '' } = req.body;
    
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }
    
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'ownerId');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check permissions
    const canUpdate = 
      (req.user.role === 'shop_owner' && order.shopId.ownerId.toString() === req.user.id) ||
      (req.user.role === 'delivery_boy' && order.deliveryBoyId && order.deliveryBoyId.toString() === req.user.id) ||
      req.user.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this order'
      });
    }
    
    await order.updateStatus(status, notes);
    
    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating order status'
    });
  }
});

// @route   PUT /api/orders/:id/assign-delivery
// @desc    Assign delivery boy to order
// @access  Private (Shop Owner, Admin)
router.put('/:id/assign-delivery', verifyToken, async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    
    if (!deliveryBoyId) {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery boy ID is required'
      });
    }
    
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'ownerId');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check permissions
    const canAssign = 
      (req.user.role === 'shop_owner' && order.shopId.ownerId.toString() === req.user.id) ||
      req.user.role === 'admin';
    
    if (!canAssign) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to assign delivery for this order'
      });
    }
    
    // Verify delivery boy exists and has correct role
    const User = mongoose.model('User');
    const deliveryBoy = await User.findById(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.role !== 'delivery_boy') {
      return res.status(404).json({
        status: 'error',
        message: 'Valid delivery boy not found'
      });
    }
    
    await order.assignDeliveryBoy(deliveryBoyId);
    
    res.status(200).json({
      status: 'success',
      message: 'Delivery boy assigned successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Assign delivery error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while assigning delivery'
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private (Customer, Shop Owner, Admin)
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { cancellationReason = '' } = req.body;
    
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'ownerId');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check permissions
    const canCancel = 
      (req.user.role === 'customer' && order.customerId.toString() === req.user.id) ||
      (req.user.role === 'shop_owner' && order.shopId.ownerId.toString() === req.user.id) ||
      req.user.role === 'admin';
    
    if (!canCancel) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to cancel this order'
      });
    }
    
    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled in current status'
      });
    }
    
    await order.updateStatus('cancelled', cancellationReason);
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockQuantity: item.quantity, totalSold: -item.quantity } }
      );
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while cancelling order'
    });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics
// @access  Private (Shop Owner, Admin)
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const { dateFrom, dateTo, shopId } = req.query;
    
    let filters = {};
    
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ ownerId: req.user.id });
      if (shop) {
        filters.shopId = shop._id;
      } else {
        return res.status(404).json({
          status: 'error',
          message: 'No shop found for this user'
        });
      }
    } else if (shopId && req.user.role === 'admin') {
      filters.shopId = shopId;
    }
    
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    const stats = await Order.getOrderStats(filters);
    
    res.status(200).json({
      status: 'success',
      data: { stats: stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 } }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching order statistics'
    });
  }
});

export default router;
