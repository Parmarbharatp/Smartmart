import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shops.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import reviewRoutes from './routes/reviews.js';
import aiRoutes from './routes/ai.js';
import paymentRoutes from './routes/payments.js';
import walletRoutes from './routes/wallets.js';
import payoutRoutes from './routes/payouts.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: './config.env' });
// Example code for index.js

app.get('/', (req, res) => {
  res.status(200).json({
    message: "SmartMart Backend is Active!",
    version: "1.0"
  });
});

// Baaki sab aapke /api routes ya doosre routes yahan honge

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL_ENV = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = FRONTEND_URL_ENV.split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log('✅ Allowed CORS origins:', allowedOrigins);

// Rate limiting - More lenient for auth endpoints (sign up/sign in)
// Allows more signups/logins since they're legitimate user actions needed for scaling to 1M+ users
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 50, // 50 auth requests per IP per 15 min (supports multiple signups from same network/office)
  message: {
    error: 'Too many authentication attempts from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins against limit (only failed attempts)
});

// Rate limiting - Very lenient for READ operations (GET requests) - Product browsing, viewing, searching
// Users browse many products, so they need high limits for GET requests
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_READ_MAX) || 1000, // 1000 GET requests per IP per 15 min (supports heavy product browsing)
  message: {
    error: 'Too many read requests from this IP. Please slow down your browsing.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to GET requests (read operations)
    return req.method !== 'GET';
  }
});

// Rate limiting - Stricter for WRITE operations (POST/PUT/DELETE) - Security protection
// Create, update, delete operations need stricter limits to prevent abuse
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_WRITE_MAX) || 200, // 200 write requests per IP per 15 min (enough for normal usage, prevents abuse)
  message: {
    error: 'Too many write requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to POST, PUT, DELETE requests (write operations)
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  }
});

// Rate limiting - General fallback limit (only for routes not covered by specific limiters)
// This is a safety net but read/write limiters handle most cases
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // 500 total requests per IP per windowMs as fallback
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for auth routes (have their own limiter)
    // Skip for GET requests (handled by readLimiter)
    // Skip for POST/PUT/DELETE (handled by writeLimiter)
    return req.path.startsWith('/api/auth/register') || 
           req.path.startsWith('/api/auth/login') ||
           req.method === 'GET' ||
           ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  }
});

// Apply limiters in order:
// 1. Auth-specific limiter (highest priority for auth routes)
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
// 2. Read limiter (for GET requests - product browsing, viewing)
app.use('/api/', readLimiter);
// 3. Write limiter (for POST/PUT/DELETE - create/update/delete operations)
app.use('/api/', writeLimiter);
// 4. General limiter as fallback (for any other requests not covered above)
app.use('/api/', generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SmartMart Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/payouts', payoutRoutes);

// Serve frontend in production (optional)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../project/dist');
const shouldServeFrontend = process.env.SERVE_FRONTEND !== 'false';

if (shouldServeFrontend && fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback: serve index.html for non-API routes
  app.get(/^(?!\/api\/).*/, (req, res, next) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  });
} else {
  console.log('⚠️  Skipping static frontend serving (SERVE_FRONTEND disabled or dist missing).');
}

// 404 handler (for APIs and unmatched files)
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SmartMart Backend running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  // Seed default data if not exists
  (async () => {
    try {
      // Seed default admin
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@smartmart.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345';
      const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!existingAdmin) {
        const hashed = await bcrypt.hash(adminPassword, 12);
        const admin = new User({
          name: 'SmartMart Admin',
          email: adminEmail.toLowerCase().trim(),
          password: hashed,
          role: 'admin',
          phoneNumber: '0000000000',
          address: 'Admin Address',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await admin.save();
        console.log(`👑 Default admin created: ${adminEmail}`);
      } else {
        console.log(`👑 Admin exists: ${adminEmail}`);
      }

      // Seed default categories
      const defaultCategories = [
        {
          name: 'Electronics',
          description: 'Electronic devices and accessories',
          isBuiltIn: true
        },
        {
          name: 'Fashion',
          description: 'Clothing and accessories',
          isBuiltIn: true
        },
        {
          name: 'Home & Garden',
          description: 'Home improvement and garden supplies',
          isBuiltIn: true
        },
        {
          name: 'Food & Beverages',
          description: 'Food products and beverages',
          isBuiltIn: true
        }
      ];

      for (const categoryData of defaultCategories) {
        const existingCategory = await Category.findOne({ name: categoryData.name });
        if (!existingCategory) {
          const category = new Category(categoryData);
          await category.save();
          console.log(`📂 Default category created: ${categoryData.name}`);
        }
      }
      console.log(`📂 Default categories checked`);
    } catch (e) {
      console.error('Seed data failed:', e);
    }
  })();
});

export default app;
