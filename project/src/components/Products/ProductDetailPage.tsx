import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Share2, Package, Truck, Shield, ArrowLeft } from 'lucide-react';
import { Product, Shop, Review, User } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (productId) {
      const loadProduct = async () => {
        try {
          // First try to find in localStorage
          const products = JSON.parse(localStorage.getItem('products') || '[]');
          let foundProduct = products.find((p: Product) => p.id === productId);
          
          // If not found, fetch from API
          if (!foundProduct) {
            const apiProduct = await apiService.getProductById(productId);
            if (apiProduct) {
              foundProduct = {
                id: apiProduct._id,
                shopId: String(apiProduct.shopId),
                categoryId: String(apiProduct.categoryId),
                productName: apiProduct.productName,
                description: apiProduct.description,
                price: apiProduct.price,
                stockQuantity: apiProduct.stockQuantity,
                imageUrls: apiProduct.imageUrls ?? [],
                status: apiProduct.status === 'out_of_stock' ? 'out_of_stock' : 'available',
                createdAt: apiProduct.createdAt,
                updatedAt: apiProduct.updatedAt,
              };
              
              // Save to localStorage
              localStorage.setItem('products', JSON.stringify([...products, foundProduct]));
            }
          }
          
          setProduct(foundProduct || null);

          if (foundProduct) {
            const shops = JSON.parse(localStorage.getItem('shops') || '[]');
            const productShop = shops.find((s: Shop) => s.id === foundProduct.shopId);
            setShop(productShop || null);

            const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
            const productReviews = allReviews.filter((r: Review) => r.productId === productId);
            setReviews(productReviews);

            const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
            setUsers(allUsers);
          }
        } catch (error) {
          console.error('Error loading product:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadProduct();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (product && user?.role === 'customer') {
      try {
        await addToCart(product.id, quantity);
        // Show success message
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to add to cart');
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 3000);
      }
    }
  };

  const handleBuyNow = async () => {
    if (product && user?.role === 'customer') {
      try {
        await addToCart(product.id, quantity);
        navigate('/cart');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to add to cart');
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 3000);
      }
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'customer' || !product) return;

    const review: Review = {
      id: Date.now().toString(),
      productId: product.id,
      customerId: user.id,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: new Date().toISOString()
    };

    const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    allReviews.push(review);
    localStorage.setItem('reviews', JSON.stringify(allReviews));
    
    setReviews([...reviews, review]);
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse All Products
          </button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Error Notification */}
        {showErrorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
              <img
                src={product.imageUrls[selectedImage]}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            </div>
            {product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt={`${product.productName} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.productName}</h1>
              
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

              <div className="text-3xl font-bold text-blue-600 mb-6">
                ₹{product.price.toFixed(2)}
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Shop Info */}
              {shop && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Sold by</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-600">{shop.shopName}</p>
                      <p className="text-sm text-gray-600">{shop.address}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/shops/${shop.id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Visit Shop
                    </button>
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Package className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {product.stockQuantity > 0 
                      ? `${product.stockQuantity} items in stock`
                      : 'Out of stock'
                    }
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  <Truck className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Free shipping on orders over ₹500</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">30-day return policy</span>
                </div>
              </div>

              {/* Quantity and Actions */}
              {user?.role === 'customer' && product.status === 'available' && product.stockQuantity > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(Math.min(10, product.stockQuantity))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    {product.stockQuantity < 10 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Only {product.stockQuantity} available
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>

                  <div className="flex space-x-4">
                    <button className="flex items-center text-gray-600 hover:text-red-600 transition-colors">
                      <Heart className="h-5 w-5 mr-2" />
                      Add to Wishlist
                    </button>
                    <button className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                      <Share2 className="h-5 w-5 mr-2" />
                      Share
                    </button>
                  </div>
                </div>
              )}

              {product.status === 'out_of_stock' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 font-medium">This product is currently out of stock.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            {user?.role === 'customer' && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating })}
                        className={`h-8 w-8 ${
                          rating <= newReview.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      >
                        <Star className="h-full w-full" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your experience with this product..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.map((review) => {
              const reviewer = users.find(u => u.id === review.customerId);
              return (
                <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{reviewer?.name || 'Anonymous'}</h4>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              );
            })}
          </div>

          {reviews.length === 0 && (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;