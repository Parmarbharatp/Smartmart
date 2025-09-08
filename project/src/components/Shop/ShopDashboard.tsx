import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Package, ShoppingBag, DollarSign, Star } from 'lucide-react';
import { Shop, Product, Order } from '../../types';
import ProductManagement from './ProductManagement';

const ShopDashboard: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');

  useEffect(() => {
    if (user) {
      // Get shop data
      const shops = JSON.parse(localStorage.getItem('shops') || '[]');
      const userShop = shops.find((s: Shop) => s.ownerId === user.id);
      setShop(userShop || null);

      if (userShop) {
        // Get products
        const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const shopProducts = allProducts.filter((p: Product) => p.shopId === userShop.id);
        setProducts(shopProducts);

        // Get orders
        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const shopOrders = allOrders.filter((o: Order) => o.shopId === userShop.id);
        setOrders(shopOrders);
      }
    }
  }, [user]);

  const handleShopCreated = (newShop: Shop) => {
    setShop(newShop);
  };

  const handleProductsUpdated = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  };

  if (!user || user.role !== 'shop_owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be a shop owner to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return <ShopRegistration onShopCreated={handleShopCreated} />;
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const totalProducts = products.length;
  const avgRating = 4.5; // Mock rating

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Dashboard</h1>
          <p className="text-gray-600">Welcome back, {shop.shopName}!</p>
        </div>

        {/* Shop Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Shop Status</h2>
              <p className="text-gray-600">{shop.description}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                shop.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : shop.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {shop.status.charAt(0).toUpperCase() + shop.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Orders
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id}</p>
                        <p className="text-sm text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <ProductManagement
                shop={shop}
                products={products}
                onProductsUpdated={handleProductsUpdated}
              />
            )}

            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h3>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Order #{order.id}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(order.orderDate).toLocaleDateString()} • ${order.totalAmount.toFixed(2)}
                      </p>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                          View Details
                        </button>
                        <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Shop Registration Component
const ShopRegistration: React.FC<{ onShopCreated: (shop: Shop) => void }> = ({ onShopCreated }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    address: '',
    contactInfo: '',
    imageFile: null as File | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Shop name validation
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    } else if (formData.shopName.trim().length < 3) {
      newErrors.shopName = 'Shop name must be at least 3 characters long';
    } else if (formData.shopName.trim().length > 50) {
      newErrors.shopName = 'Shop name must be less than 50 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters long';
    }

    // Contact info validation
    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'Contact information is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.contactInfo.trim())) {
      newErrors.contactInfo = 'Please enter a valid phone number';
    }

    // Image validation
    if (formData.imageFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(formData.imageFile.type)) {
        newErrors.imageFile = 'Please upload a valid image file (JPEG, PNG, or WebP)';
      } else if (formData.imageFile.size > maxSize) {
        newErrors.imageFile = 'Image file size must be less than 5MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous image errors
      if (errors.imageFile) {
        setErrors({ ...errors, imageFile: '' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert image file to base64 for storage (in a real app, you'd upload to a server)
      let imageUrl = 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=500';
      
      if (formData.imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imageUrl = e.target?.result as string;
        };
        reader.readAsDataURL(formData.imageFile);
      }

      const newShop: Shop = {
        id: Date.now().toString(),
        ownerId: user!.id,
        shopName: formData.shopName.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        contactInfo: formData.contactInfo.trim(),
        status: 'pending',
        imageUrl: imageUrl,
        imageFile: formData.imageFile || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const shops = JSON.parse(localStorage.getItem('shops') || '[]');
      shops.push(newShop);
      localStorage.setItem('shops', JSON.stringify(shops));

      onShopCreated(newShop);
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Shop name and description' },
    { id: 2, title: 'Location', description: 'Address and contact details' },
    { id: 3, title: 'Visual Identity', description: 'Upload shop image' },
    { id: 4, title: 'Review', description: 'Review and submit' }
  ];

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.shopName.trim()) {
        newErrors.shopName = 'Shop name is required';
      } else if (formData.shopName.trim().length < 3) {
        newErrors.shopName = 'Shop name must be at least 3 characters long';
      } else if (formData.shopName.trim().length > 50) {
        newErrors.shopName = 'Shop name must be less than 50 characters';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters long';
      } else if (formData.description.trim().length > 500) {
        newErrors.description = 'Description must be less than 500 characters';
      }
    } else if (currentStep === 2) {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        newErrors.address = 'Address must be at least 10 characters long';
      }

      if (!formData.contactInfo.trim()) {
        newErrors.contactInfo = 'Contact information is required';
      } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.contactInfo.trim())) {
        newErrors.contactInfo = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your shop "{formData.shopName}" has been registered successfully. 
            It's currently under review and will be approved soon.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Register Your Shop
          </h1>
          <p className="text-gray-600 text-lg">Join our marketplace and start selling your products</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 mx-4 transition-all duration-300 ${
                    currentStep > step.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                    <p className="text-gray-600">Tell us about your shop</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Shop Name *
                        </div>
                      </label>
                      <input
                        type="text"
                        id="shopName"
                        required
                        value={formData.shopName}
                        onChange={(e) => handleInputChange('shopName', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 ${
                          errors.shopName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="Enter your shop name"
                      />
                      {errors.shopName && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.shopName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Description *
                        </div>
                      </label>
                      <textarea
                        id="description"
                        required
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none ${
                          errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="Describe your shop, products, and services..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        {errors.description && (
                          <p className="text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 ml-auto">
                          {formData.description.length}/500 characters
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Location & Contact</h2>
                    <p className="text-gray-600">Where can customers find you?</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Shop Address *
                        </div>
                      </label>
                      <input
                        type="text"
                        id="address"
                        required
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 ${
                          errors.address ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="Enter your complete shop address"
                      />
                      {errors.address && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Contact Number *
                        </div>
                      </label>
                      <input
                        type="tel"
                        id="contactInfo"
                        required
                        value={formData.contactInfo}
                        onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 ${
                          errors.contactInfo ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="Enter your phone number"
                      />
                      {errors.contactInfo && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.contactInfo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Visual Identity */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Visual Identity</h2>
                    <p className="text-gray-600">Upload a beautiful image for your shop</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Shop Image
                        </div>
                      </label>
                      
                      {!imagePreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                          <input
                            type="file"
                            id="imageFile"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <label htmlFor="imageFile" className="cursor-pointer">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-lg font-medium text-gray-700 mb-2">Upload Shop Image</p>
                            <p className="text-sm text-gray-500 mb-4">Click to browse or drag and drop</p>
                            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Choose File
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Shop preview"
                              className="w-48 h-48 object-cover rounded-xl border-2 border-gray-200 shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, imageFile: null });
                                setImagePreview(null);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors duration-200 shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-gray-600">Image uploaded successfully!</p>
                        </div>
                      )}
                      
                      {errors.imageFile && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.imageFile}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Accepted formats: JPEG, PNG, WebP. Maximum size: 5MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
                    <p className="text-gray-600">Please review your information before submitting</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Shop Name:</span>
                      <span className="text-gray-900">{formData.shopName}</span>
                    </div>
                    <div className="flex items-start justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Description:</span>
                      <span className="text-gray-900 text-right max-w-xs">{formData.description}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Address:</span>
                      <span className="text-gray-900 text-right max-w-xs">{formData.address}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Contact:</span>
                      <span className="text-gray-900">{formData.contactInfo}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-gray-700">Image:</span>
                      <span className="text-gray-900">{imagePreview ? 'Uploaded' : 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Important Note</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Your shop will be reviewed by our team before approval. This process usually takes 1-2 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </div>
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <div className="flex items-center">
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Register Shop
                      </div>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;