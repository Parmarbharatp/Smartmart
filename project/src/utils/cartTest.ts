// Simple test to verify cart functionality
export const testCartFunctionality = () => {
  console.log('🧪 Testing Cart Functionality...');
  
  // Test 1: Check localStorage products
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  console.log('📦 Products in localStorage:', products.length);
  
  if (products.length > 0) {
    console.log('📋 Sample product:', {
      id: products[0].id,
      name: products[0].productName,
      stock: products[0].stockQuantity,
      status: products[0].status
    });
  }
  
  // Test 2: Check cart items
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  console.log('🛒 Cart items:', cartItems.length);
  
  if (cartItems.length > 0) {
    console.log('📋 Sample cart item:', cartItems[0]);
  }
  
  // Test 3: Check for duplicate product IDs
  const productIds = products.map((p: any) => p.id);
  const uniqueIds = [...new Set(productIds)];
  
  if (productIds.length !== uniqueIds.length) {
    console.warn('⚠️ Duplicate product IDs found!');
  } else {
    console.log('✅ All product IDs are unique');
  }
  
  return {
    productsCount: products.length,
    cartItemsCount: cartItems.length,
    hasUniqueIds: productIds.length === uniqueIds.length
  };
};

// Function to add test products to localStorage
export const addTestProducts = () => {
  const testProducts = [
    {
      id: 'test-product-1',
      shopId: 'test-shop-1',
      categoryId: 'test-category-1',
      productName: 'Test Product 1',
      description: 'A test product',
      price: 10.99,
      stockQuantity: 5,
      imageUrls: ['https://via.placeholder.com/300'],
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'test-product-2',
      shopId: 'test-shop-1',
      categoryId: 'test-category-1',
      productName: 'Test Product 2',
      description: 'Another test product',
      price: 15.99,
      stockQuantity: 3,
      imageUrls: ['https://via.placeholder.com/300'],
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  localStorage.setItem('products', JSON.stringify(testProducts));
  console.log('✅ Added test products to localStorage');
};
