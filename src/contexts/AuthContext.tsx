import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  coins?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateCoins: (coins: number) => void;
  verifyToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:8000/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from AsyncStorage on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        const isValid = await verifyStoredToken(storedToken);
        if (!isValid) {
          // Token expired, clear auth
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyStoredToken = async (storedToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Update user data with fresh info
        setUser(data.data);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.data));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  const verifyToken = async (): Promise<boolean> => {
    if (!token) return false;
    return verifyStoredToken(token);
  };

  const clearAuth = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.data;
        const authToken = userData.token;

        // Store in state
        setUser({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          coins: userData.coins || 0,
        });
        setToken(authToken);

        // Store in AsyncStorage
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('user_data', JSON.stringify({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          coins: userData.coins || 0,
        }));

        return { success: true };
      } else {
        return { success: false, message: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName || '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.data;
        const authToken = userData.token;

        // Store in state
        setUser({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          coins: 0,
        });
        setToken(authToken);

        // Store in AsyncStorage
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('user_data', JSON.stringify({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          coins: 0,
        }));

        return { success: true };
      } else {
        return { success: false, message: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    await clearAuth();
  };

  const updateCoins = (coins: number) => {
    if (user) {
      const updatedUser = { ...user, coins };
      setUser(updatedUser);
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateCoins,
        verifyToken,
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
