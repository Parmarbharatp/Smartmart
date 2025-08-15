const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  getAllOrders,
  updateUser,
  deleteUser,
  getAnalytics
} = require('../controllers/admin');

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/analytics', getAnalytics);

module.exports = router; 