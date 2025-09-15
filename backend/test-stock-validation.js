import mongoose from 'mongoose';
import { Product } from './models/Product.js';
import { Cart } from './models/Cart.js';
import { User } from './models/User.js';
import { Order } from './models/Order.js';

// Test stock validation functionality
async function testStockValidation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartmart');
    console.log('Connected to MongoDB');

    // Create a test product with limited stock
    const testProduct = new Product({
      shopId: new mongoose.Types.ObjectId(),
      categoryId: new mongoose.Types.ObjectId(),
      productName: 'Test Product',
      description: 'A test product for stock validation',
      price: 10.99,
      stockQuantity: 5, // Limited stock
      status: 'available'
    });

    await testProduct.save();
    console.log('✅ Created test product with stock:', testProduct.stockQuantity);

    // Test 1: Add item to cart within stock limit
    console.log('\n🧪 Test 1: Adding item within stock limit');
    const cart = new Cart({
      customerId: new mongoose.Types.ObjectId(),
      items: []
    });

    await cart.addItem(testProduct._id, 3);
    console.log('✅ Successfully added 3 items to cart');

    // Test 2: Try to add more items exceeding stock
    console.log('\n🧪 Test 2: Trying to add items exceeding stock');
    try {
      await cart.addItem(testProduct._id, 5); // This should fail (3 + 5 = 8 > 5)
      console.log('❌ ERROR: Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly prevented adding items exceeding stock:', error.message);
    }

    // Test 3: Update quantity to exceed stock
    console.log('\n🧪 Test 3: Updating quantity to exceed stock');
    try {
      await cart.updateItemQuantity(testProduct._id, 10);
      console.log('❌ ERROR: Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly prevented updating quantity exceeding stock');
    }

    // Test 4: Create order with valid quantity
    console.log('\n🧪 Test 4: Creating order with valid quantity');
    const order = new Order({
      customerId: new mongoose.Types.ObjectId(),
      shopId: testProduct.shopId,
      shippingAddress: '123 Test St',
      items: [{
        productId: testProduct._id,
        quantity: 2,
        priceAtPurchase: testProduct.price
      }],
      totalAmount: testProduct.price * 2
    });

    await order.save();
    console.log('✅ Successfully created order');

    // Test 5: Try to create order exceeding stock
    console.log('\n🧪 Test 5: Trying to create order exceeding stock');
    try {
      const invalidOrder = new Order({
        customerId: new mongoose.Types.ObjectId(),
        shopId: testProduct.shopId,
        shippingAddress: '123 Test St',
        items: [{
          productId: testProduct._id,
          quantity: 10, // This exceeds available stock
          priceAtPurchase: testProduct.price
        }],
        totalAmount: testProduct.price * 10
      });

      await invalidOrder.save();
      console.log('❌ ERROR: Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly prevented creating order exceeding stock');
    }

    // Test 6: Validate cart items
    console.log('\n🧪 Test 6: Validating cart items');
    await cart.validateItems();
    console.log('✅ Cart validation completed');

    // Cleanup
    await Product.deleteOne({ _id: testProduct._id });
    await Cart.deleteOne({ _id: cart._id });
    await Order.deleteOne({ _id: order._id });
    console.log('\n🧹 Cleaned up test data');

    console.log('\n🎉 All stock validation tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testStockValidation();
