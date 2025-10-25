import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, Store, ArrowRight, Shield, Users, Truck, Settings, CheckCircle, Star, Car, Bike, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/api';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'shop_owner' | 'delivery_boy',
    phoneNumber: '',
    address: '',
    vehicleType: '',
    licenseNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [licenseStatus, setLicenseStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Name validation function
  const validateName = (name: string): boolean => {
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    const trimmedName = name.trim();
    // Must contain actual characters (not just spaces) and be at least 2 characters
    return nameRegex.test(name) && trimmedName.length >= 2 && /[a-zA-Z]/.test(trimmedName);
  };

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    // Allow only 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Enhanced email validation function
  const validateEmail = (email: string): { isValid: boolean; error: string } => {
    const trimmedEmail = email.trim();
    
    // Check if email is empty
    if (!trimmedEmail) {
      return { isValid: false, error: 'Email is required' };
    }
    
    // Check if email has valid format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    // If email starts with a number, it must contain at least one letter
    const localPart = trimmedEmail.split('@')[0];
    if (/^[0-9]/.test(localPart)) {
      if (!/[a-zA-Z]/.test(localPart)) {
        return { isValid: false, error: 'Email starting with numbers must contain at least one letter' };
      }
    }
    
    return { isValid: true, error: '' };
  };

  // Address validation function
  const validateAddress = (address: string): boolean => {
    const trimmedAddress = address.trim();
    // Must be more than 10 characters and contain letters (not just numbers/special chars)
    return trimmedAddress.length > 10 && /[a-zA-Z]/.test(trimmedAddress);
  };

  // Indian Driving License validation function
  const validateDrivingLicense = (license: string): boolean => {
    const trimmedLicense = license.trim();
    
    // Must be exactly 13 characters
    if (trimmedLicense.length !== 13) {
      return false;
    }
    
    // Format: State Code (2 letters) + RTO Code (2 digits) + Year (2 digits) + Number (7 digits)
    const licenseRegex = /^[A-Z]{2}\d{2}\d{2}\d{7}$/;
    
    return licenseRegex.test(trimmedLicense);
  };

  // Handle name input change
  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    if (value && !validateName(value)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
    } else {
      setNameError('');
    }
  };

  // Handle phone number input change
  const handlePhoneChange = (value: string) => {
    // Remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    setFormData({ ...formData, phoneNumber: digitsOnly });
    
    if (digitsOnly && !validatePhoneNumber(digitsOnly)) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  // Handle email input change with enhanced validation
  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    
    // Clear previous email status and messages
    setEmailStatus('idle');
    setEmailMessage('');
    setEmailError('');
    
    // Perform real-time validation
    const validation = validateEmail(value);
    if (!validation.isValid) {
      setEmailError(validation.error);
      return;
    }
    
    // Clear error if email is valid
    setEmailError('');
  };

  // Handle license number input change
  const handleLicenseChange = (value: string) => {
    // Convert to uppercase and remove spaces
    const formattedLicense = value.toUpperCase().replace(/\s/g, '');
    setFormData({ ...formData, licenseNumber: formattedLicense });
    
    if (!formattedLicense) {
      setLicenseStatus('idle');
      setLicenseError('');
    } else if (formattedLicense.length < 13) {
      setLicenseStatus('validating');
      setLicenseError('');
    } else if (formattedLicense.length === 13) {
      if (validateDrivingLicense(formattedLicense)) {
        setLicenseStatus('valid');
        setLicenseError('');
      } else {
        setLicenseStatus('invalid');
        setLicenseError('Invalid license format. Use format: GJ05201123456');
      }
    } else {
      setLicenseStatus('invalid');
      setLicenseError('License must be exactly 13 characters. Use format: GJ05201123456');
    }
  };

  // Email validation with debouncing
  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (!formData.email || formData.email.length < 5) {
        setEmailStatus('idle');
        setEmailMessage('');
        return;
      }

      // Enhanced email format validation
      const validation = validateEmail(formData.email);
      if (!validation.isValid) {
        setEmailStatus('idle');
        setEmailMessage('');
        setEmailError(validation.error);
        return;
      }

      // Clear any validation errors
      setEmailError('');

      setEmailStatus('checking');
      setEmailMessage('Checking email availability...');

      try {
        const result = await apiService.checkEmail(formData.email);
        if (result.exists) {
          setEmailStatus('exists');
          setEmailMessage('This email is already registered');
        } else {
          setEmailStatus('available');
          setEmailMessage('Email is available');
        }
      } catch (error) {
        setEmailStatus('idle');
        setEmailMessage('');
      }
    };

    const timeoutId = setTimeout(checkEmailAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNameError('');
    setPhoneError('');
    setEmailError('');

    // Validate name
    if (!formData.name || !validateName(formData.name)) {
      setNameError('Name must contain actual characters (not just spaces) and be at least 2 characters');
      return;
    }

    // Validate phone number (required)
    if (!formData.phoneNumber || !validatePhoneNumber(formData.phoneNumber)) {
      setPhoneError('Phone number is required and must be exactly 10 digits');
      return;
    }

    // Enhanced email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    // Validate address (required for customers)
    if (formData.role === 'customer' && (!formData.address || !validateAddress(formData.address))) {
      setError('Address is required and must be more than 10 characters with meaningful content');
      return;
    }

    // Validate license number (required for delivery boys)
    if (formData.role === 'delivery_boy' && (!formData.licenseNumber || licenseStatus !== 'valid')) {
      setError('Valid driving license number is required for delivery boys');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (emailStatus === 'exists') {
      setError('This email is already registered. Please use a different email or try logging in instead.');
      return;
    }

    if (emailStatus === 'checking') {
      setError('Please wait while we check your email availability...');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed');
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

      // For registration form, first check if email already exists
      try {
        const emailCheck = await apiService.checkEmail(googleUser.email);
        
        if (emailCheck.exists) {
          // Email already exists, show error and redirect to login
          setError(`An account with ${googleUser.email} already exists. Please use the login page instead.`);
          return;
        }
        
        // Email doesn't exist, proceed with registration
        const result = await googleLogin(googleUser);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'Google registration failed');
        }
      } catch (checkError) {
        console.error('Email check failed:', checkError);
        setError('Unable to verify email. Please try again.');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError('Google authentication failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  const roleOptions = [
    { 
      value: 'customer', 
      label: 'Customer', 
      icon: Users, 
      color: 'from-blue-500 to-purple-500',
      description: 'Shop and place orders'
    },
    { 
      value: 'shop_owner', 
      label: 'Shop Owner', 
      icon: Store, 
      color: 'from-green-500 to-teal-500',
      description: 'Manage your shop and products'
    },
    { 
      value: 'delivery_boy', 
      label: 'Delivery Boy', 
      icon: Truck, 
      color: 'from-orange-500 to-red-500',
      description: 'Handle deliveries and logistics'
    }
  ];

  const features = [
    { icon: Shield, title: "Secure Registration", description: "Your data is protected with bank-level security" },
    { icon: CheckCircle, title: "Verified Platform", description: "Join our trusted community of users" },
    { icon: Star, title: "Premium Experience", description: "Access to exclusive features and benefits" },
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
              Join Our Community!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
              Create your account and start your journey with local businesses. Discover amazing products and support your community.
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
          
          {/* Account Types */}
          <div className="glass rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
              Choose Your Account Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roleOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <button
                    key={index}
                    onClick={() => setFormData({ ...formData, role: option.value as 'customer' | 'shop_owner' | 'delivery_boy' })}
                    className={`group p-4 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 ${
                      formData.role === option.value 
                        ? `bg-gradient-to-r ${option.color} text-white` 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-bold">{option.label}</div>
                        <div className="text-xs opacity-90">{option.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="glass rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-200 dark:border-gray-700">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Account</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors">
                Sign in here
              </Link>
            </p>
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
                text="signup_with"
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
                      Registration Failed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </p>
                    {error.includes('already exists') && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                          💡 <strong>Account Already Exists</strong>
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                          It looks like you already have an account with this email address.
                        </p>
                        <Link 
                          to="/login" 
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                        >
                          Go to Login Page
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`input-modern pl-12 ${
                    nameError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {nameError && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {nameError}
                </div>
              )}
            </div>
            
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
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`input-modern pl-12 pr-12 ${
                    emailError || emailStatus === 'exists' 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : emailStatus === 'available' 
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                        : ''
                  }`}
                  placeholder="Enter your email"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {emailStatus === 'checking' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  )}
                  {emailStatus === 'exists' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {emailStatus === 'available' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              {emailMessage && (
                <div className={`mt-1 text-xs ${
                  emailStatus === 'exists' 
                    ? 'text-red-600 dark:text-red-400' 
                    : emailStatus === 'available' 
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {emailMessage}
                </div>
              )}
              {emailError && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {emailError}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`input-modern pl-12 ${
                    phoneError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  placeholder="Enter your 10-digit phone number (required)"
                  maxLength={10}
                />
              </div>
              {phoneError && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {phoneError}
                </div>
              )}
            </div>
            
            {formData.role === 'customer' && (
              <div className="form-group">
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                  <input
                  id="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-modern pl-12"
                  placeholder="Enter your address (required, min 10 characters)"
                />
                </div>
              </div>
            )}
            
            {formData.role === 'delivery_boy' && (
              <>
                <div className="form-group">
                  <label htmlFor="vehicleType" className="form-label">
                    Vehicle Type
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      id="vehicleType"
                      required
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="input-modern pl-12"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Car">Car</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="licenseNumber" className="form-label">
                    License Number
                  </label>
                                    <div className="relative">
                    <Car className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="licenseNumber"
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={(e) => handleLicenseChange(e.target.value)}
                      className={`input-modern pl-12 ${
                        licenseStatus === 'invalid'
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : licenseStatus === 'valid'
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : ''
                      }`}
                      placeholder="Enter your license number (exactly 13 characters, e.g., GJ05201123456)"
                      maxLength={20}
                    />
                    {licenseStatus === 'valid' && (
                      <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {licenseStatus === 'validating' && (
                      <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </div>
                  {licenseError && (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {licenseError}
                    </div>
                  )}
                  {licenseStatus === 'valid' && (
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Valid license number
                    </div>
                  )}
                </div>
              </>
            )}
            
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
                  placeholder="Create a password"
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
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-modern pl-12 pr-12"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary group"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By creating an account, you agree to our{' '}
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

export default RegisterForm;