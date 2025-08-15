const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/users');

const router = express.Router();

// Validation middleware
const userUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

// Protected routes
router.use(protect);

// User can access their own profile
router.get('/profile', getUser);
router.put('/profile', userUpdateValidation, updateUser);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), userUpdateValidation, updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router; 