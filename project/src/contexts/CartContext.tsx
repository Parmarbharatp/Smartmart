import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { apiService } from '../services/api';

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  getCartTotal: () => number;
  validateCartItems: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = async (productId: string, quantity: number) => {
    try {
      console.log('🛒 Adding to cart:', { productId, quantity });
      
      // Get product info from localStorage first
      let products = JSON.parse(localStorage.getItem('products') || '[]');
      let product = products.find((p: any) => p.id === productId);
      
      // If product not found in localStorage, try to fetch from API
      if (!product) {
        console.log('📦 Product not in localStorage, fetching from API...');
        try {
          const apiProduct = await apiService.getProductById(productId);
          if (apiProduct) {
            product = {
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
            products.push(product);
            localStorage.setItem('products', JSON.stringify(products));
            console.log('✅ Product saved to localStorage');
          }
        } catch (apiError) {
          console.error('❌ Failed to fetch product from API:', apiError);
        }
      }
      
      console.log('📦 Found product:', product ? product.productName : 'Not found');
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status !== 'available') {
        throw new Error('Product is not available');
      }

      // Check current cart quantity
      const existingItem = items.find(item => item.productId === productId);
      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      console.log('📊 Stock check:', { 
        currentStock: product.stockQuantity, 
        requestedQuantity: newQuantity,
        existingQuantity: existingItem?.quantity || 0
      });
      
      // Check if new quantity exceeds stock
      if (newQuantity > product.stockQuantity) {
        throw new Error(`Only ${product.stockQuantity} items available in stock`);
      }

      // If stock check passes, update the cart
      setItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === productId);
        
        console.log('🔄 Updating cart:', { 
          existingItem: !!existingItem, 
          newQuantity,
          totalItems: prevItems.length + (existingItem ? 0 : 1)
        });
        
        if (existingItem) {
          return prevItems.map(item =>
            item.productId === productId
              ? { ...item, quantity: newQuantity }
              : item
          );
        } else {
          return [...prevItems, { productId, quantity }];
        }
      });
    } catch (error) {
      // Show error message to user
      console.error('❌ Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      // Get product info from localStorage
      let products = JSON.parse(localStorage.getItem('products') || '[]');
      let product = products.find((p: any) => p.id === productId);
      
      // If product not found in localStorage, try to fetch from API
      if (!product) {
        try {
          const apiProduct = await apiService.getProductById(productId);
          if (apiProduct) {
            product = {
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
            products.push(product);
            localStorage.setItem('products', JSON.stringify(products));
          }
        } catch (apiError) {
          console.error('Failed to fetch product from API:', apiError);
        }
      }
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status !== 'available') {
        throw new Error('Product is not available');
      }

      // Check if quantity exceeds stock
      if (quantity > product.stockQuantity) {
        throw new Error(`Only ${product.stockQuantity} items available in stock`);
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const getCartTotal = () => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    return items.reduce((total, item) => {
      const product = products.find((p: any) => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const validateCartItems = React.useCallback(async () => {
    setItems(currentItems => {
      const validItems: CartItem[] = [];
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      
      for (const item of currentItems) {
        try {
          const product = products.find((p: any) => p.id === item.productId);
          if (product && product.status === 'available' && product.stockQuantity >= item.quantity) {
            validItems.push(item);
          } else if (product && product.stockQuantity > 0) {
            // Adjust quantity to available stock
            validItems.push({ ...item, quantity: product.stockQuantity });
          }
          // If product is unavailable or out of stock, skip it
        } catch (error) {
          console.error(`Error validating product ${item.productId}:`, error);
          // Skip invalid products
        }
      }
      
      return validItems;
    });
  }, []); // No dependencies - function is stable

  // Ensure cart has product snapshots for rendering even when not preloaded in localStorage
  useEffect(() => {
    (async () => {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const missing = items.filter(i => !products.some((p: any) => p.id === i.productId));
      if (missing.length > 0) {
        const fetched: any[] = [];
        for (const m of missing) {
          try {
            const prod = await apiService.getProductById(m.productId);
            if (prod) {
              fetched.push({
                id: prod._id,
                shopId: String(prod.shopId),
                categoryId: String(prod.categoryId),
                productName: prod.productName,
                description: prod.description,
                price: prod.price,
                stockQuantity: prod.stockQuantity,
                imageUrls: prod.imageUrls ?? [],
                status: prod.status,
                createdAt: prod.createdAt,
                updatedAt: prod.updatedAt,
              });
            }
          } catch {}
        }
        if (fetched.length > 0) {
          localStorage.setItem('products', JSON.stringify([...products, ...fetched]));
        }
      }
    })();
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      validateCartItems
    }}>
      {children}
    </CartContext.Provider>
  );
};