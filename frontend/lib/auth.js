// frontend/lib/auth.js
import { apiClient } from './api';

export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user_data';

export const authService = {
  // Store token and user data
  setAuthData: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }
  },

  // Get stored token
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  // Get stored user data
  getUser: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  // Clear auth data
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = authService.getToken();
    const user = authService.getUser();
    return !!(token && user);
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getUser();
    return user && user.role === 'admin';
  },

  // Check if user is student
  isStudent: () => {
    const user = authService.getUser();
    return user && user.role === 'student';
  },

  // Google OAuth login
  googleLogin: async (googleToken) => {
    try {
      const response = await apiClient.googleAuth(googleToken);
      if (response.success) {
        authService.setAuthData(response.token, response.user);
        return response;
      }
      throw new Error(response.error || 'Google login failed');
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuth();
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await apiClient.verifyToken();
      if (response.success) {
        authService.setAuthData(authService.getToken(), response.user);
        return response;
      }
      throw new Error('Token verification failed');
    } catch (error) {
      authService.clearAuth();
      throw error;
    }
  }
};