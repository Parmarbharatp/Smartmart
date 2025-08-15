import { User, Shop, Category, Product, Order, Review } from '../types';

export const initializeMockData = () => {
  // Remove all demo users from the users array
  if (!localStorage.getItem('users')) {
    const users: (User & { password: string })[] = [
      {
        id: '1',
        email: 'admin@marketplace.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        password: 'admin123'
      }
    ];
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Initialize categories
  if (!localStorage.getItem('categories')) {
    const categories: Category[] = [
      {
        id: '1',
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        isBuiltIn: true,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        name: 'Fashion',
        description: 'Clothing and accessories',
        isBuiltIn: true,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '3',
        name: 'Home & Garden',
        description: 'Home improvement and garden supplies',
        isBuiltIn: true,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '4',
        name: 'Food & Beverages',
        description: 'Food products and beverages',
        isBuiltIn: true,
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ];
    localStorage.setItem('categories', JSON.stringify(categories));
  }

  // Initialize shops
  if (!localStorage.getItem('shops')) {
    const shops: Shop[] = [
      {
        id: '1',
        ownerId: '3',
        shopName: 'Tech Hub',
        description: 'Your one-stop shop for all electronic needs',
        address: '456 Tech Street, Digital City, DC 67890',
        contactInfo: 'contact@techhub.com',
        status: 'approved',
        imageUrl: 'https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg?auto=compress&cs=tinysrgb&w=500',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ];
    localStorage.setItem('shops', JSON.stringify(shops));
  }

  // Initialize products
  if (!localStorage.getItem('products')) {
    const products: Product[] = [
      {
        id: '1',
        shopId: '1',
        categoryId: '1',
        productName: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and long battery life. Perfect for music lovers and professionals.',
        price: 99.99,
        stockQuantity: 50,
        imageUrls: ['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500'],
        status: 'available',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        shopId: '1',
        categoryId: '1',
        productName: 'Smartphone Case',
        description: 'Durable smartphone case with military-grade protection. Available in multiple colors.',
        price: 24.99,
        stockQuantity: 100,
        imageUrls: ['https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg?auto=compress&cs=tinysrgb&w=500'],
        status: 'available',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ];
    localStorage.setItem('products', JSON.stringify(products));
  }

  // Initialize orders
  if (!localStorage.getItem('orders')) {
    localStorage.setItem('orders', JSON.stringify([]));
  }

  // Initialize reviews
  if (!localStorage.getItem('reviews')) {
    const reviews: Review[] = [
      {
        id: '1',
        productId: '1',
        customerId: '2',
        rating: 5,
        comment: 'Excellent headphones! Great sound quality and battery life.',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ];
    localStorage.setItem('reviews', JSON.stringify(reviews));
  }
};