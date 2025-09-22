import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Store, Grid, List, Filter } from 'lucide-react';
import { Shop } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';
import { apiService } from '../../services/api';

const ShopsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSidebar, setShowSidebar] = useState(true);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    const fetchShops = async () => {
      try {
        // Load all shops; we'll filter client-side to show approved + own
        const shopsApi = await apiService.getShops({ limit: 200 });
        const mapped: Shop[] = shopsApi.map((s: any) => ({
          id: s._id,
          ownerId: String(s.ownerId),
          shopName: s.shopName,
          description: s.description,
          address: s.address,
          contactInfo: s.contactInfo,
          status: s.status,
          imageUrl: s.imageUrl,
          openingHours: s.openingHours,
          deliveryRadius: s.deliveryRadius,
          rating: s.rating,
          totalReviews: s.totalReviews,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
        const visible = mapped.filter((s) => s.status === 'approved' || (user && s.ownerId === user.id));
        setShops(visible);
        setFilteredShops(visible);
      } catch (e) {
        console.error('Failed to load shops', e);
      }
    };

    fetchShops();
  }, [user]);

  useEffect(() => {
    let filtered = shops;

    if (searchTerm) {
      filtered = filtered.filter(shop =>
        shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters here based on the filters state

    setFilteredShops(filtered);
  }, [shops, searchTerm, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            type="shops"
            categories={[]}
            onFilterChange={handleFilterChange}
            filters={filters}
          />
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className={`text-4xl font-bold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Local Shops
                  </h1>
                  <p className={`text-xl ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Discover amazing local businesses in your area
                  </p>
                </div>
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`lg:hidden p-3 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  } shadow-lg`}
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className={`rounded-2xl shadow-xl p-6 backdrop-blur-md border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white/50 border-gray-200'
              }`}>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      placeholder="Search shops by name, description, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className={`flex rounded-xl overflow-hidden border-2 ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-4 transition-all duration-300 ${
                        viewMode === 'grid'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-4 transition-all duration-300 ${
                        viewMode === 'list'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="mb-6">
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Showing <span className="font-bold text-blue-600">{filteredShops.length}</span> of{' '}
                <span className="font-bold">{shops.length}</span> shops
              </p>
            </div>

            {/* Shops Grid */}
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                : "space-y-6"
            }>
              {filteredShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} viewMode={viewMode} />
              ))}
            </div>

            {/* No Results */}
            {filteredShops.length === 0 && (
              <div className="text-center py-20">
                <div className={`w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Store className={`h-16 w-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  No shops found
                </h3>
                <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShopCard: React.FC<{ shop: Shop; viewMode: 'grid' | 'list' }> = ({ shop, viewMode }) => {
  const { isDarkMode } = useTheme();
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductCount = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/shop/${shop.id}?limit=1`);
        if (response.ok) {
          const data = await response.json();
          setProductCount(data.data?.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Error fetching product count:', error);
        setProductCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProductCount();
  }, [shop.id]);

  const avgRating = shop.rating || 0;

  if (viewMode === 'list') {
    return (
      <div className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border group ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}>
        <div className="flex">
          <div className="w-48 h-32 bg-gray-200 relative overflow-hidden">
            <img
              src={shop.imageUrl}
              alt={shop.shopName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className={`text-xl font-bold group-hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {shop.shopName}
              </h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Verified
              </span>
            </div>
            
            <p className={`mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {shop.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(avgRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
                  </span>
                </div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {loading ? '...' : `${productCount} products`}
                </span>
              </div>
              
              <Link 
                to={`/shops/${shop.id}`}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium inline-block"
              >
                Visit Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border group ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-white border-gray-100 hover:border-gray-200'
    }`}>
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img
          src={shop.imageUrl}
          alt={shop.shopName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center space-x-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-sm">4.9</span>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
            Verified
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className={`text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {shop.shopName}
        </h3>
        
        <p className={`mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {shop.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MapPin className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {shop.address.split(',')[0]}
            </span>
          </div>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {loading ? '...' : `${productCount} products`}
          </span>
        </div>
        
        <Link 
          to={`/shops/${shop.id}`}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 inline-block text-center"
        >
          Visit Shop
        </Link>
      </div>
    </div>
  );
};

export default ShopsPage;