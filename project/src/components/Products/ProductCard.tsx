import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Eye, Truck, Shield, Award, MapPin, Clock, Zap } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onQuickAdd?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid', onQuickAdd }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user?.role === 'customer' && onQuickAdd) {
      onQuickAdd(product.id);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const mockRating = 4.5;
  const mockReviews = Math.floor(Math.random() * 500) + 50;
  const mockDiscount = Math.floor(Math.random() * 30) + 10;
  const originalPrice = product.price * (1 + mockDiscount / 100);

  if (viewMode === 'list') {
    return (
      <div className="card-product group">
        <div className="flex flex-col sm:flex-row">
          
          {/* Product Image */}
          <div className="w-full sm:w-64 h-48 sm:h-40 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
            <Link to={`/products/${product.id}`}>
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton"></div>
              )}
              <img
                src={product.imageUrls[0]}
                alt={product.productName}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            </Link>
            
            {/* Status Badges */}
            <div className="absolute top-3 left-3 flex flex-col space-y-2">
              {product.status === 'out_of_stock' ? (
                <span className="badge-error">Out of Stock</span>
              ) : product.stockQuantity < 10 ? (
                <span className="badge-warning">Low Stock</span>
              ) : (
                <span className="badge-success">In Stock</span>
              )}
              <span className="badge-info">{mockDiscount}% OFF</span>
            </div>

            {/* Quick Actions */}
            <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleWishlist}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 ${
                  isWishlisted 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <Link
                to={`/products/${product.id}`}
                className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-all duration-300 shadow-lg hover:scale-110"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          {/* Product Info */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-3">
              <Link to={`/products/${product.id}`}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {product.productName}
                </h3>
              </Link>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {product.description}
            </p>
            
            {/* Features */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1 text-green-500">
                <Truck className="h-4 w-4" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-500">
                <Shield className="h-4 w-4" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Warranty</span>
              </div>
              <div className="flex items-center space-x-1 text-yellow-500">
                <Award className="h-4 w-4" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Best Seller</span>
              </div>
            </div>
            
            {/* Rating and Reviews */}
            <div className="flex items-center mb-4">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`rating-star ${i < Math.floor(mockRating) ? 'rating-star-filled' : 'rating-star-empty'}`} />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {mockRating} ({mockReviews} reviews)
              </span>
            </div>
            
            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="price-current">${product.price}</span>
                  <span className="price-original ml-2">${originalPrice.toFixed(2)}</span>
                </div>
                <span className="price-discount">Save ${(originalPrice - product.price).toFixed(2)}</span>
              </div>
              
              {user?.role === 'customer' && product.status === 'available' ? (
                <button
                  onClick={handleAddToCart}
                  className="btn-primary flex items-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              ) : (
                <Link
                  to={`/products/${product.id}`}
                  className="btn-secondary"
                >
                  View Details
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-product group">
      
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <Link to={`/products/${product.id}`}>
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton"></div>
          )}
          <img
            src={product.imageUrls[0]}
            alt={product.productName}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex space-x-3">
            <Link
              to={`/products/${product.id}`}
              className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-lg transform hover:scale-110"
            >
              <Eye className="h-5 w-5 text-gray-700 dark:text-gray-300 hover:text-blue-500" />
            </Link>
            <button
              onClick={handleWishlist}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform hover:scale-110 ${
                isWishlisted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {product.status === 'out_of_stock' && (
            <span className="badge-error">Out of Stock</span>
          )}
          {product.stockQuantity < 10 && product.status === 'available' && (
            <span className="badge-warning">Low Stock</span>
          )}
          {mockDiscount > 0 && (
            <span className="badge-info">{mockDiscount}% OFF</span>
          )}
        </div>

        {/* New Badge */}
        <div className="absolute top-3 right-3">
          <span className="badge-success flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            New
          </span>
        </div>

        {/* Quick Add to Cart */}
        {user?.role === 'customer' && product.status === 'available' && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full btn-primary flex items-center justify-center space-x-2 shadow-2xl"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Quick Add</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4 lg:p-6">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {product.productName}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {product.description}
        </p>
        
        {/* Features */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-3 w-3 text-green-500" />
            <Shield className="h-3 w-3 text-blue-500" />
            <Award className="h-3 w-3 text-yellow-500" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {product.stockQuantity} left
          </span>
        </div>
        
        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="rating-stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`rating-star ${i < Math.floor(mockRating) ? 'rating-star-filled' : 'rating-star-empty'}`} />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({mockReviews})</span>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="price-current text-xl">${product.price}</span>
            <span className="price-original ml-2">${originalPrice.toFixed(2)}</span>
          </div>
          <span className="price-discount">-{mockDiscount}%</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          {user?.role === 'customer' && product.status === 'available' ? (
            <>
              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary text-center flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Add</span>
              </button>
              <Link
                to={`/products/${product.id}`}
                className="px-4 py-3 glass border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <Link
              to={`/products/${product.id}`}
              className="w-full btn-primary text-center"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;