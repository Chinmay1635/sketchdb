import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  prn: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, turnstileToken?: string) => Promise<any>;
  signup: (userData: { username: string; email: string; prn: string; password: string; turnstileToken?: string }) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  resendOTP: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    if (authAPI.isAuthenticated()) {
      try {
        const data = await authAPI.getCurrentUser();
        setUser(data.user);
      } catch (error) {
        console.error('Failed to get user:', error);
        authAPI.logout();
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, turnstileToken?: string) => {
    const data = await authAPI.login(email, password, turnstileToken);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const signup = async (userData: { username: string; email: string; prn: string; password: string; turnstileToken?: string }) => {
    return authAPI.signup(userData);
  };

  const verifyOTP = async (email: string, otp: string) => {
    const data = await authAPI.verifyOTP(email, otp);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const resendOTP = async (email: string) => {
    return authAPI.resendOTP(email);
  };

  const forgotPassword = async (email: string) => {
    return authAPI.forgotPassword(email);
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    return authAPI.resetPassword(email, otp, newPassword);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
