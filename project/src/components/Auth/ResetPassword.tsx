import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid password reset link');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.resetPassword({ email, token, password });
      setMessage(res.message || 'Password has been reset successfully');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Set a new password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose a strong password for {email || 'your account'}.</p>

        {message && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-lg p-3">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-lg p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="form-label">New password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern pl-12"
                placeholder="Enter new password"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="form-label">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-modern pl-12"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading || !token || !email} className="w-full btn-primary group">
            {isLoading ? 'Resetting...' : (
              <>
                Reset password
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;


