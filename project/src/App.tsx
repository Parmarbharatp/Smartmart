import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LocationTrackingProvider } from './contexts/LocationTrackingContext';
import { initializeMockData } from './services/mockData';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './components/Home/HomePage';
import LoginForm from './components/Auth/LoginForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import RegisterForm from './components/Auth/RegisterForm';
import ProductsPage from './components/Products/ProductsPage';
import ProductDetailPage from './components/Products/ProductDetailPage';
import ShopsPage from './components/Shop/ShopsPage';
import ShopPage from './components/Shop/ShopPage';
import CartPage from './components/Cart/CartPage';
import PaymentPage from './components/Payment/PaymentPage';
import OrdersPage from './components/Orders/OrdersPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import ShopDashboard from './components/Shop/ShopDashboard';
import DeliveryDashboard from './components/Delivery/DeliveryDashboard';
import ProfilePage from './components/Profile/ProfilePage';
import ProfileTest from './components/Test/ProfileTest';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  useEffect(() => {
    initializeMockData();
  }, []);

  // You need to replace this with your actual Google OAuth Client ID
  // Get it from: https://console.cloud.google.com/apis/credentials
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
  const shouldUseGoogle = typeof GOOGLE_CLIENT_ID === 'string' && GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';

  return (
    (shouldUseGoogle ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <LocationTrackingProvider>
                <Router>
                  <div className="min-h-screen transition-colors duration-300">
                    <Header />
                    <main>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/products/:productId" element={<ProductDetailPage />} />
                        <Route path="/shops" element={<ShopsPage />} />
                        <Route path="/shops/:shopId" element={<ShopPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/payment" element={<PaymentPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/shop-dashboard" element={<ShopDashboard />} />
                        <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
                        <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </Router>
              </LocationTrackingProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    ) : (
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <LocationTrackingProvider>
              <Router>
                <div className="min-h-screen transition-colors duration-300">
                  <Header />
                  <main>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginForm />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/register" element={<RegisterForm />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:productId" element={<ProductDetailPage />} />
                      <Route path="/shops" element={<ShopsPage />} />
                      <Route path="/shops/:shopId" element={<ShopPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/payment" element={<PaymentPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/shop-dashboard" element={<ShopDashboard />} />
                      <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
                      <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </Router>
            </LocationTrackingProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    ))
  );
}

export default App;