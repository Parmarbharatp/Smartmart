// Comprehensive test for product and cart functionality
export const testProductCartFlow = async () => {
  console.log('🧪 Testing Complete Product & Cart Flow...');
  
  // Test 1: Check localStorage products
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  console.log('📦 Products in localStorage:', products.length);
  
  if (products.length === 0) {
    console.warn('⚠️ No products in localStorage - this will cause cart issues');
    return { success: false, issue: 'No products in localStorage' };
  }
  
  // Test 2: Check product data structure
  const sampleProduct = products[0];
  const requiredFields = ['id', 'productName', 'price', 'stockQuantity', 'status'];
  const missingFields = requiredFields.filter(field => !(field in sampleProduct));
  
  if (missingFields.length > 0) {
    console.error('❌ Product missing required fields:', missingFields);
    return { success: false, issue: `Missing fields: ${missingFields.join(', ')}` };
  }
  
  console.log('✅ Product data structure is correct');
  
  // Test 3: Check cart functionality
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  console.log('🛒 Cart items:', cartItems.length);
  
  // Test 4: Check for duplicate product IDs
  const productIds = products.map((p: any) => p.id);
  const uniqueIds = [...new Set(productIds)];
  
  if (productIds.length !== uniqueIds.length) {
    console.warn('⚠️ Duplicate product IDs found!');
    return { success: false, issue: 'Duplicate product IDs' };
  }
  
  console.log('✅ All product IDs are unique');
  
  // Test 5: Check stock quantities
  const outOfStockProducts = products.filter((p: any) => p.stockQuantity <= 0);
  const lowStockProducts = products.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= 5);
  
  console.log('📊 Stock status:', {
    totalProducts: products.length,
    outOfStock: outOfStockProducts.length,
    lowStock: lowStockProducts.length,
    inStock: products.length - outOfStockProducts.length - lowStockProducts.length
  });
  
  // Test 6: Check product status consistency
  const statusMismatch = products.filter((p: any) => {
    if (p.stockQuantity <= 0 && p.status !== 'out_of_stock') return true;
    if (p.stockQuantity > 0 && p.status === 'out_of_stock') return true;
    return false;
  });
  
  if (statusMismatch.length > 0) {
    console.warn('⚠️ Product status mismatch with stock quantity:', statusMismatch.length);
  } else {
    console.log('✅ Product status is consistent with stock quantity');
  }
  
  return {
    success: true,
    stats: {
      productsCount: products.length,
      cartItemsCount: cartItems.length,
      uniqueIds: productIds.length === uniqueIds.length,
      outOfStock: outOfStockProducts.length,
      lowStock: lowStockProducts.length,
      statusMismatch: statusMismatch.length
    }
  };
};

// Function to simulate adding products to cart
export const simulateCartOperations = async (addToCart: (productId: string, quantity: number) => Promise<void>) => {
  console.log('🧪 Simulating Cart Operations...');
  
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  if (products.length === 0) {
    console.error('❌ No products available for testing');
    return;
  }
  
  const testProduct = products[0];
  console.log('📦 Testing with product:', testProduct.productName);
  
  try {
    // Test 1: Add product within stock limit
    console.log('🧪 Test 1: Adding product within stock limit');
    await addToCart(testProduct.id, 1);
    console.log('✅ Successfully added 1 item');
    
    // Test 2: Try to add more than available stock
    console.log('🧪 Test 2: Trying to add more than available stock');
    try {
      await addToCart(testProduct.id, testProduct.stockQuantity + 1);
      console.log('❌ ERROR: Should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Correctly prevented adding more than available stock');
    }
    
    // Test 3: Add different product
    if (products.length > 1) {
      console.log('🧪 Test 3: Adding different product');
      const secondProduct = products[1];
      await addToCart(secondProduct.id, 1);
      console.log('✅ Successfully added different product');
    }
    
  } catch (error) {
    console.error('❌ Cart operation failed:', error);
  }
};

// Function to check if cart operations will work
export const checkCartReadiness = () => {
  console.log('🔍 Checking Cart Readiness...');
  
  const issues: string[] = [];
  
  // Check localStorage products
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  if (products.length === 0) {
    issues.push('No products in localStorage');
  }
  
  // Check if user is logged in as customer
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || user.role !== 'customer') {
    issues.push('User not logged in as customer');
  }
  
  // Check cart context
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (!Array.isArray(cart)) {
    issues.push('Cart data is corrupted');
  }
  
  if (issues.length === 0) {
    console.log('✅ Cart is ready for operations');
    return { ready: true, issues: [] };
  } else {
    console.log('❌ Cart has issues:', issues);
    return { ready: false, issues };
  }
};
