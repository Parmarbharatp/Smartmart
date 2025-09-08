import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🔍 Simple test starting...');
console.log('📊 Environment variables loaded');

const mongoURI = process.env.MONGODB_URI;
console.log('🔗 MongoDB URI:', mongoURI ? 'Found' : 'Missing');

if (!mongoURI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// Test basic connection
mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Test basic User model
    const userSchema = new mongoose.Schema({
      name: String,
      email: String
    });
    
    const TestUser = mongoose.model('TestUser', userSchema);
    console.log('✅ TestUser model created');
    
    // Test saving
    const testUser = new TestUser({
      name: 'Test',
      email: 'test@test.com'
    });
    
    return testUser.save();
  })
  .then((savedUser) => {
    console.log('✅ Test user saved:', savedUser._id);
    
    // Clean up
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('✅ Connection closed');
    console.log('🎉 Basic test passed!');
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Stack:', error.stack);
  });
