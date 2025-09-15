import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import { apiService } from '../../services/api';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, getCartTotal, validateCartItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cartProducts, setCartProducts] = React.useState<Array<{ productId: string; quantity: number; product: Product | null }>>([]);
  const [showErrorMessage, setShowErrorMessage] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      const productsCache: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      const results: Array<{ productId: string; quantity: number; product: Product | null }> = [];
      const missing: string[] = [];
      for (const item of items) {
        const p = productsCache.find((pp: Product) => pp.id === item.productId);
        if (p) {
          results.push({ productId: item.productId, quantity: item.quantity, product: p });
        } else {
          missing.push(item.productId);
        }
      }
      if (missing.length > 0) {
        const fetched: Product[] = [];
        await Promise.all(missing.map(async (id) => {
          try {
            const prod = await apiService.getProductById(id);
            if (prod) {
              const mapped: Product = {
                id: prod._id,
                shopId: String(prod.shopId),
                categoryId: String(prod.categoryId),
                productName: prod.productName,
                description: prod.description,
                price: prod.price,
                stockQuantity: prod.stockQuantity,
                imageUrls: prod.imageUrls ?? [],
                status: prod.status === 'out_of_stock' ? 'out_of_stock' : 'available',
                createdAt: prod.createdAt,
                updatedAt: prod.updatedAt,
              };
              fetched.push(mapped);
              results.push({ productId: id, quantity: items.find(i => i.productId === id)!.quantity, product: mapped });
            } else {
              results.push({ productId: id, quantity: items.find(i => i.productId === id)!.quantity, product: null });
            }
          } catch {
            results.push({ productId: id, quantity: items.find(i => i.productId === id)!.quantity, product: null });
          }
        }));
        if (fetched.length > 0) {
          localStorage.setItem('products', JSON.stringify([...productsCache, ...fetched]));
        }
      }
      setCartProducts(results);
    };
    load();
  }, [items]);

  // Separate useEffect for cart validation (only run once on mount)
  React.useEffect(() => {
    const validateCart = async () => {
      try {
        await validateCartItems();
      } catch (error) {
        console.error('Error validating cart:', error);
      }
    };
    validateCart();
  }, []); // Empty dependency array - only run once on mount

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    navigate('/payment');
  };

  if (!user || user.role !== 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in as a customer to view your cart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">Review your items before checkout</p>
        </div>

        {/* Error Notification */}
        {showErrorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {cartProducts.map((item) => (
                    <div key={item.productId} className="p-6 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {item.product ? (
                          <img
                            src={item.product.imageUrls[0]}
                            alt={item.product.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.product ? item.product.productName : 'Loading...'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.product ? `$${item.product.price.toFixed(2)} each` : ''}
                        </p>
                        {item.product && item.quantity > item.product.stockQuantity && (
                          <p className="text-sm text-red-600 mt-1 font-medium">
                            ⚠️ Only {item.product.stockQuantity} available in stock
                          </p>
                        )}
                        {item.product && item.product.status === 'out_of_stock' && (
                          <p className="text-sm text-red-600 mt-1 font-medium">
                            ❌ Out of stock
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              await updateQuantity(item.productId, item.quantity - 1);
                            } catch (error) {
                              setErrorMessage(error instanceof Error ? error.message : 'Failed to update quantity');
                              setShowErrorMessage(true);
                              setTimeout(() => setShowErrorMessage(false), 3000);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await updateQuantity(item.productId, item.quantity + 1);
                            } catch (error) {
                              setErrorMessage(error instanceof Error ? error.message : 'Failed to update quantity');
                              setShowErrorMessage(true);
                              setTimeout(() => setShowErrorMessage(false), 3000);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.product ? `$${(item.product.price * item.quantity).toFixed(2)}` : '--'}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">$0.00</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-base font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Proceed to Checkout
                </button>
                
                <button
                  onClick={() => navigate('/products')}
                  className="w-full mt-3 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;