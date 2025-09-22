// Test utility for OpenStreetMap location services
import { getLocationDetails, geocodeAddress, reverseGeocode } from '../services/location';

export async function testOpenStreetMapIntegration() {
  console.log('🧪 Testing OpenStreetMap Integration...');
  
  try {
    // Test 1: Reverse geocoding (coordinates to address)
    console.log('📍 Test 1: Reverse Geocoding');
    const reverseResult = await reverseGeocode({ lat: 40.7128, lng: -74.0060 });
    console.log('Reverse geocoding result:', reverseResult);
    
    // Test 2: Get detailed location information
    console.log('📍 Test 2: Location Details');
    const detailsResult = await getLocationDetails({ lat: 40.7128, lng: -74.0060 });
    console.log('Location details result:', detailsResult);
    
    // Test 3: Forward geocoding (address to coordinates)
    console.log('📍 Test 3: Forward Geocoding');
    const forwardResult = await geocodeAddress('Times Square, New York');
    console.log('Forward geocoding result:', forwardResult);
    
    console.log('✅ OpenStreetMap integration test completed successfully!');
    return {
      success: true,
      reverseGeocoding: reverseResult,
      locationDetails: detailsResult,
      forwardGeocoding: forwardResult
    };
  } catch (error) {
    console.error('❌ OpenStreetMap integration test failed:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Test rate limiting
export async function testRateLimiting() {
  console.log('⏱️ Testing Rate Limiting...');
  
  const startTime = Date.now();
  
  try {
    // Make multiple requests quickly to test rate limiting
    const promises = [
      getLocationDetails({ lat: 40.7128, lng: -74.0060 }),
      getLocationDetails({ lat: 34.0522, lng: -118.2437 }),
      getLocationDetails({ lat: 51.5074, lng: -0.1278 })
    ];
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`⏱️ Rate limiting test completed in ${totalTime}ms`);
    console.log('Results:', results);
    
    return {
      success: true,
      totalTime,
      results
    };
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Test error handling
export async function testErrorHandling() {
  console.log('🚨 Testing Error Handling...');
  
  try {
    // Test with invalid coordinates
    const invalidResult = await getLocationDetails({ lat: 999, lng: 999 });
    console.log('Invalid coordinates result:', invalidResult);
    
    // Test with empty address
    const emptyAddressResult = await geocodeAddress('');
    console.log('Empty address result:', emptyAddressResult);
    
    console.log('✅ Error handling test completed!');
    return {
      success: true,
      invalidCoordinates: invalidResult,
      emptyAddress: emptyAddressResult
    };
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Run all tests
export async function runAllLocationTests() {
  console.log('🚀 Running All Location Tests...');
  
  const results = {
    integration: await testOpenStreetMapIntegration(),
    rateLimiting: await testRateLimiting(),
    errorHandling: await testErrorHandling()
  };
  
  console.log('📊 Test Results Summary:', results);
  return results;
}
