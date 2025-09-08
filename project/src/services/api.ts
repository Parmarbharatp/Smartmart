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
  };
  token: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'shop_owner' | 'delivery_boy';
  phoneNumber?: string;
  address?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
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
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type { ApiResponse, AuthResponse, User };
