import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

const testShopFunctionality = async () => {
  try {
    console.log('🔍 Testing Shop Functionality...\n');

    // Test 1: Get all shops
    console.log('1. Testing GET /api/shops');
    const shopsResponse = await fetch(`${API_BASE_URL}/shops`);
    const shopsData = await shopsResponse.json();
    
    if (shopsResponse.ok) {
      console.log('✅ Shops fetched successfully');
      console.log(`📊 Found ${shopsData.data.shops.length} shops`);
      
      if (shopsData.data.shops.length > 0) {
        const firstShop = shopsData.data.shops[0];
        console.log(`🏪 First shop: ${firstShop.shopName} (${firstShop.address})`);
        
        // Test 2: Get shop details
        console.log('\n2. Testing GET /api/shops/:id/details');
        const shopDetailsResponse = await fetch(`${API_BASE_URL}/shops/${firstShop._id}/details`);
        const shopDetailsData = await shopDetailsResponse.json();
        
        if (shopDetailsResponse.ok) {
          console.log('✅ Shop details fetched successfully');
          console.log(`📊 Shop: ${shopDetailsData.data.shop.shopName}`);
          console.log(`📍 Address: ${shopDetailsData.data.shop.address}`);
          console.log(`📞 Contact: ${shopDetailsData.data.shop.contactInfo}`);
          console.log(`📦 Products: ${shopDetailsData.data.products.length}`);
          console.log(`📈 Stats: ${JSON.stringify(shopDetailsData.data.shop.stats)}`);
        } else {
          console.log('❌ Failed to fetch shop details:', shopDetailsData.message);
        }
        
        // Test 3: Get shop products
        console.log('\n3. Testing GET /api/products/shop/:shopId');
        const productsResponse = await fetch(`${API_BASE_URL}/products/shop/${firstShop._id}`);
        const productsData = await productsResponse.json();
        
        if (productsResponse.ok) {
          console.log('✅ Shop products fetched successfully');
          console.log(`📦 Found ${productsData.data.products.length} products`);
          
          if (productsData.data.products.length > 0) {
            const firstProduct = productsData.data.products[0];
            console.log(`🛍️ First product: ${firstProduct.productName} - ₹${firstProduct.price}`);
          }
        } else {
          console.log('❌ Failed to fetch shop products:', productsData.message);
        }
      } else {
        console.log('⚠️ No shops found in database');
      }
    } else {
      console.log('❌ Failed to fetch shops:', shopsData.message);
    }

    console.log('\n🎉 Shop functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Wait a bit for server to start, then test
setTimeout(testShopFunctionality, 3000);
