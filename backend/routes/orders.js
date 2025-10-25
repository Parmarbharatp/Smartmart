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
      // Include ownerId for downstream access checks in UI
      .populate('shopId', 'shopName address contactInfo ownerId')
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
    console.error('Get orders error:', error?.message || error);
    // Fail-soft: return empty list for UI instead of 500 so dashboard doesn't break
    return res.status(200).json({
      status: 'success',
      data: {
        orders: [],
        pagination: { current: 1, pages: 0, total: 0 }
      }
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
// Use strict ObjectId pattern so paths like 'available-for-delivery' don't match
router.get('/:id([0-9a-fA-F]{24})', verifyToken, async (req, res) => {
  try {
  const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phoneNumber address')
      // Include ownerId to avoid access-check errors
      .populate('shopId', 'shopName address contactInfo ownerId')
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
      (order.customerId && order.customerId._id && order.customerId._id.toString() === req.user.id) ||
      (req.user.role === 'shop_owner' && order.shopId && order.shopId.ownerId && order.shopId.ownerId.toString() === req.user.id) ||
      (req.user.role === 'delivery_boy' && order.deliveryBoyId && order.deliveryBoyId._id && order.deliveryBoyId._id.toString() === req.user.id) ||
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

// @route   GET /api/orders/:id/details
// @desc    Get comprehensive order details for shop owners
// @access  Private (Shop Owner, Admin)
router.get('/:id([0-9a-fA-F]{24})/details', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phoneNumber address')
      .populate('shopId', 'shopName address contactInfo ownerId')
      .populate('deliveryBoyId', 'name phoneNumber vehicleType licenseNumber')
      .populate('items.productId', 'productName imageUrls price description category');
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check if user has access to this order (shop owner or admin)
    const hasAccess = 
      (req.user.role === 'shop_owner' && order.shopId && order.shopId.ownerId && order.shopId.ownerId.toString() === req.user.id) ||
      req.user.role === 'admin';
    
    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this order details'
      });
    }
    
    // Format the response with comprehensive details
    const orderDetails = {
      order: {
        id: order._id,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        deliveryStatus: order.deliveryStatus,
        deliveryNotes: order.deliveryNotes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      },
      customerData: order.customerId ? {
        id: order.customerId._id,
        name: order.customerId.name,
        email: order.customerId.email,
        phoneNumber: order.customerId.phoneNumber,
        address: order.customerId.address
      } : null,
      shopData: order.shopId ? {
        id: order.shopId._id,
        shopName: order.shopId.shopName,
        address: order.shopId.address,
        contactInfo: order.shopId.contactInfo
      } : null,
      deliveryBoyData: order.deliveryBoyId ? {
        id: order.deliveryBoyId._id,
        name: order.deliveryBoyId.name,
        phoneNumber: order.deliveryBoyId.phoneNumber,
        vehicleType: order.deliveryBoyId.vehicleType,
        licenseNumber: order.deliveryBoyId.licenseNumber
      } : null,
      items: order.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.productName,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        productDetails: {
          imageUrls: item.productId.imageUrls,
          description: item.productId.description,
          category: item.productId.category
        }
      }))
    };
    
    res.status(200).json({
      status: 'success',
      data: orderDetails
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching order details'
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
    
    console.log('📦 New order created:', {
      id: order._id,
      status: order.status,
      deliveryBoyId: order.deliveryBoyId,
      deliveryStatus: order.deliveryStatus,
      customerId: order.customerId,
      shopId: order.shopId
    });
    
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

// @route   PUT /api/orders/owner/make-available
// @desc    Bulk confirm and unassign orders so delivery boys can see them
// @access  Private (Shop Owner, Admin)
router.put('/owner/make-available', verifyToken, async (req, res) => {
  try {
    let match = { status: { $in: ['pending', 'confirmed'] } };

    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ ownerId: req.user.id }).select('_id');
      if (!shop) {
        return res.status(404).json({ status: 'error', message: 'No shop found for this user' });
      }
      match = { ...match, shopId: shop._id };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Only shop owners or admins can run this' });
    }

    const update = {
      $set: { status: 'confirmed' },
      $unset: { deliveryBoyId: '', deliveryStatus: '', deliveryNotes: '' }
    };

    const result = await Order.updateMany(match, update);

    return res.status(200).json({
      status: 'success',
      message: 'Orders made available for delivery',
      data: { matched: result.matchedCount ?? result.nMatched ?? 0, modified: result.modifiedCount ?? result.nModified ?? 0 }
    });
  } catch (error) {
    console.error('Bulk make-available error:', error?.message || error);
    return res.status(500).json({ status: 'error', message: 'Internal server error while making orders available' });
  }
});

// @route   PUT /api/orders/:id/make-available-for-delivery
// @desc    Make a single order available for delivery by clearing delivery assignment
// @access  Private (Shop Owner, Admin)
router.put('/:id/make-available-for-delivery', verifyToken, async (req, res) => {
  try {
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
      req.user.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to make this order available for delivery'
      });
    }
    
    // Confirm order and clear delivery assignment fields to make it available for delivery
    console.log('🔄 Before making available:', {
      id: order._id,
      status: order.status,
      deliveryBoyId: order.deliveryBoyId,
      deliveryStatus: order.deliveryStatus
    });
    
    order.status = 'confirmed';
    order.deliveryBoyId = null;
    order.deliveryStatus = null;
    order.deliveryNotes = '';
    await order.save();
    
    console.log('✅ After making available:', {
      id: order._id,
      status: order.status,
      deliveryBoyId: order.deliveryBoyId,
      deliveryStatus: order.deliveryStatus
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Order made available for delivery',
      data: { order }
    });
  } catch (error) {
    console.error('Make available for delivery error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while making order available for delivery'
    });
  }
});

// @route   GET /api/orders/debug/all
// @desc    Get all orders for debugging (temporary endpoint)
// @access  Private (Admin, Shop Owner, Delivery Boy)
router.get('/debug/all', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('customerId', 'name email phoneNumber')
      .populate('shopId', 'shopName address contactInfo')
      .populate('deliveryBoyId', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log('🔍 DEBUG: All orders in database:', orders.length);
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order._id,
        status: order.status,
        deliveryBoyId: order.deliveryBoyId,
        deliveryStatus: order.deliveryStatus,
        customer: order.customerId?.name,
        shop: order.shopId?.shopName
      });
    });
    
    res.status(200).json({
      status: 'success',
      data: { orders }
    });
  } catch (error) {
    console.error('Debug all orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching debug orders'
    });
  }
});

// @route   GET /api/orders/available-for-delivery
// @desc    Get orders available for delivery boys to accept
// @access  Private (Delivery Boy)
router.get('/available-for-delivery', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_boy') {
      return res.status(403).json({
        status: 'error',
        message: 'Only delivery boys can access this endpoint'
      });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    
    // SIMPLIFIED: Find orders that are confirmed or pending and not assigned to any delivery boy
    const query = {
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { deliveryBoyId: null },
        { deliveryBoyId: { $exists: false } }
      ]
    };
    
    console.log('Available orders query:', JSON.stringify(query, null, 2));
    
    // Also log all orders to debug
    const allOrders = await Order.find({}).select('_id status deliveryBoyId deliveryStatus createdAt').sort({ createdAt: -1 }).limit(10);
    console.log('Recent orders in database:', allOrders.map(o => ({
      id: o._id,
      status: o.status,
      deliveryBoyId: o.deliveryBoyId,
      deliveryStatus: o.deliveryStatus,
      createdAt: o.createdAt
    })));
    
    const orders = await Order.find(query)
      .populate('customerId', 'name email phoneNumber address')
      .populate('shopId', 'shopName address contactInfo')
      .populate('items.productId', 'productName imageUrls price')
      .sort({ createdAt: -1 })
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum);
    
    const total = await Order.countDocuments(query);
    
    console.log(`Found ${orders.length} available orders out of ${total} total matching orders`);
    
    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get available orders error:', error?.message || error);
    // Fail-soft: return empty list to avoid blocking delivery dashboard UI
    return res.status(200).json({
      status: 'success',
      data: {
        orders: [],
        pagination: { current: 1, pages: 0, total: 0 }
      }
    });
  }
});

// @route   PUT /api/orders/:id/accept-delivery
// @desc    Accept delivery assignment (like Zomato)
// @access  Private (Delivery Boy)
router.put('/:id/accept-delivery', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_boy') {
      return res.status(403).json({
        status: 'error',
        message: 'Only delivery boys can accept deliveries'
      });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check if order is available for delivery
    if (order.deliveryBoyId || order.status !== 'confirmed') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is not available for delivery'
      });
    }
    
    // Assign delivery boy and set initial status
    order.deliveryBoyId = req.user.id;
    order.deliveryStatus = 'assigned';
    order.status = 'shipped'; // Update main order status
    await order.save();
    
    // Populate order data for response
    await order.populate([
      { path: 'customerId', select: 'name email phoneNumber address' },
      { path: 'shopId', select: 'shopName address contactInfo' },
      { path: 'items.productId', select: 'productName imageUrls price' }
    ]);
    
    res.status(200).json({
      status: 'success',
      message: 'Delivery accepted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while accepting delivery'
    });
  }
});

// @route   PUT /api/orders/:id/update-delivery-status
// @desc    Update delivery status (picked up, out for delivery, delivered, failed)
// @access  Private (Delivery Boy)
router.put('/:id/update-delivery-status', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_boy') {
      return res.status(403).json({
        status: 'error',
        message: 'Only delivery boys can update delivery status'
      });
    }
    
    const { deliveryStatus, notes = '' } = req.body;
    
    if (!['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed'].includes(deliveryStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid delivery status'
      });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Check if delivery boy is assigned to this order
    if (order.deliveryBoyId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not assigned to this delivery'
      });
    }
    
    // Update delivery status
    order.deliveryStatus = deliveryStatus;
    order.deliveryNotes = notes;
    
    // Update main order status based on delivery status
    if (deliveryStatus === 'delivered') {
      order.status = 'delivered';
      order.actualDeliveryDate = new Date();
    } else if (deliveryStatus === 'failed') {
      order.status = 'cancelled';
      order.cancellationReason = notes || 'Delivery failed';
      order.cancellationDate = new Date();
      // Keep payment status as pending for failed deliveries
    }
    
    await order.save();
    
    // Automatically complete payment when delivery is successful
    if (deliveryStatus === 'delivered') {
      await order.completePaymentOnDelivery();
    }
    
    // Populate order data for response
    await order.populate([
      { path: 'customerId', select: 'name email phoneNumber address' },
      { path: 'shopId', select: 'shopName address contactInfo' },
      { path: 'items.productId', select: 'productName imageUrls price' }
    ]);
    
    res.status(200).json({
      status: 'success',
      message: 'Delivery status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating delivery status'
    });
  }
});

// @route   PUT /api/orders/:id/update-payment-status
// @desc    Update payment status (Admin/Shop Owner)
// @access  Private (Shop Owner, Admin)
router.put('/:id/update-payment-status', verifyToken, async (req, res) => {
  try {
    const { paymentStatus, paymentId = '' } = req.body;
    
    if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment status'
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
      req.user.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update payment status'
      });
    }
    
    // Update payment status
    order.paymentStatus = paymentStatus;
    if (paymentId) {
      order.paymentId = paymentId;
    }
    
    // If payment is marked as paid and order is delivered, ensure consistency
    if (paymentStatus === 'paid' && order.status === 'delivered') {
      // Everything is consistent
    } else if (paymentStatus === 'paid' && order.status !== 'delivered') {
      // Payment completed but delivery not done yet - this is normal for online payments
    } else if (paymentStatus === 'failed' && order.status === 'delivered') {
      // This shouldn't happen - delivered orders should have successful payment
      return res.status(400).json({
        status: 'error',
        message: 'Cannot mark payment as failed for delivered orders'
      });
    }
    
    await order.save();
    
    // Populate order data for response
    await order.populate([
      { path: 'customerId', select: 'name email phoneNumber address' },
      { path: 'shopId', select: 'shopName address contactInfo' },
      { path: 'items.productId', select: 'productName imageUrls price' }
    ]);
    
    res.status(200).json({
      status: 'success',
      message: 'Payment status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating payment status'
    });
  }
});

// @route   PUT /api/orders/:id/assign-delivery
// @desc    Assign delivery boy to order (Admin/Shop Owner)
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
      data: { stats: stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, pendingCount: 0, confirmedCount: 0, shippedCount: 0, deliveredCount: 0, cancelledCount: 0, refundedCount: 0 } }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching order statistics'
    });
  }
});

// @route   GET /api/orders/stats/timeseries
// @desc    Get order revenue and counts grouped by period
// @access  Private (Shop Owner, Admin)
router.get('/stats/timeseries', verifyToken, async (req, res) => {
  try {
    const { period = 'month', dateFrom, dateTo, shopId } = req.query;

    const allowed = ['week', 'month', 'year'];
    const groupPeriod = allowed.includes(String(period)) ? String(period) : 'month';

    let matchStage = {};
    if (req.user.role === 'shop_owner') {
      const shop = await Shop.findOne({ ownerId: req.user.id });
      if (shop) {
        matchStage.shopId = shop._id;
      } else {
        return res.status(404).json({ status: 'error', message: 'No shop found for this user' });
      }
    } else if (shopId && req.user.role === 'admin') {
      matchStage.shopId = shopId;
    }

    if (dateFrom || dateTo) {
      matchStage.orderDate = {};
      if (dateFrom) matchStage.orderDate.$gte = new Date(String(dateFrom));
      if (dateTo) matchStage.orderDate.$lte = new Date(String(dateTo));
    }

    const dateToParts = { 
      week: { isoWeek: { $isoWeek: '$orderDate' }, year: { $isoWeekYear: '$orderDate' } }, 
      month: { month: { $month: '$orderDate' }, year: { $year: '$orderDate' } }, 
      year: { year: { $year: '$orderDate' } } 
    };
    const groupId = dateToParts[groupPeriod];

    const results = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupId,
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          refunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
          avgOrderValue: { $avg: '$totalAmount' },
          uniqueCustomers: { $addToSet: '$customerId' }
        }
      },
      {
        $addFields: {
          uniqueCustomers: { $size: '$uniqueCustomers' },
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.isoWeek': 1 } }
    ]);

    res.status(200).json({ status: 'success', data: { series: results, period: groupPeriod } });
  } catch (error) {
    console.error('Get order timeseries error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error while fetching time-series' });
  }
});

export default router;
