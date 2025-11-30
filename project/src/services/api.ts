// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Response Types
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: any[];
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'customer' | 'shop_owner' | 'delivery_boy';
    phoneNumber?: string;
    address?: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
    location?: GeoPoint;
    locationDetails?: LocationDetails;
  };
  token: string;
}

// GeoJSON Point
interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

interface LocationDetails {
  address: string;
  houseNumber?: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
  placeId?: string;
  lastUpdated?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'shop_owner' | 'delivery_boy';
  phoneNumber?: string;
  address?: string;
  profilePicture?: string;
  location?: GeoPoint;
  locationDetails?: LocationDetails;
  createdAt: string;
  updatedAt: string;
}

interface LocationData {
  coordinates: { lat: number; lng: number };
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
  placeId?: string;
}

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Get authentication headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: this.getAuthHeaders(),
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        // Attach common API error metadata if available for better UI surfacing
        (error as any).status = response.status;
        (error as any).errors = data.errors || data.data?.errors || null;
        (error as any).field = data.field;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication Methods
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'shop_owner' | 'delivery_boy';
    phoneNumber?: string;
    address?: string;
    vehicleType?: string;
    licenseNumber?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async googleAuth(googleUser: { email: string; name: string; picture?: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleUser),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>('/auth/me');
    // backend returns { data: { user } }
    return (response as any).data!.user ?? (response as any).data!;
  }

  async updateProfile(updates: Partial<Pick<User, 'name' | 'phoneNumber' | 'address'>>): Promise<User> {
    const response = await this.request<User>('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async checkEmail(email: string): Promise<{ exists: boolean; message: string }> {
    const response = await this.request<{ exists: boolean; message: string }>('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response.data!;
  }

  // Password reset: request reset link
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return { message: response.message };
  }

  // Password reset via OTP: submit new password
  async resetPassword(params: { email: string; otp: string; password: string }): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return { message: response.message };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get stored token
  getToken(): string | null {
    return this.token;
  }

  // Check if token is expired (basic check)
  isTokenExpired(): boolean {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isTokenExpired()) {
      this.clearToken();
      return false;
    }
    return true;
  }

  // ============ Shops ============
  async createShop(payload: {
    shopName: string;
    description: string;
    address: string;
    contactInfo: string;
    imageUrl?: string;
  }): Promise<any> {
    const response = await this.request<any>('/shops', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async getMyShop(): Promise<any | null> {
    const res = await this.request<any>('/shops/owner/my-shop');
    return res.data?.shop ?? null;
  }

  // ============ Products ============
  async getShopProducts(params: { shopId: string; page?: number; limit?: number }): Promise<any[]> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 50),
    });
    const res = await this.request<any>(`/products/shop/${params.shopId}?${query.toString()}`);
    return res.data?.products ?? [];
  }
  async getProductById(productId: string): Promise<any | null> {
    const res = await this.request<any>(`/products/${productId}`);
    return res.data?.product ?? null;
  }

  // ============ Orders ============
  async createOrder(payload: {
    shopId: string;
    shippingAddress: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod?: string;
    notes?: string;
  }): Promise<any> {
    const res = await this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data?.order;
  }

  async getShopOwnerOrders(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ orders: any[]; total: number }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    const res = await this.request<any>(`/orders${q.toString() ? `?${q.toString()}` : ''}`);
    return { orders: res.data?.orders ?? [], total: res.data?.pagination?.total ?? 0 };
  }

  async getOrderStatsSummary(params: { dateFrom?: string; dateTo?: string; shopId?: string } = {}): Promise<any> {
    const q = new URLSearchParams();
    if (params.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params.dateTo) q.set('dateTo', params.dateTo);
    if (params.shopId) q.set('shopId', params.shopId);
    const res = await this.request<any>(`/orders/stats/summary${q.toString() ? `?${q.toString()}` : ''}`);
    return res.data?.stats ?? null;
  }

  async getOrderTimeSeries(params: { period?: 'week' | 'month' | 'year'; dateFrom?: string; dateTo?: string; shopId?: string } = {}): Promise<{ series: any[]; period: string } | null> {
    const q = new URLSearchParams();
    if (params.period) q.set('period', params.period);
    if (params.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params.dateTo) q.set('dateTo', params.dateTo);
    if (params.shopId) q.set('shopId', params.shopId);
    const res = await this.request<any>(`/orders/stats/timeseries${q.toString() ? `?${q.toString()}` : ''}`);
    return res.data ?? null;
  }

  async getMyOrders(params: { page?: number; limit?: number; status?: string } = {}): Promise<{ orders: any[]; total: number }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    const res = await this.request<any>(`/orders${q.toString() ? `?${q.toString()}` : ''}`);
    return { orders: res.data?.orders ?? [], total: res.data?.pagination?.total ?? 0 };
  }

  // ============ Delivery Boy APIs ============
  async getAvailableOrders(params: { page?: number; limit?: number } = {}): Promise<{ orders: any[]; total: number }> {
    try {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.limit) q.set('limit', String(params.limit));
      const res = await this.request<any>(`/orders/available-for-delivery${q.toString() ? `?${q.toString()}` : ''}`);
      console.log('🔍 API Response for available orders:', res);
      return { orders: res.data?.orders ?? [], total: res.data?.pagination?.total ?? 0 };
    } catch (e) {
      console.error('❌ Error fetching available orders:', e);
      // Treat backend errors as empty list so Delivery Dashboard doesn't break
      return { orders: [], total: 0 };
    }
  }

  async acceptDelivery(orderId: string): Promise<any> {
    const res = await this.request<any>(`/orders/${orderId}/accept-delivery`, {
      method: 'PUT',
    });
    return res.data?.order;
  }

  async updateDeliveryStatus(orderId: string, deliveryStatus: string, notes?: string): Promise<any> {
    const res = await this.request<any>(`/orders/${orderId}/update-delivery-status`, {
      method: 'PUT',
      body: JSON.stringify({ deliveryStatus, notes }),
    });
    return res.data?.order;
  }

  async makeOrderAvailableForDelivery(orderId: string): Promise<any> {
    const res = await this.request<any>(`/orders/${orderId}/make-available-for-delivery`, {
      method: 'PUT',
    });
    return res.data?.order;
  }

  async getOrderDetails(orderId: string): Promise<any> {
    const res = await this.request<any>(`/orders/${orderId}/details`, {
      method: 'GET',
    });
    return res.data;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: string, paymentId?: string): Promise<any> {
    const res = await this.request<any>(`/orders/${orderId}/update-payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus, paymentId }),
    });
    return res.data?.order;
  }

  // ============ Payments ============
  async createPaymentOrder(orderId: string, amount: number, currency: string = 'INR'): Promise<any> {
    const res = await this.request<any>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, currency }),
    });
    return res.data;
  }

  async verifyPayment(razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string, paymentId?: string): Promise<any> {
    const res = await this.request<any>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId }),
    });
    return res.data;
  }

  async getPayment(orderId: string): Promise<any> {
    const res = await this.request<any>(`/payments/${orderId}`);
    return res.data?.payment;
  }

  // ============ Wallets ============
  async getWalletBalance(): Promise<any> {
    const res = await this.request<any>('/wallets/balance');
    return res.data;
  }

  async getWalletTransactions(params: { page?: number; limit?: number; transactionType?: string; revenueType?: string; status?: string } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.transactionType) query.set('transactionType', params.transactionType);
    if (params.revenueType) query.set('revenueType', params.revenueType);
    if (params.status) query.set('status', params.status);
    const res = await this.request<any>(`/wallets/transactions${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  // ============ Payouts ============
  async requestPayout(payload: {
    amount: number;
    payoutMethod: 'upi' | 'bank_transfer' | 'wallet';
    upiId?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    bankIFSC?: string;
    bankName?: string;
  }): Promise<any> {
    const res = await this.request<any>('/payouts/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('Payout API response:', res);
    return res.data?.payout || res.data;
  }

  async getMyPayouts(params: { page?: number; limit?: number; status?: string } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const res = await this.request<any>(`/payouts/my-payouts${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  // Debug method to check all orders
  async getAllOrdersDebug(): Promise<any[]> {
    const res = await this.request<any>('/orders/debug/all');
    return res.data?.orders ?? [];
  }

  async createProduct(payload: {
    productName: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: string;
    imageUrls?: string[];
    brand?: string;
    tags?: string[];
  }): Promise<any> {
    const res = await this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data?.product;
  }

  async updateProduct(productId: string, updates: Partial<{
    productName: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: string;
    imageUrls: string[];
    brand: string;
    tags: string[];
  }>): Promise<any> {
    const res = await this.request<any>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data?.product;
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.request(`/products/${productId}`, { method: 'DELETE' });
  }

  // ============ Categories ============
  async getCategories(): Promise<any[]> {
    const res = await this.request<any>('/categories');
    return res.data?.categories ?? [];
  }
  async createCategory(payload: { name: string; description: string; imageUrl?: string }): Promise<any> {
    const res = await this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data?.category;
  }
  async deleteCategory(categoryId: string): Promise<void> {
    await this.request(`/categories/${categoryId}`, { method: 'DELETE' });
  }

  // ============ Listings for Home/Pages ============
  async getProducts(params: { page?: number; limit?: number; search?: string; categoryId?: string; shopId?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.shopId) query.set('shopId', params.shopId);
    const res = await this.request<any>(`/products${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data?.products ?? [];
  }

  async getShops(params: { status?: 'approved' | 'pending' | 'rejected'; page?: number; limit?: number; search?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search!);
    const res = await this.request<any>(`/shops${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data?.shops ?? [];
  }
  async updateShopStatus(shopId: string, status: 'approved' | 'rejected' | 'pending'): Promise<any> {
    const res = await this.request<any>(`/shops/${shopId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return res.data?.shop;
  }

  async adminListUsers(params: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    const res = await this.request<any>(`/auth/users${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data?.users ?? [];
  }

  // ============ Cart ============
  async checkStock(productId: string, quantity: number = 1): Promise<{
    available: boolean;
    stockQuantity: number;
    requestedQuantity: number;
    message: string;
  }> {
    const res = await this.request<any>('/cart/check-stock', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    return res.data;
  }

  // ============ Location ============
  async updateUserLocation(locationData: LocationData): Promise<{ location: GeoPoint; locationDetails: LocationDetails }>
  {
    const response = await this.request<{ location: GeoPoint; locationDetails: LocationDetails }>('/auth/update-location', {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
    return response.data!;
  }

  async getUserLocation(): Promise<{ location: GeoPoint; locationDetails: LocationDetails }>
  {
    const response = await this.request<{ location: GeoPoint; locationDetails: LocationDetails }>('/auth/location');
    return response.data!;
  }

  async updateShopLocation(shopId: string, locationData: LocationData): Promise<{ location: any }> {
    const response = await this.request<{ location: any }>(`/shops/${shopId}/update-location`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
    return response.data!;
  }

  async getShopLocation(shopId: string): Promise<{ shopName: string; location: any }> {
    const response = await this.request<{ shopName: string; location: any }>(`/shops/${shopId}/location`);
    return response.data!;
  }

  // ============ Location Tracking Preferences ============
  async updateLocationTrackingPreferences(preferences: {
    enabled: boolean;
    updateInterval: number;
    highAccuracy: boolean;
  }): Promise<{ locationTracking: any }> {
    const response = await this.request<{ locationTracking: any }>('/auth/location-tracking-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return response.data!;
  }

  async getLocationTrackingPreferences(): Promise<{ locationTracking: any }> {
    const response = await this.request<{ locationTracking: any }>('/auth/location-tracking-preferences');
    return response.data!;
  }

  // ============ AI Services ============
  async generateProductDescription(data: {
    productName: string;
    category?: string;
    features?: string[];
    currentDescription?: string;
  }): Promise<{ description: string; fallback?: boolean; message?: string }> {
    const response = await this.request<{
      description: string;
      fallback?: boolean;
      message?: string;
    }>('/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async analyzeProductImage(imageFile: File, productName?: string, category?: string): Promise<{
    analysis: string;
    description: string;
    tags: string[];
    imageProcessed: boolean;
  }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (productName) formData.append('productName', productName);
    if (category) formData.append('category', category);

    const url = `${this.baseURL}/ai/analyze-image`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async generateDescriptionFromImage(imageFile: File, productName?: string): Promise<{
    description: string;
    imageProcessed: boolean;
    fallback?: boolean;
    message?: string;
  }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (productName) formData.append('productName', productName);

    const url = `${this.baseURL}/ai/generate-from-image`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type { ApiResponse, AuthResponse, User, LocationData, GeoPoint, LocationDetails };
