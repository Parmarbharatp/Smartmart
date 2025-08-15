import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Truck, CheckCircle, Clock, AlertTriangle, MapPin, Phone } from 'lucide-react';
import { Order, User, Product } from '../../types';

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (user && user.role === 'delivery_boy') {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const myOrders = allOrders.filter((order: Order) => order.deliveryBoyId === user.id);
      setAssignedOrders(myOrders.sort((a: Order, b: Order) => 
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      ));

      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setCustomers(allUsers.filter((u: User) => u.role === 'customer'));

      const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
      setProducts(allProducts);
    }
  }, [user]);

  const updateDeliveryStatus = (orderId: string, status: string, notes?: string) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = allOrders.map((order: Order) => {
      if (order.id === orderId) {
        return {
          ...order,
          deliveryStatus: status,
          deliveryNotes: notes || order.deliveryNotes,
          status: status === 'delivered' ? 'delivered' : order.status
        };
      }
      return order;
    });
    
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    const myOrders = updatedOrders.filter((order: Order) => order.deliveryBoyId === user!.id);
    setAssignedOrders(myOrders);
  };

  if (!user || user.role !== 'delivery_boy') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be a delivery boy to access this dashboard.</p>
        </div>
      </div>
    );
  }

  const activeOrders = assignedOrders.filter(order => 
    order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'failed'
  );
  const completedOrders = assignedOrders.filter(order => 
    order.deliveryStatus === 'delivered' || order.deliveryStatus === 'failed'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'picked_up':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedOrders.filter(order => 
                    new Date(order.orderDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{assignedOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Failed Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignedOrders.filter(order => order.deliveryStatus === 'failed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Active Deliveries ({activeOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Delivery History ({completedOrders.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'active' && (
              <div className="space-y-6">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active deliveries</h3>
                    <p className="text-gray-600">You don't have any deliveries assigned at the moment.</p>
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <DeliveryCard
                      key={order.id}
                      order={order}
                      customers={customers}
                      products={products}
                      onUpdateStatus={updateDeliveryStatus}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                {completedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery history</h3>
                    <p className="text-gray-600">Your completed deliveries will appear here.</p>
                  </div>
                ) : (
                  completedOrders.map((order) => (
                    <DeliveryCard
                      key={order.id}
                      order={order}
                      customers={customers}
                      products={products}
                      onUpdateStatus={updateDeliveryStatus}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      isHistory={true}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DeliveryCard: React.FC<{
  order: Order;
  customers: User[];
  products: Product[];
  onUpdateStatus: (orderId: string, status: string, notes?: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  isHistory?: boolean;
}> = ({ order, customers, products, onUpdateStatus, getStatusIcon, getStatusColor, isHistory = false }) => {
  const [notes, setNotes] = useState(order.deliveryNotes || '');
  const [showNotes, setShowNotes] = useState(false);

  const customer = customers.find(c => c.id === order.customerId);

  const handleStatusUpdate = (newStatus: string) => {
    onUpdateStatus(order.id, newStatus, notes);
    setShowNotes(false);
  };

  const getNextActions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'assigned':
        return [
          { status: 'picked_up', label: 'Mark as Picked Up', color: 'bg-blue-600 hover:bg-blue-700' }
        ];
      case 'picked_up':
        return [
          { status: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-600 hover:bg-purple-700' }
        ];
      case 'out_for_delivery':
        return [
          { status: 'delivered', label: 'Mark as Delivered', color: 'bg-green-600 hover:bg-green-700' },
          { status: 'failed', label: 'Mark as Failed', color: 'bg-red-600 hover:bg-red-700' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
          <p className="text-sm text-gray-600">
            Placed on {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(order.deliveryStatus || 'assigned')}`}>
          {getStatusIcon(order.deliveryStatus || 'assigned')}
          <span className="ml-2 capitalize">{(order.deliveryStatus || 'assigned').replace('_', ' ')}</span>
        </span>
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <span>{order.shippingAddress}</span>
          </div>
          {customer && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              <span>{customer.name} - {customer.phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
        <div className="space-y-2">
          {order.items.slice(0, 2).map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            return (
              <div key={index} className="flex items-center text-sm">
                <span className="text-gray-600">
                  {product?.productName} × {item.quantity}
                </span>
              </div>
            );
          })}
          {order.items.length > 2 && (
            <p className="text-sm text-gray-500">+{order.items.length - 2} more items</p>
          )}
        </div>
      </div>

      {/* Delivery Notes */}
      {(order.deliveryNotes || showNotes) && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Delivery Notes</h4>
          {showNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add delivery notes..."
            />
          ) : (
            <p className="text-sm text-gray-600">{order.deliveryNotes}</p>
          )}
        </div>
      )}

      {/* Actions */}
      {!isHistory && (
        <div className="flex flex-wrap gap-2">
          {getNextActions(order.deliveryStatus || 'assigned').map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status)}
              className={`px-4 py-2 text-white text-sm rounded-md transition-colors ${action.color}`}
            >
              {action.label}
            </button>
          ))}
          
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            {showNotes ? 'Cancel Notes' : 'Add Notes'}
          </button>
          
          {showNotes && (
            <button
              onClick={() => {
                onUpdateStatus(order.id, order.deliveryStatus || 'assigned', notes);
                setShowNotes(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Notes
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;