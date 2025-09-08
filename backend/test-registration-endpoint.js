import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const testRegistration = async () => {
  try {
    console.log('🔍 Testing registration endpoint...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');
    
    // Test User model
    console.log('👤 Testing User model...');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'customer'
    });
    console.log('✅ User object created');
    
    // Test saving
    console.log('💾 Testing save...');
    const savedUser = await testUser.save();
    console.log('✅ User saved successfully');
    console.log('🆔 User ID:', savedUser._id);
    
    // Test finding
    console.log('🔍 Testing find...');
    const foundUser = await User.findById(savedUser._id);
    console.log('✅ User found successfully');
    
    // Clean up
    console.log('🧹 Cleaning up...');
    await User.findByIdAndDelete(savedUser._id);
    console.log('✅ Test user deleted');
    
    console.log('🎉 Registration test passed!');
    
  } catch (error) {
    console.error('❌ Registration test failed:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
};

testRegistration();
