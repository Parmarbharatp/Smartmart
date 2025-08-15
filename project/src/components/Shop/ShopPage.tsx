import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Star, Package } from 'lucide-react';
import { Shop, Product, Review } from '../../types';
import ProductCard from '../Products/ProductCard';

const ShopPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      const shops = JSON.parse(localStorage.getItem('shops') || '[]');
      const foundShop = shops.find((s: Shop) => s.id === shopId);
      setShop(foundShop || null);

      if (foundShop) {
        const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const shopProducts = allProducts.filter((p: Product) => p.shopId === shopId);
        setProducts(shopProducts);

        // Get reviews for shop products
        const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        const shopReviews = allReviews.filter((r: Review) => 
          shopProducts.some(p => p.id === r.productId)
        );
        setReviews(shopReviews);
      }
      setLoading(false);
    }
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

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Shop Not Found</h1>
          <p className="text-gray-600 mb-6">The shop you're looking for doesn't exist.</p>
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
                  src={shop.imageUrl}
                  alt={shop.shopName}
                  className="w-full h-full object-cover"
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
                  <MapPin className="h-5 w-5 mr-3" />
                  <span>{shop.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-5 w-5 mr-3" />
                  <span>{shop.contactInfo}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Package className="h-5 w-5 mr-3" />
                  <span>{products.length} products available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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