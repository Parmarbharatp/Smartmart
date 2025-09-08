import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🔍 Testing User model...');

// Test User model import
try {
  const { User } = await import('./models/User.js');
  console.log('✅ User model imported successfully');
  
  // Test User model creation
  const testUser = new User({
    name: 'Test User',
    email: 'test@example.com',
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
  
} catch (error) {
  console.error('❌ User model test failed:', error.message);
  console.error('❌ Stack:', error.stack);
}
