'use client';

const AUTH_KEY = 'simple_auth_logged_in';
const USER_KEY = 'simple_auth_user';

export const simpleAuth = {
  // Set login state
  login: (userType = 'user') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(USER_KEY, JSON.stringify({ type: userType, loggedInAt: new Date().toISOString() }));
    }
  },

  // Check if logged in
  isLoggedIn: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_KEY) === 'true';
    }
    return false;
  },

  // Get user info
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  // Check if user is admin
  isAdmin: () => {
    const user = simpleAuth.getUser();
    return user && user.type === 'admin';
  }
};