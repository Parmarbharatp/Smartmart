import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Wallet } from '../models/Wallet.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';

const router = express.Router();

// @route   GET /api/wallets/balance
// @desc    Get wallet balance for current user
// @access  Private
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.getOrCreateWallet(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        totalEarnings: wallet.totalEarnings,
        totalWithdrawn: wallet.totalWithdrawn,
        currency: wallet.currency,
        lastTransactionDate: wallet.lastTransactionDate
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get wallet balance'
    });
  }
});

// @route   GET /api/wallets/transactions
// @desc    Get wallet transactions for current user
// @access  Private
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const { 
      transactionType, 
      revenueType, 
      status, 
      dateFrom, 
      dateTo,
      page = 1, 
      limit = 20 
    } = req.query;

    const filters = {
      transactionType,
      revenueType,
      status,
      dateFrom,
      dateTo,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });

    const transactions = await Transaction.getUserTransactions(req.user.id, filters);
    const total = await Transaction.countDocuments({ userId: req.user.id });

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transactions'
    });
  }
});

// @route   GET /api/wallets/:userId
// @desc    Get wallet balance for a specific user (Admin only)
// @access  Private (Admin)
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can view other users\' wallets'
      });
    }

    const wallet = await Wallet.getOrCreateWallet(req.params.userId);
    const user = await User.findById(req.params.userId).select('name email role');

    res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          totalEarnings: wallet.totalEarnings,
          totalWithdrawn: wallet.totalWithdrawn,
          currency: wallet.currency,
          lastTransactionDate: wallet.lastTransactionDate
        },
        user
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get wallet details'
    });
  }
});

export default router;


