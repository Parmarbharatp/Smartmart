import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Star, Store, Package, Users, ShoppingBag, TrendingUp, Shield, Truck, Award, 
  ArrowRight, Play, Zap, Heart, Eye, Filter, Grid, ChevronRight, MapPin, Clock,
  Smartphone, Laptop, Home as HomeIcon, Shirt, Gift, Coffee, Camera, Headphones,
  CheckCircle, Globe, CreditCard, RefreshCw, MessageCircle, ThumbsUp, Navigation
} from 'lucide-react';
import { Product, Shop } from '../../types';
import { apiService } from '../../services/api';
// import { useLocationContext } from '../../contexts/LocationContext';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  
  // const { 
  //   currentLocationDetails, 
  //   locateMeWithDetails, 
  //   isMapsReady 
  // } = useLocationContext();
  
  // Temporary mock values
  const currentLocationDetails = null;
  const locateMeWithDetails = async () => null;
  const isMapsReady = true;

  const handleLocationTracking = async () => {
    try {
      setLocationMessage('Getting your location...');
      const locationDetails = await locateMeWithDetails();
      
      if (locationDetails) {
        // Save location to user profile
        const locationData = {
          coordinates: locationDetails.coordinates,
          address: locationDetails.address,
          city: locationDetails.city,
          state: locationDetails.state,
          country: locationDetails.country,
          postalCode: locationDetails.postalCode,
          formattedAddress: locationDetails.formattedAddress,
          placeId: locationDetails.placeId
        };

        await apiService.updateUserLocation(locationData);
        setLocationMessage(`Location saved: ${locationDetails.city}, ${locationDetails.state}`);
      } else {
        setLocationMessage('Failed to get location details');
      }
    } catch (error) {
      console.error('Location tracking error:', error);
      setLocationMessage('Error getting location. Please check permissions.');
    }
  };
  
  useEffect(() => {
    (async () => {
      try {
        const [prods, shops] = await Promise.all([
          apiService.getProducts({ limit: 12 }),
          apiService.getShops({ status: 'approved', limit: 12 })
        ]);
        const mappedProducts: Product[] = prods.map((p: any) => ({
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
        const mappedShops: Shop[] = shops.map((s: any) => ({
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
        setFeaturedProducts(mappedProducts.slice(0, 8));
        setFeaturedShops(mappedShops.slice(0, 6));
        
        // Save products to localStorage for cart operations
        const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const newProducts = mappedProducts.filter(p => !existingProducts.some((ep: any) => ep.id === p.id));
        if (newProducts.length > 0) {
          localStorage.setItem('products', JSON.stringify([...existingProducts, ...newProducts]));
        }
      } catch (e) {
        console.error('Failed to load home listings', e);
      } finally {
        setIsVisible(true);
      }
    })();

    // Auto-slide for hero section
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const categories = [
    { name: 'Electronics', icon: Smartphone, color: 'from-blue-500 to-cyan-500', count: '2.5K+' },
    { name: 'Fashion', icon: Shirt, color: 'from-pink-500 to-rose-500', count: '1.8K+' },
    { name: 'Home & Garden', icon: HomeIcon, color: 'from-green-500 to-emerald-500', count: '950+' },
    { name: 'Sports', icon: Gift, color: 'from-orange-500 to-amber-500', count: '720+' },
    { name: 'Books', icon: Coffee, color: 'from-purple-500 to-violet-500', count: '1.2K+' },
    { name: 'Beauty', icon: Heart, color: 'from-red-500 to-pink-500', count: '680+' },
    { name: 'Tech', icon: Laptop, color: 'from-indigo-500 to-blue-500', count: '1.5K+' },
    { name: 'Audio', icon: Headphones, color: 'from-teal-500 to-cyan-500', count: '420+' },
  ];

  const heroSlides = [
    {
      title: "Discover Amazing Local Products",
      subtitle: "Shop from trusted local businesses and support your community",
      image: "https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Start Shopping",
      accent: "from-blue-600 to-purple-600"
    },
    {
      title: "Premium Quality Guaranteed",
      subtitle: "Every product is carefully curated for the best shopping experience",
      image: "https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Explore Products",
      accent: "from-emerald-600 to-teal-600"
    },
    {
      title: "Fast & Secure Delivery",
      subtitle: "Get your orders delivered quickly with our trusted delivery network",
      image: "https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Learn More",
      accent: "from-orange-600 to-red-600"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "Bank-level security with SSL encryption and fraud protection",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Same-day delivery available in most areas with real-time tracking",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Award,
      title: "Quality Guarantee",
      description: "30-day money-back guarantee on all products with easy returns",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Users,
      title: "Community First",
      description: "Supporting local businesses and building stronger communities",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: CreditCard,
      title: "Flexible Payments",
      description: "Multiple payment options including buy now, pay later",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Round-the-clock customer support via chat, email, and phone",
      color: "from-orange-500 to-amber-500"
    }
  ];

  const stats = [
    { label: "Happy Customers", value: "50K+", icon: Users, color: "text-blue-600" },
    { label: "Local Shops", value: "500+", icon: Store, color: "text-green-600" },
    { label: "Products", value: "10K+", icon: Package, color: "text-purple-600" },
    { label: "Cities", value: "25+", icon: MapPin, color: "text-orange-600" },
  ];

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Background Slides */}
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
            
            {/* Hero Content */}
            <div className="text-white space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
                  {heroSlides[currentSlide].title}
                </h1>
                <p className="text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-2xl">
                  {heroSlides[currentSlide].subtitle}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/products" 
                  className={`group bg-gradient-to-r ${heroSlides[currentSlide].accent} text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 inline-flex items-center justify-center transform hover:scale-105 active:scale-95`}
                >
                  <ShoppingBag className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  {heroSlides[currentSlide].cta}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/register" 
                  className="group glass text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center border border-white/30"
                >
                  <Store className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Become a Seller
                </Link>
                <button
                  onClick={handleLocationTracking}
                  className="group glass text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center border border-white/30"
                >
                  <Navigation className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Track Location
                </button>
              </div>

              {/* Location Status */}
              {locationMessage && (
                <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <p className="text-white text-sm">{locationMessage}</p>
                </div>
              )}

              {/* Current Location Display */}
              {currentLocationDetails && (
                <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <div className="flex items-center text-white text-sm">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{currentLocationDetails.city}, {currentLocationDetails.state}</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-3xl lg:text-4xl font-bold ${stat.color} mb-2`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-300 text-sm lg:text-base">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="animate-float">
                <div className="glass p-8 rounded-3xl border border-white/20 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div key={index} className="glass p-6 rounded-2xl text-center border border-white/10">
                          <Icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                          <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                          <div className="text-sm text-gray-300">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto mobile-padding">
          <div className="text-center mb-16">
            <h2 className="mobile-heading font-bold text-gray-900 dark:text-gray-100 mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Discover amazing products across all categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 lg:gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Link
                  key={index}
                  to={`/products?category=${category.name.toLowerCase()}`}
                  className="group card text-center hover-lift"
                >
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.count} items
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto mobile-padding">
          <div className="text-center mb-16">
            <h2 className="mobile-heading font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Choose SmartMart?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We're more than just a marketplace - we're your trusted partner in local commerce
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group card text-center hover-lift">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto mobile-padding">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="mobile-heading font-bold text-gray-900 dark:text-gray-100 mb-4">
                Trending Products
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Discover the most popular items from our local sellers
              </p>
            </div>
            <Link to="/products" className="btn-primary group hidden sm:flex">
              View All
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="product-grid">
            {featuredProducts.slice(0, 12).map((product) => (
              <div key={product.id} className="card-product group">
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={product.imageUrls[0]}
                    alt={product.productName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex space-x-3">
                      <Link
                        to={`/products/${product.id}`}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors shadow-lg transform hover:scale-110"
                      >
                        <Eye className="h-5 w-5 text-gray-700" />
                      </Link>
                      <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-lg transform hover:scale-110">
                        <Heart className="h-5 w-5 text-gray-700 hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3">
                    <span className="badge-error">
                      Hot
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="badge-success">
                      New
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {product.productName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`rating-star ${i < 4 ? 'rating-star-filled' : 'rating-star-empty'}`} />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">(4.8)</span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="price-current">
                        ${product.price}
                      </span>
                      <span className="price-original ml-2">
                        ${(product.price * 1.2).toFixed(2)}
                      </span>
                    </div>
                    <span className="price-discount">
                      20% OFF
                    </span>
                  </div>
                  
                  <Link
                    to={`/products/${product.id}`}
                    className="w-full btn-primary text-center block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="text-center mt-8 sm:hidden">
            <Link to="/products" className="btn-primary">
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Shops */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto mobile-padding">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="mobile-heading font-bold text-gray-900 dark:text-gray-100 mb-4">
                Featured Local Shops
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Discover amazing businesses in your community
              </p>
            </div>
            <Link to="/shops" className="btn-primary group hidden sm:flex">
              Explore All
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredShops.map((shop) => (
              <div key={shop.id} className="card-shop group">
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={shop.imageUrl}
                    alt={shop.shopName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  {/* Shop Rating */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="rating-stars mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="rating-star rating-star-filled" />
                      ))}
                      <span className="ml-2 text-sm">4.9</span>
                    </div>
                  </div>
                  
                  {/* Verified Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="badge-success flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {shop.shopName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {shop.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{shop.address.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Package className="h-4 w-4 mr-1" />
                      <span className="text-sm">50+ products</span>
                    </div>
                  </div>
                  
                  <Link
                    to={`/shops/${shop.id}`}
                    className="w-full btn-secondary text-center block group"
                  >
                    Visit Shop
                    <ArrowRight className="ml-2 h-4 w-4 inline group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="text-center mt-8 sm:hidden">
            <Link to="/shops" className="btn-primary">
              Explore All Shops
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto mobile-padding">
          <div className="text-center mb-16">
            <h2 className="mobile-heading font-bold text-gray-900 dark:text-gray-100 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Join thousands of satisfied customers who love shopping with us
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Regular Customer",
                avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100",
                rating: 5,
                comment: "Amazing platform! I've discovered so many great local businesses. The quality is outstanding and delivery is always on time."
              },
              {
                name: "Mike Chen",
                role: "Shop Owner",
                avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100",
                rating: 5,
                comment: "SmartMart has transformed my business. I've reached more customers than ever before and the platform is so easy to use."
              },
              {
                name: "Emily Davis",
                role: "Frequent Buyer",
                avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100",
                rating: 5,
                comment: "Love supporting local businesses through this platform. The customer service is exceptional and products are always high quality."
              }
            ].map((testimonial, index) => (
              <div key={index} className="card text-center hover-lift">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rating-stars justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="rating-star rating-star-filled" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {testimonial.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {testimonial.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto mobile-padding text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-100">
            Join thousands of satisfied customers and local businesses. Whether you're looking to shop or sell, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="glass text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center border border-white/30">
              <Users className="mr-3 h-6 w-6" />
              Join as Customer
            </Link>
            <Link to="/register" className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-300 inline-flex items-center justify-center shadow-2xl">
              <Store className="mr-3 h-6 w-6" />
              Start Selling
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;