import React, { useState, useEffect } from 'react';
import { User, Store, MapPin, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const SimpleProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'user' | 'shop'>('user');
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      console.log('SimpleProfilePage: Starting to load user data...');
      
      // Load current user data
      const currentUser = await apiService.getCurrentUser();
      console.log('SimpleProfilePage: Current user loaded:', currentUser);
      
      // If user is a shop owner, load their shop data
      if (currentUser.role === 'shop_owner') {
        try {
          console.log('SimpleProfilePage: User is shop owner, loading shop data...');
          const myShop = await apiService.getMyShop();
          console.log('SimpleProfilePage: Shop data loaded:', myShop);
          if (myShop) {
            setShop(myShop);
            setActiveTab('shop'); // Default to shop tab for shop owners
          }
        } catch (shopError) {
          console.log('SimpleProfilePage: No shop found for this user:', shopError);
        }
      }
      console.log('SimpleProfilePage: User data loading completed successfully');
    } catch (error) {
      console.error('SimpleProfilePage: Error loading user data:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Settings className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadUserData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account and location information</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('user')}
              className={`flex items-center px-1 py-2 border-b-2 font-medium text-sm ${
                activeTab === 'user'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="mr-2 h-4 w-4" />
              Personal Information
            </button>
            {user.role === 'shop_owner' && shop && (
              <button
                onClick={() => setActiveTab('shop')}
                className={`flex items-center px-1 py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'shop'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Store className="mr-2 h-4 w-4" />
                Shop Information
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'user' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">User Profile</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">{user.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900">{user.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900">{user.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                      <MapPin className="mr-2 h-5 w-5" />
                      Location Information
                    </h3>
                    {user.location ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Current Location</label>
                          <p className="text-gray-900">{user.location.formattedAddress}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">City</label>
                            <p className="text-gray-900">{user.location.city || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">State</label>
                            <p className="text-gray-900">{user.location.state || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">No location information available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'shop' && shop && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Shop Profile</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Shop Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Shop Name</label>
                        <p className="text-gray-900">{shop.shopName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <p className="text-gray-900">{shop.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900">{shop.address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contact</label>
                        <p className="text-gray-900">{shop.contactInfo}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                      <MapPin className="mr-2 h-5 w-5" />
                      Shop Location
                    </h3>
                    {shop.location ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Shop Address</label>
                          <p className="text-gray-900">{shop.location.formattedAddress}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">City</label>
                            <p className="text-gray-900">{shop.location.city || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">State</label>
                            <p className="text-gray-900">{shop.location.state || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">No location information available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Services Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <MapPin className="h-6 w-6 text-blue-600 mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Location Services</h3>
              <p className="text-blue-800 text-sm mb-3">
                Your location information helps us provide better services like:
              </p>
              <ul className="text-blue-800 text-sm space-y-1 ml-4">
                <li>• Finding nearby shops and products</li>
                <li>• Accurate delivery estimates</li>
                <li>• Local recommendations</li>
                <li>• Shop location verification</li>
              </ul>
              <p className="text-blue-700 text-xs mt-3">
                Your location data is stored securely and only used to improve your shopping experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleProfilePage;
