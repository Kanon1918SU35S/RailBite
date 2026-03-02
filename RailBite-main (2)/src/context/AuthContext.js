import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('railbiteToken');
    if (token) {
      try {
        const response = await authAPI.getMe(token);
        if (response.data.success) {
          setUser(response.data.user);
          // keep localStorage in sync
          localStorage.setItem('railbiteUser', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('railbiteToken');
        localStorage.removeItem('railbiteUser');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('railbiteToken', token);
        localStorage.setItem('railbiteUser', JSON.stringify(user));
        setUser(user);
        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (fullName, email, phone, password, role = 'customer') => {
    try {
      const payload = {
        name: fullName,
        email,
        phone,
        password,
        role
      };
      const response = await authAPI.register(payload);

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('railbiteToken', token);
        localStorage.setItem('railbiteUser', JSON.stringify(user));
        setUser(user);
        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };


  const updateUser = (updatedFields) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('railbiteUser', JSON.stringify(merged));
      return merged;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('railbiteToken');
    localStorage.removeItem('railbiteUser');
    localStorage.removeItem('railbiteCart');
    localStorage.removeItem('railbiteOrderType');
    localStorage.removeItem('railbiteBooking');
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
