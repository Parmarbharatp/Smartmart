import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Order, Product } from '../../types';
import { apiService } from '../../services/api';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const { orders: apiOrders } = await apiService.getMyOrders({ limit: 100 });
        // Map backend orders into frontend type shape
        const mappedOrders: Order[] = apiOrders.map((o: any) => ({
          id: o._id,
          customerId: String(o.customerId),
          shopId: String(o.shopId),
          orderDate: o.createdAt,
          totalAmount: o.totalAmount,
          status: o.status,
          shippingAddress: o.shippingAddress,
          paymentStatus: o.paymentStatus || 'paid',
          items: o.items.map((it: any) => ({ productId: String(it.productId), quantity: it.quantity, priceAtPurchase: it.priceAtPurchase })),
        }));
        setOrders(mappedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));

        // Build a product cache for display
        const uniqueProductIds = Array.from(new Set(mappedOrders.flatMap(o => o.items.map(i => i.productId))));
        const existing: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
        const missing = uniqueProductIds.filter(id => !existing.some(p => p.id === id));
        const fetched: Product[] = [];
        for (const id of missing) {
          try {
            const prod = await apiService.getProductById(id);
            if (prod) {
              fetched.push({
                id: prod._id,
                shopId: String(prod.shopId),
                categoryId: String(prod.categoryId),
                productName: prod.productName,
                description: prod.description,
                price: prod.price,
                stockQuantity: prod.stockQuantity,
                imageUrls: prod.imageUrls ?? [],
                status: prod.status,
                createdAt: prod.createdAt,
                updatedAt: prod.updatedAt,
              });
            }
          } catch {}
        }
        const productCache = [...existing, ...fetched];
        if (fetched.length > 0) localStorage.setItem('products', JSON.stringify(productCache));
        setProducts(productCache);
      } catch (e) {
        console.error('Failed to load orders from API', e);
      }
    })();
  }, [user]);

  if (!user || user.role !== 'customer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in as a customer to view your orders.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => window.location.href = '/products'}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} products={products} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderCard: React.FC<{ order: Order; products: Product[] }> = ({ order, products }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
            <p className="text-sm text-gray-600">
              Placed on {new Date(order.orderDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-2 capitalize">{order.status}</span>
            </span>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">
                Payment: <span className="capitalize">{order.paymentStatus}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Shipping Address:</span> {order.shippingAddress}
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Payment Method:</span> {(order as any).paymentMethod || 'Card'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Order Items</h4>
        <div className="space-y-4">
          {order.items.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            return (
              <div key={index} className="flex items-center space-x-4">
                {product && (
                  <>
                    <img
                      src={product.imageUrls[0]}
                      alt={product.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{product.productName}</h5>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} × ${item.priceAtPurchase.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(item.quantity * item.priceAtPurchase).toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Order Status Timeline */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="font-medium text-gray-900 mb-4">Order Status</h5>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${order.status === 'pending' || order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? 'text-blue-600' : 'text-gray-400'}`}>
              <CheckCircle className="h-5 w-5" />
              <span className="ml-2 text-sm">Confirmed</span>
            </div>
            <div className={`w-8 h-0.5 ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${order.status === 'shipped' || order.status === 'delivered' ? 'text-blue-600' : 'text-gray-400'}`}>
              <Truck className="h-5 w-5" />
              <span className="ml-2 text-sm">Shipped</span>
            </div>
            <div className={`w-8 h-0.5 ${order.status === 'delivered' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="h-5 w-5" />
              <span className="ml-2 text-sm">Delivered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;