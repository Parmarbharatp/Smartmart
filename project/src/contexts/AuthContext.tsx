import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  googleLogin: (googleUser: any) => Promise<boolean>;
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
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const foundUser = users.find((u: User & { password: string }) => 
        u.email === email && u.password === password
      );
      
      if (foundUser) {
        const userWithoutPassword = { ...foundUser };
        delete userWithoutPassword.password;
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const googleLogin = async (googleUser: any): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const { email, name, picture } = googleUser;
      
      // Check if user already exists
      let existingUser = users.find((u: User) => u.email === email);
      
      if (!existingUser) {
        // Create new user from Google data
        const newUser: User = {
          id: Date.now().toString(),
          email: email,
          name: name,
          role: 'customer', // Default role for Google users
          phoneNumber: '',
          address: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profilePicture: picture
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        existingUser = newUser;
      }
      
      setUser(existingUser);
      localStorage.setItem('currentUser', JSON.stringify(existingUser));
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find((u: User) => u.email === userData.email);
      
      if (existingUser) {
        return false; // User already exists
      }

      const newUser: User & { password: string } = {
        id: Date.now().toString(),
        email: userData.email!,
        name: userData.name!,
        role: userData.role || 'customer',
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        password: userData.password
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};