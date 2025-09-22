export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer' | 'shop_owner' | 'delivery_boy';
  phoneNumber?: string;
  address?: string;
  vehicleType?: string; // For delivery boys
  licenseNumber?: string; // For delivery boys
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  shopName: string;
  description: string;
  address: string;
  contactInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  imageUrl?: string;
  imageFile?: File;
  openingHours?: string;
  deliveryRadius?: number;
  location?: {
    coordinates?: { lat: number; lng: number };
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    formattedAddress?: string;
    placeId?: string;
    lastUpdated?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  addedBy?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId: string;
  productName: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrls: string[];
  imageFiles?: File[];
  status: 'available' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  shopId: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryBoyId?: string;
  deliveryStatus?: 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'failed';
  deliveryNotes?: string;
  items: OrderItem[];
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

// Location-related types (scaffold)
export type LatLng = { lat: number; lng: number };

export interface PlaceSuggestion {
  description: string;
  placeId: string;
}

export interface GeocodingResultType {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
}