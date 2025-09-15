import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { testCartFunctionality, addTestProducts } from '../../utils/cartTest';

const CartTest: React.FC = () => {
  const { items, addToCart, clearCart } = useCart();
  const [testResults, setTestResults] = useState<any>(null);

  const runTest = () => {
    const results = testCartFunctionality();
    setTestResults(results);
  };

  const addTestData = () => {
    addTestProducts();
    runTest();
  };

  const testAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      console.log('✅ Successfully added to cart');
    } catch (error) {
      console.error('❌ Failed to add to cart:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cart Functionality Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            <button
              onClick={addTestData}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Test Products
            </button>
            
            <button
              onClick={runTest}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Run Test
            </button>
            
            <button
              onClick={clearCart}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          
          {testResults ? (
            <div className="space-y-2">
              <p><strong>Products Count:</strong> {testResults.productsCount}</p>
              <p><strong>Cart Items Count:</strong> {testResults.cartItemsCount}</p>
              <p><strong>Unique IDs:</strong> {testResults.hasUniqueIds ? '✅' : '❌'}</p>
            </div>
          ) : (
            <p className="text-gray-500">Run test to see results</p>
          )}
        </div>
      </div>

      {/* Current Cart Items */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Current Cart Items</h2>
        
        {items.length === 0 ? (
          <p className="text-gray-500">Cart is empty</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Product ID: {item.productId}</span>
                <span>Quantity: {item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Add to Cart */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Test Add to Cart</h2>
        
        <div className="space-y-2">
          <button
            onClick={() => testAddToCart('test-product-1')}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Add Test Product 1
          </button>
          
          <button
            onClick={() => testAddToCart('test-product-2')}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Add Test Product 2
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartTest;
