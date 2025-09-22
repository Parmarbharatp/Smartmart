import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
    .custom((value) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length < 2 || !/[a-zA-Z]/.test(trimmedValue)) {
        throw new Error('Name must contain actual characters (not just spaces) and be at least 2 characters');
      }
      return true;
    }),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
    .custom((value) => {
      // Must start with a letter
      if (!/^[a-zA-Z]/.test(value)) {
        throw new Error('Email must start with a letter');
      }
      return true;
    }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['customer', 'shop_owner', 'delivery_boy']).withMessage('Invalid role selected'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  body('address')
    .if(body('role').equals('customer'))
    .notEmpty()
    .withMessage('Address is required for customers')
    .isLength({ min: 11 })
    .withMessage('Address must be more than 10 characters')
    .custom((value) => {
      if (!/[a-zA-Z]/.test(value.trim())) {
        throw new Error('Address must contain meaningful content (letters)');
      }
      return true;
    }),
  body('licenseNumber')
    .if(body('role').equals('delivery_boy'))
    .notEmpty()
    .withMessage('Driving license number is required for delivery boys')
    .custom((value) => {
      if (!value) {
        throw new Error('Driving license number is required for delivery boys');
      }
      
      const trimmedLicense = value.trim();
      
      // Must be exactly 13 characters (2 letters + 2 digits + 2 digits + 7 digits)
      if (trimmedLicense.length !== 13) {
        throw new Error('License must be exactly 13 characters. Use format: GJ05201123456');
      }
      
      // Format: State Code (2 letters) + RTO Code (2 digits) + Year (2 digits) + Number (7 digits)
      const licenseRegex = /^[A-Z]{2}\d{2}\d{2}\d{7}$/;
      
      if (!licenseRegex.test(trimmedLicense)) {
        throw new Error('Invalid license format. Use format: GJ05201123456');
      }
      return true;
    })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, async (req, res) => {
  try {
    console.log('🔍 Registration attempt:', { name: req.body.name, email: req.body.email, role: req.body.role });
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, phoneNumber, address, vehicleType, licenseNumber } = req.body;

    // Check if user already exists (double check for race conditions)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        status: 'error',
        message: 'An account with this email address already exists. Please use a different email or try logging in instead.',
        field: 'email'
      });
    }
    console.log('✅ User does not exist, proceeding with registration');

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phoneNumber: phoneNumber || '',
      address: address || '',
      // Persist delivery related fields
      vehicleType: role === 'delivery_boy' ? (vehicleType || '') : '',
      licenseNumber: role === 'delivery_boy' ? (licenseNumber || '') : '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save user to database
    console.log('💾 Saving user to database...');
    const savedUser = await newUser.save();
    console.log('✅ User saved successfully with ID:', savedUser._id);

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    // Generate JWT token
    const token = generateToken(savedUser._id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        status: 'error',
        message: 'An account with this email address already exists. Please use a different email or try logging in instead.',
        field: 'email'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during login'
    });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
router.post('/google', async (req, res) => {
  try {
    console.log('🔍 Google OAuth attempt:', { email: req.body.email, name: req.body.name });
    const { email, name, picture } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and name are required for Google authentication'
      });
    }

    // Check if user already exists (case-insensitive)
    let user = await User.findOne({ email: email.toLowerCase() });
    console.log('🔍 Existing user check:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('💾 Creating new Google user...');
      // Create new user from Google data
      user = new User({
        name,
        email: email.toLowerCase().trim(),
        role: 'customer', // Default role for Google users
        phoneNumber: '0000000000', // Default phone number for Google users
        address: 'Address will be updated later', // Default address for Google users
        profilePicture: picture || '',
        googleId: email.toLowerCase().trim(), // Set googleId to make password optional
        createdAt: new Date(),
        updatedAt: new Date()
      });

      try {
        await user.save();
        console.log('✅ New Google user created with ID:', user._id);
      } catch (saveError) {
        // If save fails due to duplicate email (race condition), try to find the user again
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.email) {
          console.log('🔄 Duplicate email detected during save, finding existing user...');
          user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            console.log('✅ Found existing user after duplicate error:', user._id);
          } else {
            throw saveError; // Re-throw if we still can't find the user
          }
        } else {
          throw saveError; // Re-throw other errors
        }
      }
    } else {
      console.log('✅ Existing Google user found:', user._id);
    }

    // Remove password from response (if exists)
    const userResponse = user.toObject();
    if (userResponse.password) {
      delete userResponse.password;
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Google authentication successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('❌ Google auth error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        status: 'error',
        message: 'An account with this email address already exists. Please use a different email or try logging in instead.',
        field: 'email'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during Google authentication',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching profile'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', verifyToken, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
});

// Email transporter (use SMTP env)
console.log('📧 Creating email transporter with config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER,
  hasPass: !!process.env.SMTP_PASS
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

async function sendResetOtpEmail(to, otp) {
  console.log('📧 sendResetOtpEmail called with:', { to, otp });
  
  const appName = process.env.APP_NAME || 'SmartMart';
  const from = process.env.EMAIL_FROM || `${appName} <no-reply@smartmart.local>`;
  const subject = `${appName} Password Reset OTP`;
  const html = `
    <div style="font-family:Arial,sans-serif;">
      <h2>Password Reset Request</h2>
      <p>Your OTP code is:</p>
      <div style="font-size:22px;font-weight:bold;letter-spacing:4px;">${otp}</div>
      <p>This code will expire in 10 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `;
  
  console.log('📧 Email details:', { from, to, subject, appName });
  console.log('📧 SMTP_HOST exists:', !!process.env.SMTP_HOST);
  
  if (!process.env.SMTP_HOST) {
    console.log(`📧 Dev Mode OTP for ${to}: ${otp}`);
    return;
  }
  
  try {
    console.log('📧 Attempting to send email...');
    const result = await transporter.sendMail({ from, to, subject, html });
    console.log('📧 Email sent successfully:', result.messageId);
  } catch (e) {
    console.error('❌ Email send failed, falling back to console OTP:', e);
    console.log(`📧 OTP for ${to}: ${otp}`);
    // Do not throw further; allow flow to proceed
  }
}

// @route   POST /api/auth/forgot-password
// @desc    Initiate password reset by generating a token
// @access  Public
router.post('/forgot-password', [body('email').isEmail().withMessage('Valid email is required')], async (req, res) => {
  try {
    console.log('🔍 Forgot password request for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('🔍 User found:', !!user);

    // Respond with success even if user not found (avoid user enumeration)
    if (!user) {
      console.log('❌ User not found, returning generic success message');
      return res.status(200).json({ status: 'success', message: 'If that email exists, a reset link has been sent' });
    }

    // Generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
    console.log('🔑 Generated OTP:', otp, 'Expires:', expires);

    user.resetOtpCode = otp;
    user.resetOtpExpires = expires;
    await user.save();
    console.log('💾 OTP saved to database');

    console.log('📧 Sending OTP email to:', user.email);
    await sendResetOtpEmail(user.email, otp);
    console.log('✅ OTP email sent successfully');

    return res.status(200).json({ status: 'success', message: 'If that email exists, an OTP has been sent' });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error initiating password reset' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      }

      const { email, otp, password } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
        resetOtpCode: otp,
        resetOtpExpires: { $gt: new Date() }
      }).select('+password');

      if (!user) {
        return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
      }

      const saltRounds = 12;
      user.password = await bcrypt.hash(password, saltRounds);
      user.resetOtpCode = null;
      user.resetOtpExpires = null;
      await user.save();

      return res.status(200).json({ status: 'success', message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error resetting password' });
    }
  }
);

// @route   POST /api/auth/check-email
// @desc    Check if email already exists
// @access  Public
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    const existingUser = await User.findOne({ email });
    
    res.status(200).json({
      status: 'success',
      data: {
        exists: !!existingUser,
        message: existingUser ? 'Email already exists' : 'Email is available'
      }
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while checking email'
    });
  }
});

// @route   PUT /api/auth/update-location
// @desc    Update user location with coordinates and address details
// @access  Private
router.put('/update-location', verifyToken, [
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update location data
    user.location = {
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

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully',
      data: {
        location: user.location
      }
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating location'
    });
  }
});

// @route   GET /api/auth/location
// @desc    Get user's current location
// @access  Private
router.get('/location', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('location');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        location: user.location
      }
    });

  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching location'
    });
  }
});

// @route   PUT /api/auth/location-tracking-preferences
// @desc    Update user's location tracking preferences
// @access  Private
router.put('/location-tracking-preferences', verifyToken, [
  body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  body('updateInterval').isNumeric().withMessage('Update interval must be a number'),
  body('highAccuracy').isBoolean().withMessage('High accuracy must be a boolean')
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

    const { enabled, updateInterval, highAccuracy } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update location tracking preferences
    user.locationTracking = {
      enabled: enabled || false,
      updateInterval: updateInterval || 5 * 60 * 1000, // Default to 5 minutes
      highAccuracy: highAccuracy !== undefined ? highAccuracy : true,
      lastTrackingUpdate: new Date()
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Location tracking preferences updated successfully',
      data: {
        locationTracking: user.locationTracking
      }
    });

  } catch (error) {
    console.error('Update location tracking preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating location tracking preferences'
    });
  }
});

// @route   GET /api/auth/location-tracking-preferences
// @desc    Get user's location tracking preferences
// @access  Private
router.get('/location-tracking-preferences', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('locationTracking');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        locationTracking: user.locationTracking
      }
    });

  } catch (error) {
    console.error('Get location tracking preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching location tracking preferences'
    });
  }
});

export default router;
// Admin: list users
router.get('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }
    const { page = 1, limit = 50, search, role } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await User.countDocuments(query);
    res.status(200).json({ status: 'success', data: { users, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (e) {
    console.error('List users error:', e);
    res.status(500).json({ status: 'error', message: 'Internal server error while fetching users' });
  }
});
