import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Building, CheckCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import { apiService } from '../../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentPage: React.FC = () => {
  const { items, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const RAZORPAY_KEY = (import.meta as any).env?.VITE_RAZORPAY_KEY || 'rzp_test_1234567890';
  const [showMockCheckout, setShowMockCheckout] = useState(false);
  const [mockTab, setMockTab] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const cartProducts = items.map(item => ({
    ...item,
    product: products.find((p: Product) => p.id === item.productId)
  })).filter(item => item.product);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validatePayment = () => {
    // Check if cart is empty
    if (!items || items.length === 0) {
      alert('Your cart is empty. Please add items before proceeding to payment.');
      return false;
    }

    // Check if we have valid cart products
    if (cartProducts.length === 0) {
      alert('Some items in your cart are no longer available. Please refresh and try again.');
      return false;
    }

    // Check if we have a valid shop ID
    const shopId = cartProducts[0]?.product?.shopId;
    if (!shopId) {
      alert('Unable to determine the shop for this order. Please try again.');
      return false;
    }

    return true;
  };

  const handleRazorpayPayment = () => {
    if (!validatePayment()) {
      return;
    }
    
    setIsProcessing(true);
    // Always use mock checkout in this build (no external keys needed)
    setShowMockCheckout(true);
    setIsProcessing(false);
  };

  const handleCODPayment = async () => {
    if (!validatePayment()) {
      return;
    }
    
    setIsProcessing(true);
    try {
      // For COD, we don't need to wait for external payment processing
      // Just create the order directly
      await handlePaymentSuccess('COD_' + Date.now());
    } catch (error) {
      console.error('COD payment failed:', error);
      alert('Failed to place COD order. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Resolve a valid shopId from first cart item via fresh product fetch
      if (!items || items.length === 0) {
        throw new Error('Cart is empty');
      }
      const firstProductId = items[0].productId;
      const freshProduct = await apiService.getProductById(firstProductId);
      const resolvedShopId = freshProduct?.shopId?._id || freshProduct?.shopId || '';
      const shopId = typeof resolvedShopId === 'string' ? resolvedShopId : String(resolvedShopId || '');
      
      if (!shopId) {
        throw new Error('No shop found for this order. Please refresh and try again.');
      }

      // Validate all items are still available and normalize productIds to Mongo ObjectIds
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const mongoIdRegex = /^[a-f\d]{24}$/i;
      const normalizedItems: Array<{ productId: string; quantity: number }> = [];
      for (const item of items) {
        const product = products.find((p: any) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} is no longer available. Please refresh your cart.`);
        }
        if (product.status !== 'available') {
          throw new Error(`Product "${product.productName}" is currently unavailable.`);
        }
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Only ${product.stockQuantity} items available for "${product.productName}". Please update your cart.`);
        }

        // Ensure productId is a valid Mongo ObjectId string
        const candidateId = product.id || item.productId;
        if (!mongoIdRegex.test(candidateId)) {
          throw new Error(`Invalid product reference for "${product.productName}". Please remove and re-add the item.`);
        }
        normalizedItems.push({ productId: candidateId, quantity: item.quantity });
      }
      
      const order = await apiService.createOrder({
        shopId,
        shippingAddress: user?.address || '',
        items: normalizedItems,
        paymentMethod: paymentMethod === 'cod' ? 'cash_on_delivery' : 'credit_card',
        notes: `paymentId=${paymentId}`,
      });

      if (!order) {
        throw new Error('Order creation failed. Please try again.');
      }

      clearCart();
      setOrderId(order._id || '');
      setOrderPlaced(true);
    } catch (e: any) {
      console.error('Create order failed', e);
      const apiErrors = e?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        const first = apiErrors[0];
        alert(`❌ ${e?.response?.data?.message || 'Validation failed'}: ${first?.msg || first?.message || first}`);
      } else {
        const errorMessage = e?.response?.data?.message || e?.message || 'Order creation failed. Please try again.';
        alert(`❌ ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user || user.role !== 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in as a customer to make a payment.</p>
        </div>
      </div>
    );
  }

  // Show order success screen if an order was just placed
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Your order #{orderId} has been confirmed and will be processed soon.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/products')}
              className="w-full bg-gray-600 text-white py-3 rounded-md hover:bg-gray-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if cart is empty (only when no order has been placed)
  if ((!items || items.length === 0) && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Empty Cart</h1>
          <p className="text-gray-600 mb-4">Your cart is empty. Please add items before proceeding to payment.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cartProducts.map((item) => (
                  <div key={item.productId} className="flex items-center space-x-4">
                    <img
                      src={item.product.imageUrls[0]}
                      alt={item.product.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.productName}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-4">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'razorpay')}
                    className="mr-4"
                  />
                  <Wallet className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Razorpay</p>
                    <p className="text-sm text-gray-600">Pay securely with cards, UPI, wallets</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                    className="mr-4"
                  />
                  <Building className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive your order</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              
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
                onClick={paymentMethod === 'razorpay' ? handleRazorpayPayment : handleCODPayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay ${paymentMethod === 'razorpay' ? 'with Razorpay' : 'on Delivery'}`
                )}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Razorpay-like Checkout Modal */}
      {showMockCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="SmartMart" className="h-6 w-6" />
                <span className="font-semibold">SmartMart Payments</span>
              </div>
              <button onClick={() => { setShowMockCheckout(false); setIsProcessing(false); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex space-x-2 mb-4">
                {(['upi','card','wallet'] as const).map(t => (
                  <button key={t} onClick={() => setMockTab(t)} className={`px-3 py-2 rounded-lg text-sm font-medium ${mockTab===t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{t.toUpperCase()}</button>
                ))}
              </div>

              {mockTab === 'upi' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">UPI ID</label>
                  <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="example@upi" className="w-full px-3 py-2 border rounded-md" />
                </div>
              )}

              {mockTab === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
                    <input value={cardName} onChange={e=>setCardName(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Card Number</label>
                    <input value={cardNumber} onChange={e=>setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
                      <input value={cardExpiry} onChange={e=>setCardExpiry(e.target.value)} placeholder="12/28" className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div className="w-28">
                      <label className="block text-sm font-medium text-gray-700">CVV</label>
                      <input value={cardCvv} onChange={e=>setCardCvv(e.target.value)} placeholder="123" className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                </div>
              )}

              {mockTab === 'wallet' && (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>Select a wallet:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Paytm','PhonePe','Amazon Pay','Mobikwik'].map(w => (
                      <button key={w} className={`px-3 py-2 rounded-lg border ${'bg-gray-50 hover:bg-gray-100'}`}>{w}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold">₹{(getCartTotal()*83.0).toFixed(0)} / ${getCartTotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setIsProcessing(true); setTimeout(()=>{ setShowMockCheckout(false); handlePaymentSuccess('MOCK_'+Date.now()); }, 800); }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Pay Now
                </button>
                <p className="text-[11px] text-gray-500 text-center">This is a mock checkout for development only.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;