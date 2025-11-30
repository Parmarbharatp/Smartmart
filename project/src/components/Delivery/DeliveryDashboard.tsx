import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Truck, CheckCircle, Clock, AlertTriangle, MapPin, Phone, Eye, CheckCircle2, XCircle, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { apiService } from '../../services/api';

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history' | 'wallet'>('available');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    if (user && user.role === 'delivery_boy') {
      loadOrders();
      loadWallet();
    }
  }, [user]);

  useEffect(() => {
    // Reload wallet when tab changes to wallet or when orders are updated
    if (activeTab === 'wallet' || assignedOrders.length > 0) {
      loadWallet();
    }
  }, [activeTab, assignedOrders.length]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      // First, let's check all orders for debugging
      console.log('🔍 Debug: Checking all orders in database...');
      try {
        const allOrders = await apiService.getAllOrdersDebug();
        console.log('📊 All orders in database:', allOrders.length);
        allOrders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order._id,
            status: order.status,
            deliveryBoyId: order.deliveryBoyId,
            deliveryStatus: order.deliveryStatus,
            createdAt: order.createdAt
          });
        });
      } catch (debugError) {
        console.log('⚠️ Could not fetch debug orders:', debugError);
      }

      const [availRes, assignedRes] = await Promise.allSettled([
        apiService.getAvailableOrders(),
        apiService.getMyOrders()
      ]);
      
      console.log('Available orders response:', availRes);
      console.log('Assigned orders response:', assignedRes);
      
      if (availRes.status === 'fulfilled') {
        setAvailableOrders(availRes.value.orders || []);
        console.log('Available orders count:', availRes.value.orders?.length || 0);
        if (availRes.value.orders?.length > 0) {
          console.log('First available order:', availRes.value.orders[0]);
        }
      } else {
        console.error('Failed to load available orders:', availRes.reason);
        setAvailableOrders([]);
      }
      if (assignedRes.status === 'fulfilled') {
        setAssignedOrders(assignedRes.value.orders || []);
        console.log('Assigned orders count:', assignedRes.value.orders?.length || 0);
      } else {
        console.error('Failed to load assigned orders:', assignedRes.reason);
        setAssignedOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await apiService.acceptDelivery(orderId);
      await loadOrders(); // Reload orders
    } catch (err: any) {
      setError(err.message || 'Failed to accept order');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      setLoading(true);
      await apiService.updateDeliveryStatus(orderId, status, notes);
      await loadOrders(); // Reload orders
      // Reload wallet if delivery was successful (money will be credited)
      if (status === 'delivered') {
        setTimeout(() => {
          loadWallet(); // Small delay to allow backend to process revenue split
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update delivery status');
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    setWalletLoading(true);
    try {
      const [balanceData, transactionsData, payoutsData] = await Promise.all([
        apiService.getWalletBalance(),
        apiService.getWalletTransactions({ limit: 20 }),
        apiService.getMyPayouts({ limit: 20 })
      ]);
      setWalletBalance(balanceData);
      setTransactions(transactionsData.transactions || []);
      setPayouts(payoutsData.payouts || []);
    } catch (err: any) {
      console.error('Error loading wallet:', err);
      setError(err.message || 'Failed to load wallet information');
    } finally {
      setWalletLoading(false);
    }
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
    order.deliveryStatus && order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'failed'
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-white" />
              <div className="ml-4">
                <p className="text-sm text-green-100">Wallet Balance</p>
                <p className="text-2xl font-bold text-white">
                  ₹{walletBalance?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Available Orders</p>
                <p className="text-2xl font-bold text-gray-900">{availableOrders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-yellow-600" />
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
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Available Orders ({availableOrders.length})
              </button>
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
              <button
                onClick={() => {
                  setActiveTab('wallet');
                  loadWallet();
                }}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'wallet'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Wallet className="h-4 w-4 inline mr-2" />
                My Wallet
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading orders...</p>
              </div>
            )}

            {!loading && activeTab === 'available' && (
              <div className="space-y-6">
                {availableOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No available orders</h3>
                    <p className="text-gray-600">There are no orders available for delivery at the moment.</p>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <AvailableOrderCard
                      key={order._id}
                      order={order}
                      onAccept={acceptOrder}
                    />
                  ))
                )}
              </div>
            )}

            {!loading && activeTab === 'active' && (
              <div className="space-y-6">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active deliveries</h3>
                    <p className="text-gray-600">You don't have any active deliveries at the moment.</p>
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <DeliveryCard
                      key={order._id}
                      order={order}
                      onUpdateStatus={updateDeliveryStatus}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </div>
            )}

            {!loading && activeTab === 'history' && (
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
                      key={order._id}
                      order={order}
                      onUpdateStatus={updateDeliveryStatus}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                      isHistory={true}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <WalletView
                walletBalance={walletBalance}
                transactions={transactions}
                payouts={payouts}
                loading={walletLoading}
                onRefresh={loadWallet}
                onRequestPayout={() => {
                  console.log('Opening payout modal, balance:', walletBalance);
                  if (!walletBalance?.balance || walletBalance.balance < 100) {
                    alert(`You need at least ₹100 in your wallet to request a payout. Current balance: ₹${walletBalance?.balance?.toFixed(2) || '0.00'}`);
                    return;
                  }
                  setShowPayoutModal(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <PayoutRequestModal
          walletBalance={walletBalance}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => {
            setShowPayoutModal(false);
            loadWallet();
          }}
        />
      )}
    </div>
  );
};

// Payout Request Modal Component
const PayoutRequestModal: React.FC<{
  walletBalance: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ walletBalance, onClose, onSuccess }) => {
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Submitting payout request:', { amount, payoutMethod, walletBalance });
      const payoutAmount = parseFloat(amount);
      
      if (!payoutAmount || payoutAmount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (payoutAmount < 100) {
        setError('Minimum payout amount is ₹100');
        setLoading(false);
        return;
      }

      if (walletBalance?.balance < payoutAmount) {
        setError('Insufficient wallet balance');
        setLoading(false);
        return;
      }

      const payload: any = {
        amount: payoutAmount,
        payoutMethod: payoutMethod
      };

      if (payoutMethod === 'upi') {
        if (!upiId) {
          setError('Please enter UPI ID');
          setLoading(false);
          return;
        }
        payload.upiId = upiId;
      } else {
        if (!bankAccountNumber || !bankAccountName || !bankIFSC || !bankName) {
          setError('Please fill all bank details');
          setLoading(false);
          return;
        }
        payload.bankAccountNumber = bankAccountNumber;
        payload.bankAccountName = bankAccountName;
        payload.bankIFSC = bankIFSC;
        payload.bankName = bankName;
      }

      const response = await apiService.requestPayout(payload);
      console.log('Payout request response:', response);
      alert('Payout request submitted successfully! Admin will process it soon.');
      onSuccess();
    } catch (err: any) {
      console.error('Payout request error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to request payout';
      setError(errorMessage);
      // Show more detailed error if available
      if (err?.response?.data?.availableBalance !== undefined) {
        setError(`${errorMessage}. Available balance: ₹${err.response.data.availableBalance.toFixed(2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Request Payout</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max={walletBalance?.balance || 0}
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter amount (min ₹100)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available balance: ₹{walletBalance?.balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Payout Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payout Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutMethod('upi')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  payoutMethod === 'upi'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                UPI
              </button>
              <button
                type="button"
                onClick={() => setPayoutMethod('bank_transfer')}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  payoutMethod === 'bank_transfer'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          {/* UPI Details */}
          {payoutMethod === 'upi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="yourname@upi"
              />
            </div>
          )}

          {/* Bank Details */}
          {payoutMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={bankIFSC}
                  onChange={(e) => setBankIFSC(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="ABCD0123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter bank name"
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Request Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Available Order Card Component
const AvailableOrderCard: React.FC<{
  order: any;
  onAccept: (orderId: string) => void;
}> = ({ order, onAccept }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
          <p className="text-sm text-gray-600">
            Placed on {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Available
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
          {order.customerId && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              <span>{order.customerId.name} - {order.customerId.phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shop Info */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Shop Details</h4>
        <div className="text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <span>{order.shopId?.shopName} - {order.shopId?.address}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
        <div className="space-y-2">
          {order.items.slice(0, 3).map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {item.productId?.productName} × {item.quantity}
              </span>
              <span className="font-medium">₹{item.priceAtPurchase * item.quantity}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-sm text-gray-500">+{order.items.length - 3} more items</p>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Total Amount:</span>
            <span className="font-bold text-lg text-gray-900">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Accept Button */}
      <button
        onClick={() => onAccept(order._id)}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
      >
        <CheckCircle2 className="h-5 w-5 mr-2" />
        Accept Delivery
      </button>
    </div>
  );
};

// Delivery Card Component
const DeliveryCard: React.FC<{
  order: any;
  onUpdateStatus: (orderId: string, status: string, notes?: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  isHistory?: boolean;
}> = ({ order, onUpdateStatus, getStatusIcon, getStatusColor, isHistory = false }) => {
  const [notes, setNotes] = useState(order.deliveryNotes || '');
  const [showNotes, setShowNotes] = useState(false);

  const handleStatusUpdate = (newStatus: string) => {
    onUpdateStatus(order._id, newStatus, notes);
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
          <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
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
          {order.customerId && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              <span>{order.customerId.name} - {order.customerId.phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shop Info */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Shop Details</h4>
        <div className="text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <span>{order.shopId?.shopName} - {order.shopId?.address}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
        <div className="space-y-2">
          {order.items.slice(0, 3).map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {item.productId?.productName} × {item.quantity}
              </span>
              <span className="font-medium">₹{item.priceAtPurchase * item.quantity}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-sm text-gray-500">+{order.items.length - 3} more items</p>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Total Amount:</span>
            <span className="font-bold text-lg text-gray-900">₹{order.totalAmount}</span>
          </div>
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
                onUpdateStatus(order._id, order.deliveryStatus || 'assigned', notes);
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

// Wallet View Component
const WalletView: React.FC<{
  walletBalance: any;
  transactions: any[];
  payouts: any[];
  loading: boolean;
  onRefresh: () => void;
  onRequestPayout: () => void;
}> = ({ walletBalance, transactions, payouts, loading, onRefresh, onRequestPayout }) => {
  const getTransactionIcon = (type: string, revenueType?: string) => {
    if (type === 'credit' || revenueType === 'delivery_boy') {
      return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
    }
    return <ArrowUpCircle className="h-5 w-5 text-red-600" />;
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
            <p className="text-green-100 text-sm">Your available earnings</p>
          </div>
          <Wallet className="h-12 w-12 text-white opacity-80" />
        </div>
        <div className="text-5xl font-bold mb-2">
          ₹{walletBalance?.balance?.toFixed(2) || '0.00'}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-green-400/30">
          <div>
            <p className="text-green-100 text-sm">Total Earnings</p>
            <p className="text-xl font-semibold">₹{walletBalance?.totalEarnings?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Pending</p>
            <p className="text-xl font-semibold">₹{walletBalance?.pendingBalance?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Withdrawn</p>
            <p className="text-xl font-semibold">₹{walletBalance?.totalWithdrawn?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <div className="flex space-x-3 mt-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Balance'}
          </button>
          <button
            onClick={() => {
              console.log('Request payout clicked');
              console.log('Wallet balance:', walletBalance);
              if (!walletBalance?.balance || walletBalance.balance < 100) {
                alert(`Minimum ₹100 required for payout. Your current balance is ₹${walletBalance?.balance?.toFixed(2) || '0.00'}`);
                return;
              }
              onRequestPayout();
            }}
            disabled={loading}
            className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Payout
            {walletBalance?.balance && walletBalance.balance < 100 && (
              <span className="block text-xs mt-1 text-green-200">(Min ₹100)</span>
            )}
          </button>
        </div>
        {walletBalance?.balance < 100 && (
          <p className="text-xs text-green-100 mt-2">
            Minimum ₹100 required for payout
          </p>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600">Your earnings from deliveries will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-2 rounded-full ${
                      transaction.transactionType === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {getTransactionIcon(transaction.transactionType, transaction.revenueType)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {transaction.description || 
                         (transaction.transactionType === 'credit' ? 'Credit' : 'Debit')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                        {transaction.revenueType === 'delivery_boy' && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            Delivery Fee
                          </span>
                        )}
                        {transaction.orderId && (
                          <span className="ml-2 text-gray-400">
                            • Order #{transaction.order?.orderNumber || 'N/A'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${getTransactionColor(transaction.transactionType)}`}>
                      {transaction.transactionType === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: ₹{transaction.balanceAfter?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
            <Wallet className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading payouts...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payout requests</h3>
            <p className="text-gray-600">Your payout requests will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payouts.map((payout) => (
              <div key={payout._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        Payout #{payout.payoutId}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payout.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Amount: <span className="font-semibold text-gray-900">₹{payout.amount.toFixed(2)}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Method: {payout.payoutMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                      {payout.payoutMethod === 'upi' && payout.upiId && (
                        <span className="ml-2">({payout.upiId})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Requested: {formatDate(payout.requestDate)}
                      {payout.processedDate && (
                        <span className="ml-2">
                          • Processed: {formatDate(payout.processedDate)}
                        </span>
                      )}
                    </p>
                    {payout.transactionReference && (
                      <p className="text-xs text-green-600 mt-1">
                        Transaction ID: {payout.transactionReference}
                      </p>
                    )}
                    {payout.failureReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {payout.failureReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{payout.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;