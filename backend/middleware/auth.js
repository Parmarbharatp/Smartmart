import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Generate JWT token
export const generateToken = (userId) => {
  console.log('🔑 Generating token for user ID:', userId);
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
  console.log('✅ Token generated successfully');
  return token;
};

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      
      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('❌ User not found for ID:', decoded.id);
        return res.status(401).json({
          status: 'error',
          message: 'Token is valid but user no longer exists.'
        });
      }
      
      console.log('✅ User found:', user.email);

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account is deactivated.'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired. Please login again.'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token. Please login again.'
        });
      } else {
        return res.status(401).json({
          status: 'error',
          message: 'Token verification failed.'
        });
      }
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication.'
    });
  }
};

// Role-based access control middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token is invalid, but we don't fail the request
        console.log('Optional auth: Invalid token provided');
      }
    }
    
    next();
  } catch (error) {
    // Don't fail the request for optional auth errors
    next();
  }
};

// Admin only middleware
export const requireAdmin = requireRole('admin');

// Shop owner only middleware
export const requireShopOwner = requireRole('shop_owner');

// Customer only middleware
export const requireCustomer = requireRole('customer');

// Delivery boy only middleware
export const requireDeliveryBoy = requireRole('delivery_boy');
