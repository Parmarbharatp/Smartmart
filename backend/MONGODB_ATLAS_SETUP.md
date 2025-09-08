# MongoDB Atlas Setup Guide for SmartMart

This guide will help you set up MongoDB Atlas (cloud database) and connect it to your SmartMart backend.

## 🚀 Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Create an account or sign in with Google/GitHub

## 🗄️ Step 2: Create a New Cluster

1. **Click "Build a Database"**
2. **Choose Plan:**
   - Select "FREE" tier (M0) for development
   - Click "Create"

3. **Choose Provider & Region:**
   - Select your preferred cloud provider (AWS, Google Cloud, Azure)
   - Choose a region close to your users
   - Click "Next"

4. **Cluster Settings:**
   - Keep default cluster name or customize it
   - Click "Create"

## 🔐 Step 3: Set Up Database Access

1. **Go to "Database Access" in the left sidebar**
2. **Click "Add New Database User"**
3. **Configure User:**
   - Username: `smartmart_user` (or your preferred name)
   - Password: Create a strong password
   - **IMPORTANT:** Save this password securely!
   - User Privileges: Select "Read and write to any database"
   - Click "Add User"

## 🌐 Step 4: Set Up Network Access

1. **Go to "Network Access" in the left sidebar**
2. **Click "Add IP Address"**
3. **Choose Access Method:**
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses
   - Click "Confirm"

## 🔗 Step 5: Get Connection String

1. **Go to "Database" in the left sidebar**
2. **Click "Connect" on your cluster**
3. **Choose "Connect your application"**
4. **Copy the connection string**

## ⚙️ Step 6: Update Configuration

1. **Open `config.env` file**
2. **Replace the MONGODB_URI with your connection string:**

```env
MONGODB_URI=mongodb+srv://smartmart_user:your-password@your-cluster.mongodb.net/smartmart?retryWrites=true&w=majority
```

**Important Notes:**
- Replace `your-password` with the actual password you created
- Replace `your-cluster` with your actual cluster name
- The `smartmart` at the end is your database name

## 🧪 Step 7: Test Connection

1. **Start your backend:**
   ```bash
   cd smart-mart/backend
   npm run dev
   ```

2. **Check console output for:**
   ```
   ✅ MongoDB Connected: your-cluster.mongodb.net
   ```

3. **Test the API:**
   ```bash
   node test-auth.js
   ```

## 🔒 Step 8: Security Best Practices

### For Development:
- Use the free tier
- Allow access from anywhere (0.0.0.0/0)
- Use simple passwords

### For Production:
- Use paid tiers for better performance
- Restrict IP access to your server IPs
- Use strong, complex passwords
- Enable MongoDB Atlas security features

## 🚨 Troubleshooting

### Connection Failed?
1. **Check your connection string format**
2. **Verify username and password**
3. **Ensure IP is whitelisted**
4. **Check if cluster is running**

### Authentication Error?
1. **Verify database user credentials**
2. **Check user privileges**
3. **Ensure database name is correct**

### Network Error?
1. **Check IP whitelist**
2. **Verify firewall settings**
3. **Try different network**

## 📱 Frontend Integration

Once your backend is connected to MongoDB Atlas, your frontend will automatically use the real database instead of localStorage.

### What Changes:
- ✅ User registration saves to MongoDB Atlas
- ✅ User login authenticates against real database
- ✅ User data persists across sessions
- ✅ Multiple users can use the system
- ✅ Data is secure and backed up

### What Stays the Same:
- ✅ Same API endpoints
- ✅ Same authentication flow
- ✅ Same user experience
- ✅ Same security features

## 🎯 Next Steps

1. **Test your backend with MongoDB Atlas**
2. **Create some test users**
3. **Verify data persistence**
4. **Set up monitoring and alerts**
5. **Plan for production deployment**

## 📞 Support

- **MongoDB Atlas Documentation:** [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **MongoDB Community:** [community.mongodb.com](https://community.mongodb.com)
- **SmartMart Issues:** Open an issue in this repository

---

**🎉 Congratulations!** Your SmartMart backend is now connected to a professional cloud database!
