# SmartMart Backend API

A secure and scalable backend API for the SmartMart e-commerce platform, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control** - Support for admin, customer, shop owner, and delivery boy roles
- **Google OAuth Integration** - Seamless Google sign-in support
- **Input Validation** - Comprehensive request validation using express-validator
- **Security Features** - Helmet, CORS, rate limiting, and more
- **MongoDB Integration** - Robust database operations with Mongoose
- **Error Handling** - Centralized error handling and logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository and navigate to backend folder:**
   ```bash
   cd smart-mart/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `config.env` and update the values:
   ```bash
   cp config.env .env
   ```
   - Update the following variables:
     - `JWT_SECRET`: Your secret key for JWT tokens
     - `MONGODB_URI`: Your MongoDB connection string
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID (optional)

4. **Start MongoDB:**
   - Local: `mongod`
   - Cloud: Use MongoDB Atlas or similar service

5. **Run the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `JWT_SECRET` | JWT signing secret | fallback-secret-key |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/smartmart |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## 📚 API Endpoints

### Authentication Routes

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer",
  "phoneNumber": "+1234567890",
  "address": "123 Main St"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/google`
Google OAuth authentication.

**Request Body:**
```json
{
  "email": "john@gmail.com",
  "name": "John Doe",
  "picture": "https://profile-picture-url.com"
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### POST `/api/auth/logout`
Logout user (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## 🔐 Authentication

### JWT Token Usage

Include the JWT token in the Authorization header for protected routes:

```
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control

The API supports the following user roles:
- `admin` - Full platform access
- `shop_owner` - Shop management access
- `customer` - Shopping and order access
- `delivery_boy` - Delivery management access

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required for non-Google users),
  role: String (enum: admin, customer, shop_owner, delivery_boy),
  phoneNumber: String,
  address: String,
  profilePicture: String,
  vehicleType: String, // For delivery boys
  licenseNumber: String, // For delivery boys
  googleId: String, // For Google OAuth users
  isActive: Boolean,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Security Features

- **Password Hashing** - bcrypt with 12 salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Input Validation** - Comprehensive request validation
- **Rate Limiting** - API rate limiting to prevent abuse
- **CORS Protection** - Configurable cross-origin resource sharing
- **Helmet** - Security headers for Express
- **Request Logging** - Morgan HTTP request logger

## 🧪 Testing

Test the API endpoints using tools like Postman, Insomnia, or curl:

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"customer"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚀 Deployment

1. **Set production environment variables**
2. **Use PM2 or similar process manager**
3. **Set up reverse proxy (Nginx)**
4. **Configure SSL certificates**
5. **Set up monitoring and logging**

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.
