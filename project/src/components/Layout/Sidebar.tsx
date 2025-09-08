import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Filter, Star, DollarSign, Package, Truck, Shield, Award } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  type: 'products' | 'shops';
  categories: any[];
  onFilterChange: (filters: any) => void;
  filters: any;
}

const Sidebar: React.FC<SidebarProps> = ({ type, categories, onFilterChange, filters }) => {
  const { isDarkMode } = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'price', 'rating']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleCategoryChange = (categoryId: string) => {
    const newCategories = filters.categories?.includes(categoryId)
      ? filters.categories.filter((id: string) => id !== categoryId)
      : [...(filters.categories || []), categoryId];
    
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePriceChange = (min: number, max: number) => {
    onFilterChange({ ...filters, priceRange: [min, max] });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ ...filters, minRating: rating });
  };

  const handleFeatureChange = (feature: string) => {
    const newFeatures = filters.features?.includes(feature)
      ? filters.features.filter((f: string) => f !== feature)
      : [...(filters.features || []), feature];
    
    onFilterChange({ ...filters, features: newFeatures });
  };

  const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; section: string }> = ({ title, icon, section }) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
        isDarkMode 
          ? 'hover:bg-gray-700 text-gray-200' 
          : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      {expandedSections.includes(section) ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className={`w-80 h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Filters
          </h2>
        </div>

        <div className="space-y-4">
          {/* Categories */}
          <div>
            <SectionHeader 
              title="Categories" 
              icon={<Package className="h-4 w-4" />} 
              section="categories" 
            />
            {expandedSections.includes('categories') && (
              <div className="mt-3 space-y-2 pl-4">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category.id) || false}
                      onChange={() => handleCategoryChange(category.id)}
                      className={`rounded border-2 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-blue-500' 
                          : 'border-gray-300 text-blue-600'
                      } focus:ring-blue-500`}
                    />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div>
            <SectionHeader 
              title="Price Range" 
              icon={<DollarSign className="h-4 w-4" />} 
              section="price" 
            />
            {expandedSections.includes('price') && (
              <div className="mt-3 space-y-3 pl-4">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange?.[0] || ''}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0, filters.priceRange?.[1] || 1000)}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange?.[1] || ''}
                    onChange={(e) => handlePriceChange(filters.priceRange?.[0] || 0, parseInt(e.target.value) || 1000)}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Under $25', min: 0, max: 25 },
                    { label: '$25 - $50', min: 25, max: 50 },
                    { label: '$50 - $100', min: 50, max: 100 },
                    { label: '$100 - $200', min: 100, max: 200 },
                    { label: 'Over $200', min: 200, max: 10000 }
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceChange(range.min, range.max)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        filters.priceRange?.[0] === range.min && filters.priceRange?.[1] === range.max
                          ? isDarkMode 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-100 text-blue-800'
                          : isDarkMode 
                            ? 'hover:bg-gray-700 text-gray-300' 
                            : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <SectionHeader 
              title="Customer Rating" 
              icon={<Star className="h-4 w-4" />} 
              section="rating" 
            />
            {expandedSections.includes('rating') && (
              <div className="mt-3 space-y-2 pl-4">
                {[4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      filters.minRating === rating
                        ? isDarkMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 text-blue-800'
                        : isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span>& Up</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {type === 'products' && (
            <>
              {/* Availability */}
              <div>
                <SectionHeader 
                  title="Availability" 
                  icon={<Package className="h-4 w-4" />} 
                  section="availability" 
                />
                {expandedSections.includes('availability') && (
                  <div className="mt-3 space-y-2 pl-4">
                    {[
                      { label: 'In Stock', value: 'in_stock' },
                      { label: 'Out of Stock', value: 'out_of_stock' },
                      { label: 'Low Stock', value: 'low_stock' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.availability?.includes(option.value) || false}
                          onChange={() => handleFeatureChange(option.value)}
                          className={`rounded border-2 ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-700 text-blue-500' 
                              : 'border-gray-300 text-blue-600'
                          } focus:ring-blue-500`}
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <SectionHeader 
                  title="Features" 
                  icon={<Award className="h-4 w-4" />} 
                  section="features" 
                />
                {expandedSections.includes('features') && (
                  <div className="mt-3 space-y-2 pl-4">
                    {[
                      { label: 'Free Shipping', value: 'free_shipping', icon: <Truck className="h-3 w-3" /> },
                      { label: 'Fast Delivery', value: 'fast_delivery', icon: <Truck className="h-3 w-3" /> },
                      { label: 'Warranty', value: 'warranty', icon: <Shield className="h-3 w-3" /> },
                      { label: 'Best Seller', value: 'best_seller', icon: <Award className="h-3 w-3" /> }
                    ].map((feature) => (
                      <label key={feature.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.features?.includes(feature.value) || false}
                          onChange={() => handleFeatureChange(feature.value)}
                          className={`rounded border-2 ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-700 text-blue-500' 
                              : 'border-gray-300 text-blue-600'
                          } focus:ring-blue-500`}
                        />
                        <div className="flex items-center space-x-1">
                          {feature.icon}
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {feature.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {type === 'shops' && (
            <>
              {/* Shop Features */}
              <div>
                <SectionHeader 
                  title="Shop Features" 
                  icon={<Award className="h-4 w-4" />} 
                  section="shop_features" 
                />
                {expandedSections.includes('shop_features') && (
                  <div className="mt-3 space-y-2 pl-4">
                    {[
                      { label: 'Verified Seller', value: 'verified' },
                      { label: 'Top Rated', value: 'top_rated' },
                      { label: 'Fast Shipping', value: 'fast_shipping' },
                      { label: 'Premium Support', value: 'premium_support' }
                    ].map((feature) => (
                      <label key={feature.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.shopFeatures?.includes(feature.value) || false}
                          onChange={() => handleFeatureChange(feature.value)}
                          className={`rounded border-2 ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-700 text-blue-500' 
                              : 'border-gray-300 text-blue-600'
                          } focus:ring-blue-500`}
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feature.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => onFilterChange({})}
          className={`w-full mt-6 px-4 py-2 text-sm font-medium rounded-lg border-2 border-dashed transition-colors ${
            isDarkMode 
              ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default Sidebar;