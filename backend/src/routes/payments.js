const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  handleWebhook
} = require('../controllers/payments');

const router = express.Router();

// Validation middleware
const paymentIntentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .isIn(['usd', 'eur', 'gbp'])
    .withMessage('Invalid currency')
];

// Protected routes
router.use(protect);

router.post('/create-payment-intent', paymentIntentValidation, createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history', getPaymentHistory);

// Webhook route (no auth required)
router.post('/webhook', handleWebhook);

module.exports = router; 