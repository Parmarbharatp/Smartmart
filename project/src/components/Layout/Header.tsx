import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, User, LogOut, Store, Settings, Truck, Package, Menu, X, Search, Bell, 
  Sun, Moon, Heart, MapPin, Phone, Mail, ChevronDown, Grid, List, Filter, Star,
  Home, Tag, Users, Zap, Shield, Award, TrendingUp, MessageCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchFocused(false);
      setIsMobileMenuOpen(false);
    }
  };

  const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Shops', path: '/shops', icon: Store },
  ];

  const mockNotifications = [
    { id: 1, title: 'Order Shipped', message: 'Your order #12345 has been shipped', time: '2 min ago', type: 'success' },
    { id: 2, title: 'New Deal Alert', message: '50% off on Electronics', time: '1 hour ago', type: 'info' },
    { id: 3, title: 'Review Reminder', message: 'Rate your recent purchase', time: '2 hours ago', type: 'warning' },
  ];

  return (
    <>


      {/* Main Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'glass shadow-strong' 
          : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md'
      }`}>
        
        {/* Top Header Section */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-10 text-xs">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">+1-800-MARKET</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">support@smartmart.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Worldwide Delivery</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Secure Shopping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-3 w-3 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400">Trusted by 50K+ customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Store className="h-5 w-5 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl lg:text-2xl font-bold text-gradient">
                    SmartMart
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Premium Marketplace
                  </div>
                </div>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="w-full relative">
                <div className={`relative transition-all duration-300 ${
                  isSearchFocused ? 'transform scale-105' : ''
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-sm opacity-0 transition-opacity duration-300 ${
                    isSearchFocused ? 'opacity-20' : ''
                  }`}></div>
                  <div className="relative">
                    <Search className={`absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                      isSearchFocused 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      placeholder="Search for products, brands, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className={`w-full pl-14 pr-20 py-4 transition-all duration-300 text-base ${
                        isSearchFocused
                          ? 'glass shadow-lg'
                          : 'glass shadow-md'
                      } focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    />
                    <button
                      type="submit"
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 font-semibold transition-all duration-300 ${
                        isSearchFocused
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Search
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 lg:p-3 transition-all duration-300 glass hover:scale-110 active:scale-95 shadow-sm"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              {user ? (
                <>
                  {/* Wishlist */}
                  <button className="relative p-2 lg:p-3 rounded-xl transition-all duration-300 glass hover:scale-110 active:scale-95">
                    <Heart className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-red-500" />
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                      3
                    </span>
                  </button>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 lg:p-3 rounded-xl transition-all duration-300 glass hover:scale-110 active:scale-95"
                    >
                      <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-blue-500" />
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-bounce">
                        {mockNotifications.length}
                      </span>
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-3 w-80 glass rounded-2xl shadow-2xl py-2 z-50 border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {mockNotifications.map((notification) => (
                            <div key={notification.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'success' ? 'bg-green-500' :
                                  notification.type === 'warning' ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                          <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                            View all notifications
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cart */}
                  {user.role === 'customer' && (
                    <Link 
                      to="/cart" 
                      className="relative p-2 lg:p-3 rounded-xl transition-all duration-300 glass hover:scale-110 active:scale-95 group"
                    >
                      <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-green-500 transition-colors" />
                      {items.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                          {items.length}
                        </span>
                      )}
                    </Link>
                  )}
                  
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-2 lg:space-x-3 p-2 rounded-xl transition-all duration-300 glass hover:scale-105 active:scale-95"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>
                      <div className="hidden lg:block text-left">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {user.role.replace('_', ' ')}
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
                        isProfileOpen ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-80 glass rounded-2xl shadow-2xl py-2 z-50 border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                              </p>
                              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                  : user.role === 'shop_owner'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : user.role === 'delivery_boy'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              } capitalize`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="py-2">
                          {user.role === 'admin' && (
                            <Link 
                              to="/admin" 
                              className="flex items-center px-6 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Settings className="h-5 w-5 mr-3 text-red-500" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">Admin Dashboard</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Manage marketplace
                                </div>
                              </div>
                            </Link>
                          )}
                          
                          {user.role === 'shop_owner' && (
                            <Link 
                              to="/shop-dashboard" 
                              className="flex items-center px-6 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Store className="h-5 w-5 mr-3 text-blue-500" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">Shop Dashboard</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Manage your shop
                                </div>
                              </div>
                            </Link>
                          )}
                          
                          {user.role === 'delivery_boy' && (
                            <Link 
                              to="/delivery-dashboard" 
                              className="flex items-center px-6 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Truck className="h-5 w-5 mr-3 text-purple-500" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">Delivery Dashboard</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Manage deliveries
                                </div>
                              </div>
                            </Link>
                          )}
                          
                          {user.role === 'customer' && (
                            <>
                              <Link 
                                to="/orders" 
                                className="flex items-center px-6 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                <Package className="h-5 w-5 mr-3 text-green-500" />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">My Orders</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Track your orders
                                  </div>
                                </div>
                              </Link>
                              <Link 
                                to="/profile" 
                                className="flex items-center px-6 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                <User className="h-5 w-5 mr-3 text-blue-500" />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">Profile Settings</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Update your profile
                                  </div>
                                </div>
                              </Link>
                            </>
                          )}
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-6 py-3 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                          >
                            <LogOut className="h-5 w-5 mr-3" />
                            <div>
                              <div className="font-medium">Sign Out</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Logout from account
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <Link 
                    to="/login" 
                    className="btn-ghost text-sm lg:text-base"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn-primary text-sm lg:text-base"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2 lg:p-3 rounded-xl transition-all duration-300 glass hover:scale-110 active:scale-95"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-200 dark:border-gray-700 glass">
            <div className="px-4 py-4 space-y-4">
              
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 glass rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </form>
              
              {/* Mobile Navigation */}
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 py-3 px-4 rounded-xl font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile User Actions */}
              {user && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  {user.role === 'customer' && (
                    <>
                      <Link
                        to="/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Package className="h-5 w-5" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/cart"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span>Cart ({items.length})</span>
                      </Link>
                    </>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 py-3 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Click outside handlers */}
      {(isProfileOpen || showNotifications) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setIsProfileOpen(false);
            setShowNotifications(false);
          }}
        />
      )}
    </>
  );
};

export default Header;