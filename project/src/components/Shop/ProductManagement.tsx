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
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-square bg-gray-200">
              <img
                src={product.imageUrls[0]}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
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
        ))}
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
    imageUrls: product?.imageUrls || [''],
    status: product?.status || 'available' as 'available' | 'out_of_stock'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: Product = {
      id: product?.id || Date.now().toString(),
      shopId: shop.id,
      categoryId: formData.categoryId,
      productName: formData.productName,
      description: formData.description,
      price: formData.price,
      stockQuantity: formData.stockQuantity,
      imageUrls: formData.imageUrls.filter(url => url.trim() !== ''),
      status: formData.status,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSubmit(productData);
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData({ ...formData, imageUrls: newUrls });
  };

  const addImageUrl = () => {
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] });
  };

  const removeImageUrl = (index: number) => {
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newUrls });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        {product ? 'Edit Product' : 'Add New Product'}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            required
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="categoryId"
            required
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* AI Assistant */}
        <AIAssistant
          productName={formData.productName}
          features={[]}
          onDescriptionGenerated={(description) => 
            setFormData({ ...formData, description })
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              id="stockQuantity"
              required
              min="0"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>
          {formData.imageUrls.map((url, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                placeholder="Enter image URL"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageUrl(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageUrl}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            + Add another image
          </button>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'out_of_stock' })}
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