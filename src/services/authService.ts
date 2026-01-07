import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import { Platform } from 'react-native';

const getAuthApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8003/api';
  }
  if (Platform.OS === 'ios') {
    return 'http://localhost:8003/api';
  }
  return 'http://localhost:8003/api';
};

const API_BASE_URL = getAuthApiUrl();

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Google OAuth Authentication Service
 */
class AuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.isInitialized = false;
  }

  /**
   * Initialize auth service - restore tokens from secure storage
   */
  async initialize() {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (accessToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;

        // Verify token is still valid
        if (this.isTokenExpired(accessToken)) {
          // Try to refresh
          await this.refreshAccessToken();
        } else {
          // Token is valid, load user profile
          await this.loadUserProfile();
        }
      }

      this.isInitialized = true;
      return this.user !== null;
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Exchange Google authorization code for tokens
   */
  async googleSignIn(code) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/google/callback/`,
        {
          code: code,
          provider: 'google',
        }
      );

      if (response.data.success) {
        await this.setTokens(response.data.tokens);
        this.user = response.data.user;
        return {
          success: true,
          user: response.data.user,
          isNewUser: response.data.is_new_user,
        };
      }

      return {
        success: false,
        error: response.data.error,
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Sign in failed',
      };
    }
  }

  /**
   * Email/Password signup
   */
  async emailSignUp(name, email, password) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup/`,
        {
          name: name,
          email: email,
          password: password,
        }
      );

      if (response.data.success) {
        await this.setTokens(response.data.tokens);
        this.user = response.data.user;
        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.data.error,
      };
    } catch (error) {
      console.error('Email signup error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Sign up failed',
      };
    }
  }

  /**
   * Email/Password login
   */
  async emailLogin(email, password) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login/`,
        {
          email: email,
          password: password,
        }
      );

      if (response.data.success) {
        await this.setTokens(response.data.tokens);
        this.user = response.data.user;
        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.data.error,
      };
    } catch (error) {
      console.error('Email login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  }

  /**
   * Store tokens in secure storage
   */
  async setTokens(tokens) {
    try {
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
      if (tokens.refresh_token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
      }
    } catch (error) {
      console.error('Token storage error:', error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await axios.post(
        `${API_BASE_URL}/auth/token/refresh/`,
        {
          refresh_token: this.refreshToken,
        }
      );

      if (response.data.success) {
        await this.setTokens(response.data.tokens);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens if refresh fails
      await this.logout();
      return false;
    }
  }

  /**
   * Load user profile from backend
   */
  async loadUserProfile() {
    try {
      if (!this.accessToken) {
        return false;
      }

      const response = await axios.get(
        `${API_BASE_URL}/auth/user/profile/`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.data.success) {
        this.user = response.data.user;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Profile load error:', error);
      return false;
    }
  }

  /**
   * Check if JWT token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = jwtDecode(token);
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('Token decode error:', error);
      return true;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call logout endpoint if needed
      if (this.accessToken) {
        await axios.post(
          `${API_BASE_URL}/auth/logout/`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        );
      }

      // Clear tokens from storage
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

      // Clear in-memory tokens
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear tokens even if logout API call fails
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.accessToken !== null && this.user !== null;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    if (this.accessToken) {
      return {
        'Authorization': `Bearer ${this.accessToken}`,
      };
    }
    return {};
  }

  /**
   * Setup axios interceptor for automatic token refresh
   */
  setupAxiosInterceptor() {
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (
          error.response?.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${this.accessToken}`;
            return axios(originalRequest);
          } else {
            // Refresh failed, logout user
            await this.logout();
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

// Export singleton instance
export const authService = new AuthService();

/**
 * API functions for authentication
 */
export const googleAuthAPI = {
  /**
   * Sign in with Google
   */
  async signInWithGoogle(code) {
    return authService.googleSignIn(code);
  },

  /**
   * Email signup
   */
  async signUp(name, email, password) {
    return authService.emailSignUp(name, email, password);
  },

  /**
   * Email login
   */
  async login(email, password) {
    return authService.emailLogin(email, password);
  },

  /**
   * Logout
   */
  async logout() {
    return authService.logout();
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return authService.getCurrentUser();
  },

  /**
   * Check authentication status
   */
  isAuthenticated() {
    return authService.isAuthenticated();
  },

  /**
   * Initialize authentication
   */
  async initialize() {
    return authService.initialize();
  },

  /**
   * Setup axios interceptors
   */
  setupInterceptors() {
    authService.setupAxiosInterceptor();
  },
};
