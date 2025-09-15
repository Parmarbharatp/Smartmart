// Test script to check validation
const mongoose = require('mongoose');

// Test ObjectId validation
const testShopId = '507f1f77bcf86cd799439011'; // Valid ObjectId
const testProductId = '507f1f77bcf86cd799439012'; // Valid ObjectId
const testInvalidId = 'invalid-id';

console.log('Testing ObjectId validation:');
console.log('Valid shopId:', mongoose.Types.ObjectId.isValid(testShopId));
console.log('Valid productId:', mongoose.Types.ObjectId.isValid(testProductId));
console.log('Invalid ID:', mongoose.Types.ObjectId.isValid(testInvalidId));

// Test address length
const testAddress = '123 Main St, City, State 12345';
console.log('\nTesting address validation:');
console.log('Address length:', testAddress.length);
console.log('Address valid (10-200 chars):', testAddress.length >= 10 && testAddress.length <= 200);

// Test order data structure
const testOrderData = {
  shopId: testShopId,
  shippingAddress: testAddress,
  items: [
    {
      productId: testProductId,
      quantity: 1
    }
  ],
  paymentMethod: 'cash_on_delivery',
  notes: 'test order'
};

console.log('\nTest order data:');
console.log(JSON.stringify(testOrderData, null, 2));
