import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shops.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import reviewRoutes from './routes/reviews.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

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

// 404 handler
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
