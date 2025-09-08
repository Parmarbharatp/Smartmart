import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, Store, ArrowRight, Shield, Users, Truck, Settings, CheckCircle, Star } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setError(''); // Clear any existing errors
      
      // Decode the JWT token to get user info
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credentialResponse.credential}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Google token info error:', data);
        setError('Google authentication failed. Please try again.');
        return;
      }
      
      const googleUser = {
        email: data.email,
        name: data.name,
        picture: data.picture
      };

      console.log('Google user data:', googleUser);

      const result = await googleLogin(googleUser);
      if (result.success) {
        navigate('/');
      } else {
        // Handle specific error cases
        if (result.error && result.error.includes('already exists')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else {
          setError(result.error || 'Google authentication failed');
        }
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError('Google authentication failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  const features = [
    { icon: Shield, title: "Secure Platform", description: "Bank-level security with SSL encryption" },
    { icon: CheckCircle, title: "Verified Sellers", description: "All sellers are verified and trusted" },
    { icon: Star, title: "Quality Products", description: "Curated selection of premium products" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side - Branding & Features */}
        <div className="text-center lg:text-left space-y-8">
          
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mr-4 shadow-2xl">
              <Store className="h-8 w-8 text-white" />
            </div>
            <div>
                              <span className="text-4xl font-bold text-gradient">SmartMart</span>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Premium Marketplace Platform
              </div>
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100">
              Welcome Back!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
              Sign in to continue your journey with local businesses and discover amazing products in your community.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
          
          {/* Google Login Button */}
          <div className="mb-6">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID" ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Google authentication is not configured
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  See GOOGLE_OAUTH_SETUP.md for configuration instructions
                </p>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with email
              </span>
            </div>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-6 py-4 rounded-2xl shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                      Login Failed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </p>
                    {error.includes('already exists') && (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 dark:text-red-500">
                          💡 Tip: If you don't have an account, try{' '}
                          <Link to="/register" className="underline font-medium hover:text-red-800 dark:hover:text-red-200">
                            creating one instead
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-modern pl-12"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-modern pl-12 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700" 
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary group"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors">
                Create one here
              </Link>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;