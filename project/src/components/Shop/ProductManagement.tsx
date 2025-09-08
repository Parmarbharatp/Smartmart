import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Product, Shop, Category } from '../../types';
import AIAssistant from '../AI/AIAssistant';

interface ProductManagementProps {
  shop: Shop;
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ shop, products, onProductsUpdated }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAddProduct = () => {
    setShowAddForm(true);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedProducts = allProducts.filter((p: Product) => p.id !== productId);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      const shopProducts = updatedProducts.filter((p: Product) => p.shopId === shop.id);
      onProductsUpdated(shopProducts);
    }
  };

  const handleFormSubmit = (product: Product) => {
    const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
    let updatedProducts;
    
    if (editingProduct) {
      updatedProducts = allProducts.map((p: Product) => p.id === product.id ? product : p);
    } else {
      updatedProducts = [...allProducts, product];
    }
    
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    const shopProducts = updatedProducts.filter((p: Product) => p.shopId === shop.id);
    onProductsUpdated(shopProducts);
    setShowAddForm(false);
    setEditingProduct(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {showAddForm && (
        <ProductForm
          shop={shop}
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowAddForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          console.log('Displaying product:', product);
          console.log('Product images:', product.imageUrls);
          return (
          <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-square bg-gray-200">
              {product.imageUrls && product.imageUrls.length > 0 && product.imageUrls[0] ? (
                <img
                  src={product.imageUrls[0]}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gray-100">
                          <div class="text-center text-gray-400">
                            <svg class="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                            </svg>
                            <p class="text-sm">Image Error</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-400">
                    <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">No Image</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-2">{product.productName}</h4>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-blue-600">${product.price}</span>
                <span className="text-sm text-gray-500">{product.stockQuantity} in stock</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {products.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first product to your shop.</p>
          <button
            onClick={handleAddProduct}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Product
          </button>
        </div>
      )}
    </div>
  );
};

// Product Form Component
const ProductForm: React.FC<{
  shop: Shop;
  product?: Product | null;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}> = ({ shop, product, onSubmit, onCancel }) => {
  const [categories] = useState<Category[]>(JSON.parse(localStorage.getItem('categories') || '[]'));
  const [formData, setFormData] = useState({
    productName: product?.productName || '',
    description: product?.description || '',
    price: product?.price || 0,
    stockQuantity: product?.stockQuantity || 0,
    categoryId: product?.categoryId || '',
    imageFiles: [] as File[],
    status: product?.status || 'available' as 'available' | 'out_of_stock'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Product name validation
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    } else if (formData.productName.trim().length < 3) {
      newErrors.productName = 'Product name must be at least 3 characters long';
    } else if (formData.productName.trim().length > 100) {
      newErrors.productName = 'Product name must be less than 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Price validation
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    // Stock validation
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }

    // Category validation
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    // Image validation
    if (formData.imageFiles.length === 0) {
      newErrors.imageFiles = 'At least one product image is required';
    } else {
      formData.imageFiles.forEach((file, index) => {
        if (file) {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          const maxSize = 5 * 1024 * 1024; // 5MB

          if (!allowedTypes.includes(file.type)) {
            newErrors.imageFiles = `Image ${index + 1} must be a valid image file (JPEG, PNG, or WebP)`;
          } else if (file.size > maxSize) {
            newErrors.imageFiles = `Image ${index + 1} file size must be less than 5MB`;
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFiles = [...formData.imageFiles];
      newFiles[index] = file;
      setFormData({ ...formData, imageFiles: newFiles });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPreviews = [...imagePreviews];
        newPreviews[index] = e.target?.result as string;
        setImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous image errors
      if (errors.imageFiles) {
        setErrors({ ...errors, imageFiles: '' });
      }
    }
  };

  const addImageFile = () => {
    setFormData({ ...formData, imageFiles: [...formData.imageFiles, null as any] });
    setImagePreviews([...imagePreviews, '']);
  };

  const removeImageFile = (index: number) => {
    const newFiles = formData.imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, imageFiles: newFiles });
    setImagePreviews(newPreviews);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert image files to base64 URLs for storage (in a real app, you'd upload to a server)
    let imageUrls: string[] = [];
    
    // Check if we have new image files uploaded
    const hasNewImages = formData.imageFiles.some(file => file !== null);
    
    if (hasNewImages) {
      // Process all image files synchronously
      for (const file of formData.imageFiles) {
        if (file) {
          try {
            const base64Url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            imageUrls.push(base64Url);
          } catch (error) {
            console.error('Error converting image to base64:', error);
          }
        }
      }
    } else if (product && product.imageUrls) {
      // If no new images uploaded, keep existing ones
      imageUrls = [...product.imageUrls];
    }

    const productData: Product = {
      id: product?.id || Date.now().toString(),
      shopId: shop.id,
      categoryId: formData.categoryId,
      productName: formData.productName.trim(),
      description: formData.description.trim(),
      price: formData.price,
      stockQuantity: formData.stockQuantity,
      imageUrls: imageUrls,
      imageFiles: formData.imageFiles,
      status: formData.status,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Product data being submitted:', productData);
    console.log('Image URLs:', imageUrls);
    console.log('Has new images:', hasNewImages);
    console.log('Form image files:', formData.imageFiles);

    onSubmit(productData);
  };

  // Initialize with at least one image file input and existing images if editing
  React.useEffect(() => {
    if (product && product.imageUrls && product.imageUrls.length > 0) {
      // If editing, initialize with existing image URLs as previews
      setImagePreviews(product.imageUrls);
      setFormData(prev => ({ ...prev, imageFiles: new Array(product.imageUrls.length).fill(null) }));
    } else if (formData.imageFiles.length === 0) {
      // If adding new product, initialize with one empty image input
      setFormData(prev => ({ ...prev, imageFiles: [null as any] }));
      setImagePreviews(['']);
    }
  }, [product]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        {product ? 'Edit Product' : 'Add New Product'}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            id="productName"
            required
            value={formData.productName}
            onChange={(e) => handleInputChange('productName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.productName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
          />
          {errors.productName && (
            <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="categoryId"
            required
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.categoryId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your product features and benefits"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* AI Assistant */}
        <AIAssistant
          productName={formData.productName}
          features={[]}
          onDescriptionGenerated={(description) => 
            handleInputChange('description', description)
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              id="price"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stockQuantity"
              required
              min="0"
              value={formData.stockQuantity}
              onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.stockQuantity && (
              <p className="mt-1 text-sm text-red-600">{errors.stockQuantity}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images *
          </label>
          <div className="space-y-3">
            {formData.imageFiles.map((file, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleImageFileChange(e, index)}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.imageFiles ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formData.imageFiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageFile(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Image Preview */}
                {imagePreviews[index] && (
                  <div className="mt-2">
                    <img
                      src={imagePreviews[index]}
                      alt={`Product preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addImageFile}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add another image
            </button>
            
            {errors.imageFiles && (
              <p className="text-sm text-red-600">{errors.imageFiles}</p>
            )}
            
            <p className="text-xs text-gray-500">
              Accepted formats: JPEG, PNG, WebP. Maximum size: 5MB per image. At least one image is required.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as 'available' | 'out_of_stock')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="available">Available</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {product ? 'Update Product' : 'Add Product'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductManagement;