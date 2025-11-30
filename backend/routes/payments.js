import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';

dotenv.config({ path: './config.env' });

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order for payment
// @access  Private (Customer)
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can create payment orders'
      });
    }

    const { orderId, amount, currency = 'INR' } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and amount are required'
      });
    }

    // Verify order exists and belongs to customer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only pay for your own orders'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is already paid'
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: `order_${orderId}_${Date.now()}`,
      notes: {
        orderId: orderId.toString(),
        customerId: req.user.id.toString(),
        shopId: order.shopId.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      customerId: req.user.id,
      shopId: order.shopId,
      paymentId: razorpayOrder.id,
      amount: amount,
      currency: currency,
      paymentMethod: 'upi', // Default, can be changed based on user selection
      status: 'pending',
      gatewayTransactionId: razorpayOrder.id,
      gatewayResponse: razorpayOrder
    });

    await payment.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount / 100, // Convert back to rupees
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private (Customer)
router.post('/verify', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can verify payments'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification data is missing'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment signature'
      });
    }

    // Find payment record
    let payment;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else {
      payment = await Payment.findOne({ gatewayTransactionId: razorpay_order_id });
    }

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment record not found'
      });
    }

    // Verify payment belongs to customer
    if (payment.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only verify your own payments'
      });
    }

    // Get payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment record
    payment.status = 'completed';
    payment.paymentDate = new Date();
    payment.gatewayTransactionId = razorpay_payment_id;
    payment.gatewayResponse = razorpayPayment;
    await payment.save();

    // Update order
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = 'paid';
      order.paymentId = razorpay_payment_id;
      order.paymentMethod = razorpayPayment.method || 'upi';
      await order.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment verified successfully',
      data: {
        paymentId: payment._id,
        orderId: order?._id,
        amount: payment.amount,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Razorpay webhook handler for payment events
// @access  Public (Razorpay calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (!signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing webhook signature'
      });
    }

    // Verify webhook signature
    const body = req.body.toString();
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        status: 'error',
        message: 'Invalid webhook signature'
      });
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    console.log('Razorpay webhook event:', eventType);

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const { payment, order } = payload.entity;

      // Find payment record
      const paymentRecord = await Payment.findOne({
        $or: [
          { gatewayTransactionId: payment.id },
          { paymentId: order.id }
        ]
      });

      if (paymentRecord && paymentRecord.status !== 'completed') {
        paymentRecord.status = 'completed';
        paymentRecord.paymentDate = new Date();
        paymentRecord.gatewayTransactionId = payment.id;
        paymentRecord.gatewayResponse = payment;
        await paymentRecord.save();

        // Update order
        const orderRecord = await Order.findById(paymentRecord.orderId);
        if (orderRecord && orderRecord.paymentStatus !== 'paid') {
          orderRecord.paymentStatus = 'paid';
          orderRecord.paymentId = payment.id;
          orderRecord.paymentMethod = payment.method || 'upi';
          await orderRecord.save();
        }
      }
    }

    // Handle payment.failed event
    if (eventType === 'payment.failed') {
      const { payment } = payload.entity;

      const paymentRecord = await Payment.findOne({
        gatewayTransactionId: payment.id
      });

      if (paymentRecord) {
        paymentRecord.status = 'failed';
        paymentRecord.failureReason = payment.error_description || 'Payment failed';
        await paymentRecord.save();
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Webhook processing failed'
    });
  }
});

// @route   GET /api/payments/:orderId
// @desc    Get payment details for an order
// @access  Private
router.get('/:orderId', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check permissions
    const canView = 
      order.customerId.toString() === req.user.id ||
      (req.user.role === 'shop_owner' && order.shopId.toString() === req.user.id) ||
      req.user.role === 'admin';

    if (!canView) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this payment'
      });
    }

    const payment = await Payment.findOne({ orderId: order._id })
      .populate('customerId', 'name email')
      .populate('shopId', 'shopName');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found for this order'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { payment }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get payment details'
    });
  }
});

export default router;


