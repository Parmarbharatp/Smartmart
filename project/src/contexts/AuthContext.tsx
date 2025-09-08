import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';
import type { AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string; field?: string }>;
  googleLogin: (googleUser: any) => Promise<{ success: boolean; error?: string; field?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication and validate token
    const initializeAuth = async () => {
      try {
        if (apiService.isAuthenticated() && !apiService.isTokenExpired()) {
          // Token exists and is valid, fetch current user
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to restore authentication:', error);
        // Token is invalid, clear it
        apiService.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiService.login({ email, password });
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (googleUser: any): Promise<{ success: boolean; error?: string; field?: string }> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiService.googleAuth({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture
      });
      setUser(response.user);
      return { success: true };
    } catch (error: any) {
      console.error('Google login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Google authentication failed',
        field: error.field || 'email'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<{ success: boolean; error?: string; field?: string }> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await apiService.register({
        name: userData.name!,
        email: userData.email!,
        password: userData.password,
        role: userData.role || 'customer',
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        vehicleType: userData.vehicleType as any,
        licenseNumber: userData.licenseNumber as any
      });
      setUser(response.user);
      return { success: true };
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed',
        field: error.field || 'email'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};