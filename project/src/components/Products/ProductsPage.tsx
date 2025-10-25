import React, { useState, useEffect } from 'react';
import { Search, Grid, List, SlidersHorizontal, ArrowUpDown, Filter, X, ChevronDown, Star, Heart, Eye } from 'lucide-react';
import { Product, Category } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

import ProductCard from './ProductCard';
import Sidebar from '../Layout/Sidebar';

const ProductsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    (async () => {
      try {
        const [prods, cats] = await Promise.all([
          apiService.getProducts({ limit: 200 }),
          apiService.getCategories(),
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
        const mappedCategories: Category[] = cats.map((c: any) => ({
          id: c._id,
          name: c.name,
          description: c.description,
          isBuiltIn: !!c.isBuiltIn,
          createdAt: c.createdAt,
        }));
        setProducts(mappedProducts);
        setCategories(mappedCategories);
        setFilteredProducts(mappedProducts);
        
        // Save products to localStorage for cart operations
        localStorage.setItem('products', JSON.stringify(mappedProducts));
      } catch (e) {
        console.error('Failed to load products page data', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by categories
    if (filters.categories?.length > 0) {
      filtered = filtered.filter(product => filters.categories.includes(product.categoryId));
    }

    // Filter by price range
    if (filters.priceRange) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      );
    }

    // Filter by rating (mock implementation)
    if (filters.minRating) {
      filtered = filtered.filter(() => Math.random() > 0.3);
    }

    // Filter by availability
    if (filters.availability?.length > 0) {
      filtered = filtered.filter(product => {
        if (filters.availability.includes('in_stock')) return product.status === 'available' && product.stockQuantity > 10;
        if (filters.availability.includes('low_stock')) return product.status === 'available' && product.stockQuantity <= 10;
        if (filters.availability.includes('out_of_stock')) return product.status === 'out_of_stock';
        return true;
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating':
          return Math.random() - 0.5;
        case 'popularity':
          return Math.random() - 0.5;
        case 'name':
        default:
          return a.productName.localeCompare(b.productName);
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, sortBy, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
  };



  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, Math.min(endIndex, visibleCount));

  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popularity', label: 'Most Popular' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        
        {/* Desktop Sidebar */}
        <div className={`hidden lg:block transition-all duration-300 ${showSidebar ? 'w-80' : 'w-0'}`}>
          {showSidebar && (
            <Sidebar
              type="products"
              categories={categories}
              onFilterChange={handleFilterChange}
              filters={filters}
            />
          )}
        </div>

        {/* Mobile Sidebar Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-full">
              <Sidebar
                type="products"
                categories={categories}
                onFilterChange={handleFilterChange}
                filters={filters}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto mobile-padding py-8">
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="mobile-heading font-bold text-gray-900 dark:text-gray-100 mb-2">
                    All Products
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Discover amazing products from local shops
                  </p>
                </div>
              </div>

              {/* Search and Controls Bar */}
              <div className="glass rounded-3xl shadow-xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row gap-4">
                  
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products, brands, categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-search"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="input-modern pl-12 pr-8 py-3 appearance-none cursor-pointer min-w-[200px]"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ArrowUpDown className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex glass rounded-2xl p-1 border border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          viewMode === 'grid'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Grid className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          viewMode === 'list'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <List className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Filter Toggles */}
                    <button
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="hidden lg:flex p-3 glass rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <SlidersHorizontal className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => setShowMobileFilters(true)}
                      className="lg:hidden p-3 glass rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <Filter className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(Object.keys(filters).length > 0 || searchTerm) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active filters:</span>
                
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-2 hover:text-blue-600 dark:hover:text-blue-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filters.categories?.map((categoryId: string) => {
                  const category = categories.find(c => c.id === categoryId);
                  return category ? (
                    <span
                      key={categoryId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    >
                      {category.name}
                      <button
                        onClick={() => {
                          const newCategories = filters.categories.filter((id: string) => id !== categoryId);
                          handleFilterChange({ ...filters, categories: newCategories });
                        }}
                        className="ml-2 hover:text-green-600 dark:hover:text-green-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}

                {filters.priceRange && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                    <button
                      onClick={() => handleFilterChange({ ...filters, priceRange: null })}
                      className="ml-2 hover:text-purple-600 dark:hover:text-purple-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Showing <span className="font-bold text-blue-600 dark:text-blue-400">{startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
                  <span className="font-bold">{filteredProducts.length}</span> products
                </p>
              </div>
            </div>

            {/* Products Grid/List */}
            {currentProducts.length > 0 ? (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? "product-grid" 
                    : "space-y-6"
                }>
                  {currentProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Load More */}
                {visibleCount < filteredProducts.length && (
                  <div className="mt-8 flex items-center justify-center">
                    <button
                      onClick={() => setVisibleCount(c => Math.min(c + 12, filteredProducts.length))}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                      Load more products
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 glass rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-xl transition-colors ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'glass border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 glass rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 rounded-full glass flex items-center justify-center">
                  <Search className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  No products found
                </h3>
                <p className="text-xl mb-8 max-w-md mx-auto text-gray-600 dark:text-gray-400">
                  We couldn't find any products matching your criteria. Try adjusting your search or filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="btn-primary"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;