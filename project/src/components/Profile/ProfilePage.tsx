import React, { useState, useEffect } from 'react';
import { User, Store, MapPin, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import UserProfile from './UserProfile';
import ShopProfile from './ShopProfile';

const ProfilePage: React.FC = () => {
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
      console.log('ProfilePage: Starting to load user data...');
      
      // Load current user data
      const currentUser = await apiService.getCurrentUser();
      console.log('ProfilePage: Current user loaded:', currentUser);
      
      // If user is a shop owner, load their shop data
      if (currentUser.role === 'shop_owner') {
        try {
          console.log('ProfilePage: User is shop owner, loading shop data...');
          const myShop = await apiService.getMyShop();
          console.log('ProfilePage: Shop data loaded:', myShop);
          if (myShop) {
            setShop(myShop);
            setActiveTab('shop'); // Default to shop tab for shop owners
          }
        } catch (shopError) {
          console.log('ProfilePage: No shop found for this user:', shopError);
        }
      }
      console.log('ProfilePage: User data loading completed successfully');
    } catch (error) {
      console.error('ProfilePage: Error loading user data:', error);
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
            <UserProfile user={user} />
          )}
          {activeTab === 'shop' && shop && (
            <ShopProfile shop={shop} isOwner={true} />
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

export default ProfilePage;
