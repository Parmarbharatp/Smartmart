import React, { useState } from 'react';
import { Mail, ArrowRight, KeyRound, Lock, CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { apiService } from '../../services/api';

type Step = 'email' | 'otp' | 'password' | 'success';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState<Date | null>(null);

  const clearMessages = () => {
    setError('');
    setMessage('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    
    try {
      const res = await apiService.requestPasswordReset(email);
      setMessage('OTP has been sent to your email address!');
      setOtpSentTime(new Date());
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await apiService.resetPassword({ email, otp, password });
      setMessage('Password reset successfully! Redirecting to login...');
      setStep('success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    clearMessages();
    if (step === 'otp') {
      setStep('email');
    } else if (step === 'password') {
      setStep('otp');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Forgot your password?';
      case 'otp': return 'Enter verification code';
      case 'password': return 'Set new password';
      case 'success': return 'Password reset successful!';
      default: return 'Forgot your password?';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email': return "Don't worry! Enter your email address and we'll send you a verification code.";
      case 'otp': return `We've sent a 6-digit code to ${email}. Please check your email and enter the code below.`;
      case 'password': return 'Now create a new password for your account.';
      case 'success': return 'Your password has been successfully reset. You will be redirected to the login page shortly.';
      default: return '';
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'email': return 1;
      case 'otp': return 2;
      case 'password': return 3;
      case 'success': return 4;
      default: return 1;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum < getStepNumber() 
                    ? 'bg-green-500 text-white' 
                    : stepNum === getStepNumber() 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {stepNum < getStepNumber() ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    stepNum < getStepNumber() 
                      ? 'bg-green-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {getStepNumber()} of 4
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {getStepTitle()}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getStepDescription()}
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full mr-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center group"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={goBack}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={otp.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Verify Code
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={goBack}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || password.length < 6 || password !== confirmPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Password Reset Complete!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your password has been successfully updated. You will be redirected to the login page in a few seconds.
                </p>
              </div>

              <button 
                onClick={() => window.location.href = '/login'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go to Login Page
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


