import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Star, Package, Clock, Truck, Navigation } from 'lucide-react';
import { Shop, Product, Review } from '../../types';
import ProductCard from '../Products/ProductCard';
import { apiService } from '../../services/api';

const ShopPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopData = async () => {
      if (!shopId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch shop details with products in one call
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shops/${shopId}/details`);
        if (!response.ok) {
          throw new Error('Shop not found');
        }
        const data = await response.json();
        // Support both { data: { shop, products } } and flat shapes
        const shopData = data?.data?.shop ?? data?.shop ?? null;
        const productData = data?.data?.products ?? data?.products ?? [];
        setShop(shopData);
        setProducts(Array.isArray(productData) ? productData : []);

        // For now, we'll use empty reviews array since we don't have a reviews API yet
        setReviews([]);

      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error ? 'Error Loading Shop' : 'Shop Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The shop you're looking for doesn't exist."}
          </p>
          <Link to="/shops" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Browse All Shops
          </Link>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={shop.imageUrl || 'https://via.placeholder.com/600x600?text=Shop'}
                  alt={shop.shopName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Shop'; }}
                />
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.shopName}</h1>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(avgRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {avgRating.toFixed(1)} ({reviews.length} reviews)
                    </span>
                  </div>
                </div>
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
              
              <p className="text-gray-600 mb-6">{shop.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                  <span className="font-medium">{shop.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="h-5 w-5 mr-3 text-green-600" />
                  <span className="font-medium">{shop.contactInfo}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Package className="h-5 w-5 mr-3 text-purple-600" />
                  <span className="font-medium">{products.length} products available</span>
                </div>
                {shop.openingHours && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3 text-orange-600" />
                    <span className="font-medium">{shop.openingHours}</span>
                  </div>
                )}
                {shop.deliveryRadius && (
                  <div className="flex items-center text-gray-600">
                    <Truck className="h-5 w-5 mr-3 text-indigo-600" />
                    <span className="font-medium">Delivery within {shop.deliveryRadius} km</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Location */}
      {false && shop.location && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <MapPin className="mr-3 h-6 w-6 text-blue-600" />
                Shop Location
              </h2>
            </div>
            {/* hidden for now */}
          </div>
        </div>
      )}

      {/* Shop Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Products from {shop.shopName}</h2>
          <p className="text-gray-600">Browse our collection of quality products</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600">This shop hasn't added any products yet. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;