import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Building, CheckCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';

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

  const handleRazorpayPayment = () => {
    setIsProcessing(true);

    const options = {
      key: 'rzp_test_1234567890', // Demo key
      amount: Math.round(getCartTotal() * 100), // Amount in paise
      currency: 'INR',
              name: 'SmartMart',
        description: 'Purchase from SmartMart',
      image: '/logo.png',
      handler: function (response: any) {
        // Payment successful
        handlePaymentSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: user?.phoneNumber || ''
      },
      theme: {
        color: '#2563eb'
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleCODPayment = () => {
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => {
      handlePaymentSuccess('COD_' + Date.now());
    }, 2000);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    // Create order
    const newOrderId = Date.now().toString();
    const order = {
      id: newOrderId,
      customerId: user!.id,
      shopId: cartProducts[0]?.product.shopId || '', // Simplified for demo
      orderDate: new Date().toISOString(),
      totalAmount: getCartTotal(),
      status: 'confirmed',
      shippingAddress: user!.address || '',
      paymentStatus: 'paid',
      paymentId: paymentId,
      paymentMethod: paymentMethod,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: cartProducts.find(cp => cp.productId === item.productId)?.product.price || 0
      }))
    };

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Update product stock
    const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = allProducts.map((product: Product) => {
      const cartItem = items.find(item => item.productId === product.id);
      if (cartItem) {
        return {
          ...product,
          stockQuantity: Math.max(0, product.stockQuantity - cartItem.quantity)
        };
      }
      return product;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    clearCart();
    setOrderId(newOrderId);
    setOrderPlaced(true);
    setIsProcessing(false);
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

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Items to Pay</h1>
          <p className="text-gray-600 mb-6">Your cart is empty.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

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
    </div>
  );
};

export default PaymentPage;