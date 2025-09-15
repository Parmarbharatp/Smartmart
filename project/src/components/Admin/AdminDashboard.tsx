import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Store, Package, ShoppingBag, CheckCircle, XCircle, Truck, Edit2, Trash2, UserPlus } from 'lucide-react';
import { User, Shop, Product, Order, Category } from '../../types';
import { apiService } from '../../services/api';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'shops' | 'products' | 'categories' | 'orders' | 'delivery'>('overview');

  // Helper to reload categories from DB
  const reloadCategories = async () => {
    try {
      const categoriesApi = await apiService.getCategories();
      const mappedCategories: Category[] = categoriesApi.map((c: any) => ({
        id: c._id,
        name: c.name,
        description: c.description,
        isBuiltIn: !!c.isBuiltIn,
        createdAt: c.createdAt,
      }));
      setCategories(mappedCategories);
    } catch (e) {
      console.error('Failed to reload categories', e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [shopsApi, productsApi, categoriesApi, usersApi] = await Promise.all([
          apiService.getShops({ limit: 500 }),
          apiService.getProducts({ limit: 1000 }),
          apiService.getCategories(),
          apiService.adminListUsers({ limit: 1000 }),
        ]);

        const mappedUsers: User[] = usersApi.map((u: any) => ({
          id: u._id,
          email: u.email,
          name: u.name,
          role: u.role,
          phoneNumber: u.phoneNumber,
          address: u.address,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }));
        setUsers(mappedUsers);
        setDeliveryBoys(mappedUsers.filter(u => u.role === 'delivery_boy'));

        const mappedShops: Shop[] = shopsApi.map((s: any) => ({
          id: s._id,
          ownerId: String(s.ownerId),
          shopName: s.shopName,
          description: s.description,
          address: s.address,
          contactInfo: s.contactInfo,
          status: s.status,
          imageUrl: s.imageUrl,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
        setShops(mappedShops);

        const mappedProducts: Product[] = productsApi.map((p: any) => ({
          id: p._id,
          shopId: String(p.shopId),
          categoryId: String(p.categoryId),
          productName: p.productName,
          description: p.description,
          price: p.price,
          stockQuantity: p.stockQuantity,
          imageUrls: p.imageUrls ?? [],
          status: p.status === 'out_of_stock' ? 'out_of_stock' : 'available',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
        setProducts(mappedProducts);

        const mappedCategories: Category[] = categoriesApi.map((c: any) => ({
          id: c._id,
          name: c.name,
          description: c.description,
          isBuiltIn: !!c.isBuiltIn,
          createdAt: c.createdAt,
        }));
        setCategories(mappedCategories);

        // Orders require auth and role; skip for now or fetch via a future admin orders endpoint
        setOrders([]);
      } catch (e) {
        console.error('Failed to load admin data', e);
      }
    })();
  }, []);

  // When switching to Categories tab, refresh from DB so it reflects existing data
  useEffect(() => {
    if (activeTab === 'categories') {
      reloadCategories();
    }
  }, [activeTab]);

  const handleShopStatusChange = async (shopId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await apiService.updateShopStatus(shopId, newStatus);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s));
    } catch (e) {
      console.error('Failed to update shop status', e);
    }
  };

  const handleDeleteUser = (_userId: string) => {
    alert('Deleting users via admin panel is not yet wired to the API.');
  };

  const handleUpdateUserRole = (_userId: string, _newRole: string) => {
    alert('Updating user roles is not yet wired to the API.');
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (e) {
      console.error('Failed to delete product', e);
    }
  };

  const handleAssignDeliveryBoy = (_orderId: string, _deliveryBoyId: string) => {
    alert('Assigning delivery via API not yet implemented in UI.');
  };

  const handleAddCategory = async (categoryName: string, description: string) => {
    try {
      const c = await apiService.createCategory({ name: categoryName, description });
      if (c) {
        // After creating, reload to reflect DB truth (handles duplicates/validation)
        await reloadCategories();
      }
    } catch (e) {
      console.error('Failed to add category', e);
      alert('Failed to add category. Make sure you are logged in as admin.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (e) {
      console.error('Failed to delete category', e);
      alert('Failed to delete category. Ensure there are no products in it and you have admin rights.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be an admin to access this dashboard.</p>
        </div>
      </div>
    );
  }

  const pendingShops = shops.filter(shop => shop.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(order => !order.deliveryBoyId).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your marketplace ecosystem</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Shops</p>
                <p className="text-2xl font-bold text-gray-900">{shops.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Delivery Boys</p>
                <p className="text-2xl font-bold text-gray-900">{deliveryBoys.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {['overview', 'users', 'shops', 'products', 'categories', 'orders', 'delivery'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'delivery' ? 'Delivery Management' : tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab orders={orders} shops={shops} pendingShops={pendingShops} users={users} />
            )}

            {activeTab === 'users' && (
              <UsersTab 
                users={users} 
                onDeleteUser={handleDeleteUser}
                onUpdateUserRole={handleUpdateUserRole}
              />
            )}

            {activeTab === 'shops' && (
              <ShopsTab 
                shops={shops} 
                users={users}
                onShopStatusChange={handleShopStatusChange}
              />
            )}

            {activeTab === 'products' && (
              <ProductsTab 
                products={products}
                shops={shops}
                categories={categories}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'categories' && (
              <CategoryManagement
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab orders={orders} users={users} products={products} />
            )}

            {activeTab === 'delivery' && (
              <DeliveryManagementTab
                orders={orders}
                deliveryBoys={deliveryBoys}
                users={users}
                onAssignDeliveryBoy={handleAssignDeliveryBoy}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  orders: Order[];
  shops: Shop[];
  pendingShops: number;
  users: User[];
}> = ({ orders, shops, pendingShops, users }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
      <div className="space-y-3">
        {orders.slice(0, 5).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Order #{order.id}</p>
              <p className="text-sm text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <span className="font-medium text-green-600">${order.totalAmount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Shop Approvals</h3>
      <div className="space-y-3">
        {shops.filter(shop => shop.status === 'pending').slice(0, 5).map((shop) => (
          <div key={shop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{shop.shopName}</p>
              <p className="text-sm text-gray-600">{shop.address}</p>
            </div>
            <div className="flex space-x-2">
              <button className="text-green-600 hover:text-green-700">
                <CheckCircle className="h-5 w-5" />
              </button>
              <button className="text-red-600 hover:text-red-700">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Users Tab Component
const UsersTab: React.FC<{
  users: User[];
  onDeleteUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, newRole: string) => void;
}> = ({ users, onDeleteUser, onUpdateUserRole }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-[#f5f7fa] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => onUpdateUserRole(user.id, e.target.value)}
                  className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'shop_owner' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'delivery_boy' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  <option value="customer">Customer</option>
                  <option value="shop_owner">Shop Owner</option>
                  <option value="delivery_boy">Delivery Boy</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onDeleteUser(user.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Shops Tab Component
const ShopsTab: React.FC<{
  shops: Shop[];
  users: User[];
  onShopStatusChange: (shopId: string, status: 'approved' | 'rejected') => void;
}> = ({ shops, users, onShopStatusChange }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Management</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {shops.map((shop) => {
            const owner = users.find(u => u.id === shop.ownerId);
            return (
              <tr key={shop.id} className="hover:bg-[#f5f7fa] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                    <div className="text-sm text-gray-500">{shop.address}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {owner?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    shop.status === 'approved' ? 'bg-green-100 text-green-800' :
                    shop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {shop.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onShopStatusChange(shop.id, 'approved')}
                      className="text-green-600 hover:text-green-900"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onShopStatusChange(shop.id, 'rejected')}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// Products Tab Component
const ProductsTab: React.FC<{
  products: Product[];
  shops: Shop[];
  categories: Category[];
  onDeleteProduct: (productId: string) => void;
}> = ({ products, shops, categories, onDeleteProduct }) => {
  const [visibleCount, setVisibleCount] = useState<number>(2); // load 2 cards initially

  const visibleProducts = products.slice(0, visibleCount);
  const canLoadMore = visibleCount < products.length;

  return (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Management</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleProducts.map((product) => {
        const shop = shops.find(s => s.id === product.shopId);
        const category = categories.find(c => c.id === product.categoryId);
        return (
          <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
              <img
                src={product.imageUrls[0]}
                alt={product.productName}
                className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  decoding="async"
              />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{product.productName}</h4>
            <p className="text-sm text-gray-600 mb-2">{shop?.shopName}</p>
            <p className="text-sm text-gray-500 mb-2">{category?.name}</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-blue-600">${product.price}</span>
              <span className="text-sm text-gray-500">{product.stockQuantity} in stock</span>
            </div>
            <button
              onClick={() => onDeleteProduct(product.id)}
              className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
            </button>
          </div>
        );
      })}
    </div>
      {canLoadMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisibleCount(c => Math.min(c + 2, products.length))}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Load more
          </button>
        </div>
      )}
  </div>
);
};

// Orders Tab Component
const OrdersTab: React.FC<{
  orders: Order[];
  users: User[];
  products: Product[];
}> = ({ orders, users, products }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h3>
    <div className="space-y-4">
      {orders.map((order) => {
        const customer = users.find(u => u.id === order.customerId);
        return (
          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Order #{order.id}</h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status}
                </span>
                <span className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Customer: {customer?.name} • {new Date(order.orderDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Items: {order.items.length} • Address: {order.shippingAddress}
            </p>
          </div>
        );
      })}
    </div>
  </div>
);

// Delivery Management Tab Component
const DeliveryManagementTab: React.FC<{
  orders: Order[];
  deliveryBoys: User[];
  users: User[];
  onAssignDeliveryBoy: (orderId: string, deliveryBoyId: string) => void;
}> = ({ orders, deliveryBoys, users, onAssignDeliveryBoy }) => {
  const unassignedOrders = orders.filter(order => !order.deliveryBoyId && order.status === 'confirmed');
  const assignedOrders = orders.filter(order => order.deliveryBoyId);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Management</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Unassigned Orders */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Unassigned Orders ({unassignedOrders.length})
          </h4>
          <div className="space-y-4">
            {unassignedOrders.map((order) => {
              const customer = users.find(u => u.id === order.customerId);
              return (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">Order #{order.id}</h5>
                    <span className="text-sm font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {customer?.name} • {order.shippingAddress}
                  </p>
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignDeliveryBoy(order.id, e.target.value);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      defaultValue=""
                    >
                      <option value="">Select Delivery Boy</option>
                      {deliveryBoys.map((boy) => (
                        <option key={boy.id} value={boy.id}>
                          {boy.name} ({boy.vehicleType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Orders */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Assigned Orders ({assignedOrders.length})
          </h4>
          <div className="space-y-4">
            {assignedOrders.map((order) => {
              const customer = users.find(u => u.id === order.customerId);
              const deliveryBoy = deliveryBoys.find(u => u.id === order.deliveryBoyId);
              return (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">Order #{order.id}</h5>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.deliveryStatus === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                      order.deliveryStatus === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                      order.deliveryStatus === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                      order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.deliveryStatus?.replace('_', ' ') || 'assigned'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Customer: {customer?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Delivery Boy: {deliveryBoy?.name} ({deliveryBoy?.vehicleType})
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Management Component
const CategoryManagement: React.FC<{
  categories: Category[];
  onAddCategory: (name: string, description: string) => void;
  onDeleteCategory: (id: string) => void;
}> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCategory(formData.name, formData.description);
    setFormData({ name: '', description: '' });
    setShowAddForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Category Management</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Category
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Category
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{category.name}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                category.isBuiltIn ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {category.isBuiltIn ? 'Built-in' : 'Custom'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{category.description}</p>
            {!category.isBuiltIn && (
              <button
                onClick={() => onDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-900 text-sm flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;