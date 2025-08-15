# Bolt E-commerce Backend API

A comprehensive Node.js/Express backend API for the Bolt E-commerce platform.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access
- 🛍️ **Product Management** - CRUD operations for products with categories and variants
- 🛒 **Shopping Cart** - Session-based cart management
- 💳 **Payment Processing** - Stripe integration for secure payments
- 📦 **Order Management** - Complete order lifecycle management
- 🚚 **Delivery System** - Delivery tracking and management
- 👥 **User Management** - Customer and admin user management
- 📧 **Email Notifications** - Automated email notifications
- 🖼️ **File Upload** - Cloudinary integration for image uploads
- 🔒 **Security** - Rate limiting, input validation, XSS protection
- 📊 **Admin Dashboard** - Analytics and management tools

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe
- **File Upload**: Cloudinary
- **Email**: Nodemailer
- **Validation**: Joi & Express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration values.

4. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

Copy `env.example` to `.env` and configure:

- **Database**: MongoDB connection string
- **JWT**: Secret key for token generation
- **Email**: SMTP configuration for notifications
- **Payment**: Stripe API keys
- **File Upload**: Cloudinary credentials
- **Security**: Rate limiting and CORS settings

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item
- `DELETE /api/cart/remove/:itemId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook handler

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users (Admin)
- `GET /api/admin/orders` - Get all orders (Admin)
- `PUT /api/admin/users/:id` - Update user (Admin)

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── tests/               # Test files
├── uploads/             # File uploads (gitignored)
├── package.json
├── .env
└── README.md
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### API Documentation

The API documentation is available at `/api-docs` when running in development mode.

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Comprehensive request validation
- **XSS Protection**: Cross-site scripting protection
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **MongoDB Sanitization**: Prevents NoSQL injection
- **JWT Authentication**: Secure token-based authentication

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure production database URI
3. Set up proper CORS origins
4. Configure SSL certificates
5. Set up environment variables for production services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details 