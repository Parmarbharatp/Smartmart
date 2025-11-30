import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Payout } from '../models/Payout.js';
import { Wallet } from '../models/Wallet.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';

const router = express.Router();

// @route   POST /api/payouts/request
// @desc    Request a payout (Shop Owner or Delivery Boy)
// @access  Private (Shop Owner, Delivery Boy)
router.post('/request', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'shop_owner' && req.user.role !== 'delivery_boy') {
      return res.status(403).json({
        status: 'error',
        message: 'Only shop owners and delivery partners can request payouts'
      });
    }

    const { amount, payoutMethod, upiId, bankAccountNumber, bankAccountName, bankIFSC, bankName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid amount is required'
      });
    }

    if (!payoutMethod || !['upi', 'bank_transfer', 'wallet'].includes(payoutMethod)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid payout method is required (upi, bank_transfer, or wallet)'
      });
    }

    // Validate method-specific fields
    if (payoutMethod === 'upi' && !upiId) {
      return res.status(400).json({
        status: 'error',
        message: 'UPI ID is required for UPI payouts'
      });
    }

    if (payoutMethod === 'bank_transfer') {
      if (!bankAccountNumber || !bankAccountName || !bankIFSC || !bankName) {
        return res.status(400).json({
          status: 'error',
          message: 'All bank details are required for bank transfer payouts'
        });
      }
    }

    // Get wallet
    const wallet = await Wallet.getOrCreateWallet(req.user.id);

    // Check if sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient wallet balance',
        availableBalance: wallet.balance
      });
    }

    // Check for minimum payout amount (optional - can be configured)
    const minPayoutAmount = 100; // Minimum ₹100
    if (amount < minPayoutAmount) {
      return res.status(400).json({
        status: 'error',
        message: `Minimum payout amount is ₹${minPayoutAmount}`,
        minimumAmount: minPayoutAmount
      });
    }

    // Create payout request
    const payout = new Payout({
      userId: req.user.id,
      amount: amount,
      currency: 'INR',
      status: 'pending',
      payoutMethod: payoutMethod,
      upiId: upiId || '',
      bankAccountNumber: bankAccountNumber || '',
      bankAccountName: bankAccountName || '',
      bankIFSC: bankIFSC || '',
      bankName: bankName || ''
    });

    await payout.save();

    // Deduct from wallet (will be refunded if payout is cancelled)
    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    // Create debit transaction
    await Transaction.createDebit({
      userId: req.user.id,
      amount: amount,
      currency: 'INR',
      description: `Payout request: ${payout.payoutId}`,
      revenueType: 'payout',
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance,
      payoutId: payout._id,
      status: 'pending'
    });

    // Populate user data
    await payout.populate('user', 'name email role');

    res.status(201).json({
      status: 'success',
      message: 'Payout request created successfully',
      data: { payout }
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payout request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/payouts/my-payouts
// @desc    Get payout requests for current user
// @access  Private (Shop Owner, Delivery Boy)
router.get('/my-payouts', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'shop_owner' && req.user.role !== 'delivery_boy') {
      return res.status(403).json({
        status: 'error',
        message: 'Only shop owners and delivery partners can view payouts'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const filters = {
      status,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });

    const payouts = await Payout.getUserPayouts(req.user.id, filters);
    const total = await Payout.countDocuments({ userId: req.user.id });

    res.status(200).json({
      status: 'success',
      data: {
        payouts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get payout requests'
    });
  }
});

// @route   GET /api/payouts/all
// @desc    Get all payout requests (Admin only)
// @access  Private (Admin)
router.get('/all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can view all payout requests'
      });
    }

    const { status, userId, page = 1, limit = 50 } = req.query;

    const filters = {
      status,
      userId,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });

    const payouts = await Payout.getAllPayouts(filters);
    const total = await Payout.countDocuments(
      status ? { status } : userId ? { userId } : {}
    );

    res.status(200).json({
      status: 'success',
      data: {
        payouts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get all payouts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get payout requests'
    });
  }
});

// @route   PUT /api/payouts/:id/approve
// @desc    Approve and process a payout (Admin only)
// @access  Private (Admin)
router.put('/:id/approve', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can approve payouts'
      });
    }

    const { transactionReference = '' } = req.body;

    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({
        status: 'error',
        message: 'Payout request not found'
      });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Payout is already ${payout.status}`
      });
    }

    // Mark as processing
    await payout.markProcessing(req.user.id);

    // Simulate payment processing (in real scenario, this would call UPI/bank API)
    // Generate a simulated transaction reference if not provided
    const simulatedRef = transactionReference || 
      `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Mark as completed
    await payout.markCompleted(simulatedRef);

    // Update transaction status
    const transaction = await Transaction.findOne({ payoutId: payout._id });
    if (transaction) {
      transaction.status = 'completed';
      await transaction.save();
    }

    // Populate payout data
    await payout.populate('user', 'name email role');
    await payout.populate('processedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Payout processed successfully',
      data: { payout }
    });
  } catch (error) {
    console.error('Approve payout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/payouts/:id/reject
// @desc    Reject a payout request (Admin only)
// @access  Private (Admin)
router.put('/:id/reject', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can reject payouts'
      });
    }

    const { failureReason = 'Payout request rejected by admin' } = req.body;

    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({
        status: 'error',
        message: 'Payout request not found'
      });
    }

    if (payout.status !== 'pending' && payout.status !== 'processing') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot reject payout with status: ${payout.status}`
      });
    }

    // Mark as failed
    await payout.markFailed(failureReason);

    // Refund amount to wallet
    const wallet = await Wallet.getOrCreateWallet(payout.userId);
    const balanceBefore = wallet.balance;
    wallet.balance += payout.amount;
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    // Create credit transaction for refund
    await Transaction.createCredit({
      userId: payout.userId,
      amount: payout.amount,
      currency: 'INR',
      description: `Payout rejection refund: ${payout.payoutId}`,
      revenueType: 'payout',
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance,
      gatewayTransactionId: `REFUND-${payout.payoutId}`
    });

    // Update original debit transaction
    const transaction = await Transaction.findOne({ payoutId: payout._id });
    if (transaction) {
      transaction.status = 'cancelled';
      await transaction.save();
    }

    // Populate payout data
    await payout.populate('user', 'name email role');
    await payout.populate('processedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Payout rejected and amount refunded',
      data: { payout }
    });
  } catch (error) {
    console.error('Reject payout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/payouts/:id/cancel
// @desc    Cancel own payout request (User)
// @access  Private (Shop Owner, Delivery Boy)
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'shop_owner' && req.user.role !== 'delivery_boy') {
      return res.status(403).json({
        status: 'error',
        message: 'Only shop owners and delivery partners can cancel payouts'
      });
    }

    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({
        status: 'error',
        message: 'Payout request not found'
      });
    }

    if (payout.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only cancel your own payout requests'
      });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot cancel payout with status: ${payout.status}`
      });
    }

    // Cancel payout
    await payout.cancel('Cancelled by user');

    // Refund amount to wallet
    const wallet = await Wallet.getOrCreateWallet(req.user.id);
    const balanceBefore = wallet.balance;
    wallet.balance += payout.amount;
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    // Create credit transaction for refund
    await Transaction.createCredit({
      userId: req.user.id,
      amount: payout.amount,
      currency: 'INR',
      description: `Payout cancellation refund: ${payout.payoutId}`,
      revenueType: 'payout',
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance,
      gatewayTransactionId: `REFUND-${payout.payoutId}`
    });

    // Update original debit transaction
    const transaction = await Transaction.findOne({ payoutId: payout._id });
    if (transaction) {
      transaction.status = 'cancelled';
      await transaction.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Payout cancelled and amount refunded',
      data: { payout }
    });
  } catch (error) {
    console.error('Cancel payout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel payout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;


