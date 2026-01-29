import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Turnstile from './Turnstile';
import { authToasts } from '../utils/toast';

// Turnstile site key - use test key for localhost, real key for production
const getTurnstileSiteKey = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    // Cloudflare test key that always passes for localhost
    return '1x00000000000000000000AA';
  }
  // Use environment variable or hardcoded production key
  return import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACMRo8q_iPvTlEDn';
};

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
        authToasts.loginSuccess(email.split('@')[0]);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      authToasts.loginError(err.message);
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
      authToasts.signupSuccess();
      // setMode('verify-otp');
      // setSuccess('Account created! Please check your email for the verification code.');
      // OTP verification is disabled - user is auto-verified on signup
      onClose();
      resetForm();
    } catch (err: any) {
      authToasts.signupError(err.message);
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
      authToasts.otpVerified();
      onClose();
      resetForm();
    } catch (err: any) {
      authToasts.otpError(err.message);
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
      authToasts.otpSent(email);
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
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        className="w-full max-w-md mx-4 overflow-hidden rounded-lg"
        style={{
          backgroundColor: 'rgba(13, 13, 20, 0.98)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          boxShadow: '0 0 60px rgba(0, 255, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 relative"
          style={{ background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(136, 85, 255, 0.15))' }}
        >
          <div 
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #00ffff, #8855ff, transparent)' }}
          />
          <div className="flex justify-between items-center">
            <h2 
              className="text-lg font-bold uppercase tracking-wider"
              style={{ 
                color: '#f0f0ff',
                fontFamily: "'Orbitron', sans-serif",
                textShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
              }}
            >
              {mode === 'login' && '// Login'}
              {mode === 'signup' && '// Create Account'}
              {mode === 'verify-otp' && '// Verify Email'}
              {mode === 'forgot-password' && '// Forgot Password'}
              {mode === 'reset-password' && '// Reset Password'}
            </h2>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="text-ghost hover:text-neon-cyan transition-all duration-200 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div 
              className="mb-4 p-3 rounded text-sm"
              style={{ 
                backgroundColor: 'rgba(255, 51, 102, 0.1)',
                border: '1px solid rgba(255, 51, 102, 0.3)',
                color: '#ff3366',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div 
              className="mb-4 p-3 rounded text-sm"
              style={{ 
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                color: '#00ff88',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {success}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              {/* Turnstile CAPTCHA */}
              <Turnstile
                key="login-turnstile"
                siteKey={getTurnstileSiteKey()}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                theme="dark"
              />
              
              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                style={{ 
                  background: isLoading || !turnstileToken 
                    ? 'rgba(42, 42, 58, 0.8)' 
                    : 'linear-gradient(135deg, #00ffff, #0088ff)',
                  color: isLoading || !turnstileToken ? '#8a8a9a' : '#0a0a0f',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: isLoading || !turnstileToken ? 'none' : '0 0 20px rgba(0, 255, 255, 0.3)'
                }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
              <div className="flex justify-between text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot-password')}
                  className="transition-colors"
                  style={{ color: '#00ffff' }}
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="transition-colors"
                  style={{ color: '#8855ff' }}
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
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
                <p 
                  className="text-xs mt-1"
                  style={{ color: '#4a4a5a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Only @walchandsangli.ac.in emails are allowed
                </p>
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // PRN (Registration Number)
                </label>
                <input
                  type="text"
                  value={prn}
                  onChange={(e) => setPrn(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="Enter your PRN"
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              {/* Turnstile CAPTCHA */}
              <Turnstile
                key="signup-turnstile"
                siteKey={getTurnstileSiteKey()}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                theme="dark"
              />
              
              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                style={{ 
                  background: isLoading || !turnstileToken 
                    ? 'rgba(42, 42, 58, 0.8)' 
                    : 'linear-gradient(135deg, #8855ff, #00ffff)',
                  color: isLoading || !turnstileToken ? '#8a8a9a' : '#0a0a0f',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: isLoading || !turnstileToken ? 'none' : '0 0 20px rgba(136, 85, 255, 0.3)'
                }}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <div className="text-center text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: '#8a8a9a' }}>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="transition-colors"
                  style={{ color: '#00ffff' }}
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
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.5)',
                    border: '1px solid #2a2a3a',
                    color: '#8a8a9a',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-3 text-center text-2xl tracking-widest focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#00ffff',
                    fontFamily: "'Orbitron', sans-serif"
                  }}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                style={{ 
                  background: isLoading 
                    ? 'rgba(42, 42, 58, 0.8)' 
                    : 'linear-gradient(135deg, #00ffff, #0088ff)',
                  color: isLoading ? '#8a8a9a' : '#0a0a0f',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: isLoading ? 'none' : '0 0 20px rgba(0, 255, 255, 0.3)'
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
              <div className="text-center text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: '#8a8a9a' }}>Didn't receive the code? </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="transition-colors"
                  style={{ color: '#00ffff' }}
                >
                  Resend OTP
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-xs transition-colors"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p 
                className="text-sm mb-4"
                style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
              >
                // Enter your email address and we'll send you a code to reset your password.
              </p>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="your.email@walchandsangli.ac.in"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                style={{ 
                  background: isLoading 
                    ? 'rgba(42, 42, 58, 0.8)' 
                    : 'linear-gradient(135deg, #ff8800, #ff00ff)',
                  color: isLoading ? '#8a8a9a' : '#0a0a0f',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: isLoading ? 'none' : '0 0 20px rgba(255, 136, 0, 0.3)'
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-xs transition-colors"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
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
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.5)',
                    border: '1px solid #2a2a3a',
                    color: '#8a8a9a',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // Reset Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-3 text-center text-2xl tracking-widest focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#00ffff',
                    fontFamily: "'Orbitron', sans-serif"
                  }}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-xs font-medium mb-2"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  // New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                style={{ 
                  background: isLoading 
                    ? 'rgba(42, 42, 58, 0.8)' 
                    : 'linear-gradient(135deg, #00ff88, #00ffff)',
                  color: isLoading ? '#8a8a9a' : '#0a0a0f',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: isLoading ? 'none' : '0 0 20px rgba(0, 255, 136, 0.3)'
                }}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-xs transition-colors"
                  style={{ color: '#8a8a9a', fontFamily: "'JetBrains Mono', monospace" }}
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
