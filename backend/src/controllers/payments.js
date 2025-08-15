const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', orderId } = req.body;

    // Verify order exists and belongs to user
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order || order.user.toString() !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: req.user.id,
        orderId: orderId || 'cart'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.payment.status = 'paid';
          order.payment.transactionId = paymentIntentId;
          order.payment.paidAt = new Date();
          await order.save();
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({ 
      user: req.user.id,
      'payment.status': 'paid'
    })
    .select('orderNumber total payment.createdAt')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `Webhook Error: ${err.message}`
      });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!');
        
        // Update order if paymentIntent has orderId in metadata
        if (paymentIntent.metadata.orderId && paymentIntent.metadata.orderId !== 'cart') {
          const order = await Order.findById(paymentIntent.metadata.orderId);
          if (order) {
            order.payment.status = 'paid';
            order.payment.transactionId = paymentIntent.id;
            order.payment.paidAt = new Date();
            await order.save();
          }
        }
        break;
        
      case 'payment_intent.payment_failed':
        console.log('PaymentIntent failed!');
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  handleWebhook
}; 