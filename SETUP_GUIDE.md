# 🚀 SmartMart Complete Setup Guide

This guide will help you set up your SmartMart project with a real backend and MongoDB Atlas database, replacing the localStorage functionality.

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB Atlas account (free tier available)
- Git (for version control)

## 🗄️ Step 1: Set Up MongoDB Atlas

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Free tier)

### 1.2 Configure Database Access
1. Go to "Database Access" → "Add New Database User"
2. Username: `smartmart_user`
3. Password: Create a strong password
4. User Privileges: "Read and write to any database"

### 1.3 Configure Network Access
1. Go to "Network Access" → "Add IP Address"
2. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
3. For production: Add specific IP addresses

### 1.4 Get Connection String
1. Go to "Database" → Click "Connect"
2. Choose "Connect your application"
3. Copy the connection string

## 🔧 Step 2: Configure Backend

### 2.1 Navigate to Backend Directory
```bash
cd smart-mart/backend
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Update Environment Configuration
1. Open `config.env`
2. Replace the MONGODB_URI with your actual connection string:

```env
MONGODB_URI=mongodb+srv://smartmart_user:your-actual-password@your-cluster.mongodb.net/smartmart?retryWrites=true&w=majority
```

**Important:** Replace:
- `your-actual-password` with the password you created
- `your-cluster` with your actual cluster name

### 2.4 Test Backend Connection
```bash
npm run dev
```

You should see:
```
🚀 SmartMart Backend running on port 5000
✅ MongoDB Connected: your-cluster.mongodb.net
```

## 🎨 Step 3: Configure Frontend

### 3.1 Navigate to Frontend Directory
```bash
cd smart-mart/project
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Update Environment Configuration
1. Copy `env.config` to `.env`:
```bash
cp env.config .env
```

2. Update `.env` with your settings:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3.4 Test Frontend
```bash
npm run dev
```

## 🔗 Step 4: Test Complete System

### 4.1 Start Both Services

**Terminal 1 - Backend:**
```bash
cd smart-mart/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd smart-mart/project
npm run dev
```

### 4.2 Test Authentication Flow

1. **Open Frontend:** http://localhost:5173
2. **Go to Register Page:** Create a new account
3. **Check Backend Logs:** Verify user creation in MongoDB
4. **Test Login:** Use the credentials you just created
5. **Verify Token:** Check browser localStorage for JWT token

### 4.3 Run Backend Tests
```bash
cd smart-mart/backend
node test-auth.js
```

## 🧪 Step 5: Verify Database Integration

### 5.1 Check MongoDB Atlas
1. Go to your MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Look for the `smartmart` database
4. Verify `users` collection exists with your test user

### 5.2 Test Data Persistence
1. Create a user account
2. Close the browser
3. Reopen and login
4. Verify user data persists

## 🚨 Troubleshooting

### Backend Won't Start?
- Check if MongoDB Atlas is accessible
- Verify connection string format
- Ensure IP is whitelisted in Atlas

### Frontend Can't Connect?
- Verify backend is running on port 5000
- Check CORS configuration
- Ensure API URL is correct in `.env`

### Authentication Fails?
- Check backend logs for errors
- Verify JWT secret in `config.env`
- Check if user exists in database

### Database Connection Issues?
- Verify MongoDB Atlas cluster is running
- Check network access settings
- Verify username/password in connection string

## 🔒 Security Considerations

### Development
- Use free MongoDB Atlas tier
- Allow access from anywhere (0.0.0.0/0)
- Use simple passwords

### Production
- Use paid MongoDB Atlas tiers
- Restrict IP access to server IPs
- Use strong, complex passwords
- Enable MongoDB Atlas security features
- Use environment variables for secrets

## 📱 What's Changed

### Before (localStorage):
- ❌ User data stored in browser
- ❌ No real authentication
- ❌ Data lost on browser clear
- ❌ No user persistence
- ❌ Single user only

### After (MongoDB Atlas):
- ✅ User data stored in cloud database
- ✅ Real JWT authentication
- ✅ Data persists across sessions
- ✅ Multiple users supported
- ✅ Secure password hashing
- ✅ Professional database

## 🎯 Next Steps

1. **Add More Features:**
   - Product management
   - Order system
   - Payment integration
   - Real-time notifications

2. **Deploy to Production:**
   - Set up production MongoDB Atlas cluster
   - Deploy backend to cloud (Heroku, AWS, etc.)
   - Deploy frontend to CDN
   - Set up domain and SSL

3. **Add Monitoring:**
   - Database performance monitoring
   - API usage analytics
   - Error tracking
   - User analytics

## 📞 Support

- **Backend Issues:** Check `smart-mart/backend/README.md`
- **MongoDB Atlas:** [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Frontend Issues:** Check browser console and network tab
- **General Issues:** Open an issue in this repository

---

## 🎉 Congratulations!

You've successfully transformed your SmartMart project from a localStorage-based demo to a professional, scalable application with:

- ✅ **Real Backend API** (Node.js + Express)
- ✅ **Cloud Database** (MongoDB Atlas)
- ✅ **Secure Authentication** (JWT + bcrypt)
- ✅ **Professional Architecture**
- ✅ **Production Ready**

Your SmartMart is now ready for real users and can scale to handle thousands of customers! 🚀
