import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const testRegistration = async () => {
  try {
    console.log('🔍 Starting registration debug...');
    
    // Test MongoDB connection
    console.log('📊 Testing MongoDB connection...');
    const mongoURI = process.env.MONGODB_URI;
    console.log('🔗 MongoDB URI:', mongoURI ? 'Found' : 'Missing');
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      return;
    }
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    
    // Test User model
    console.log('👤 Testing User model...');
    const { User } = await import('./models/User.js');
    console.log('✅ User model imported successfully');
    
    // Test creating a user object
    console.log('🏗️ Testing user object creation...');
    const testUser = new User({
      name: 'Debug Test User',
      email: 'debug@test.com',
      password: 'password123',
      role: 'customer'
    });
    console.log('✅ User object created successfully');
    console.log('📝 User object:', {
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
      hasPassword: !!testUser.password
    });
    
    // Test password hashing
    console.log('🔐 Testing password hashing...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('✅ Password hashed successfully');
    console.log('🔑 Hashed password length:', hashedPassword.length);
    
    // Test saving user to database
    console.log('💾 Testing user save to database...');
    testUser.password = hashedPassword;
    const savedUser = await testUser.save();
    console.log('✅ User saved to database successfully');
    console.log('🆔 Saved user ID:', savedUser._id);
    
    // Test finding user
    console.log('🔍 Testing user retrieval...');
    const foundUser = await User.findById(savedUser._id);
    console.log('✅ User retrieved successfully');
    console.log('📝 Retrieved user:', {
      id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role
    });
    
    // Clean up test user
    console.log('🧹 Cleaning up test user...');
    await User.findByIdAndDelete(savedUser._id);
    console.log('✅ Test user deleted successfully');
    
    console.log('🎉 All tests passed! Registration should work now.');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('❌ Error stack:', error.stack);
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
};

// Run the debug test
testRegistration();
