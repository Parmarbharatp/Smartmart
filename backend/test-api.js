import fetch from 'node-fetch';

const testRegistrationAPI = async () => {
  try {
    console.log('🔍 Testing registration API...');
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'API Test User',
        email: 'apitest@example.com',
        password: 'password123',
        role: 'customer'
      })
    });
    
    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

// Wait a bit for server to start, then test
setTimeout(testRegistrationAPI, 3000);
