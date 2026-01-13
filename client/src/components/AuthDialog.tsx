import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Turnstile from './Turnstile';

// Turnstile site key - use test key for development, replace with real key for production
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key that always passes

type AuthMode = 'login' | 'signup' | 'verify-otp' | 'forgot-password' | 'reset-password';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, signup, verifyOTP, resendOTP, forgotPassword, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [prn, setPrn] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setPrn('');
    setOtp('');
    setNewPassword('');
    setTurnstileToken(null);
    setError(null);
    setSuccess(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password, turnstileToken);
      if (result.requiresVerification) {
        setMode('verify-otp');
        setSuccess('A verification code has been sent to your email.');
      } else {
        onClose();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message);
      setTurnstileToken(null); // Reset token on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!email.endsWith('@walchandsangli.ac.in')) {
      setError('Email must be from @walchandsangli.ac.in domain');
      setIsLoading(false);
      return;
    }

    try {
      await signup({ username, email, prn, password, turnstileToken });
      setMode('verify-otp');
      setSuccess('Account created! Please check your email for the verification code.');
    } catch (err: any) {
      setError(err.message);
      setTurnstileToken(null); // Reset token on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await verifyOTP(email, otp);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await resendOTP(email);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setMode('reset-password');
      setSuccess('If an account exists with this email, you will receive a reset code.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(email, otp, newPassword);
      setMode('login');
      setSuccess('Password reset successfully! Please login with your new password.');
      setOtp('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' && 'Login to SketchDB'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'verify-otp' && 'Verify Email'}
              {mode === 'forgot-password' && 'Forgot Password'}
              {mode === 'reset-password' && 'Reset Password'}
            </h2>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              {/* Turnstile CAPTCHA */}
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                theme="light"
              />
              
              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot-password')}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Only @walchandsangli.ac.in emails are allowed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PRN (Registration Number)</label>
                <input
                  type="text"
                  value={prn}
                  onChange={(e) => setPrn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your PRN"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              {/* Turnstile CAPTCHA */}
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                theme="light"
              />
              
              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Login
                </button>
              </div>
            </form>
          )}

          {/* Verify OTP Form */}
          {mode === 'verify-otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
              <div className="text-center text-sm">
                <span className="text-gray-600">Didn't receive the code? </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Resend OTP
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a code to reset your password.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDialog;
