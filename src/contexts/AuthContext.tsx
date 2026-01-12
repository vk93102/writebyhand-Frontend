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
  refreshCoins: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'https://ed-tech-backend-tzn8.onrender.com/api';

// Fetch coins from API
const fetchUserCoinsFromAPI = async (userId: number, token: string): Promise<number> => {
  try {
    const response = await fetch(`${API_URL}/daily-quiz/coins/?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-ID': String(userId),
      },
    });

    const data = await response.json();
    
    if (data.success || data.total_coins !== undefined) {
      return data.total_coins || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('[AuthContext] Failed to fetch coins:', error);
    return 0;
  }
};

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
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Verify token is still valid
        const isValid = await verifyStoredToken(storedToken);
        if (!isValid) {
          // Token expired, clear auth
          await clearAuth();
        } else {
          // Token valid - refresh coins in background if needed
          const lastCoinsFetch = await AsyncStorage.getItem('user_coins_timestamp');
          const now = Date.now();
          const thirtyMinutes = 30 * 60 * 1000;
          
          // Refresh coins if older than 30 minutes
          if (!lastCoinsFetch || (now - parseInt(lastCoinsFetch)) > thirtyMinutes) {
            console.log('[AuthContext] Refreshing coins from API');
            try {
              const freshCoins = await fetchUserCoinsFromAPI(parsedUser.user_id, storedToken);
              const updatedUser = { ...parsedUser, coins: freshCoins };
              setUser(updatedUser);
              await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
              await AsyncStorage.setItem('user_coins_timestamp', String(now));
            } catch (error) {
              console.error('[AuthContext] Failed to refresh coins:', error);
              // Keep existing coins if API fails
            }
          }
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error loading stored auth:', error);
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
        const userId = userData.user_id;

        // Fetch coins immediately from API
        const coinsData = await fetchUserCoinsFromAPI(userId, authToken);
        const totalCoins = coinsData || 0;

        // Create user object with coins
        const userWithCoins = {
          user_id: userId,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          coins: totalCoins,
        };

        // Store in state
        setUser(userWithCoins);
        setToken(authToken);

        // Store in AsyncStorage
        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('user_data', JSON.stringify(userWithCoins));
        await AsyncStorage.setItem('user_coins_timestamp', String(Date.now()));

        console.log('[AuthContext] Login successful, coins loaded:', totalCoins);
        return { success: true };
      } else {
        return { success: false, message: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
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
      AsyncStorage.setItem('user_coins_timestamp', String(Date.now()));
      console.log('[AuthContext] Coins updated:', coins);
    }
  };

  const refreshCoins = async () => {
    if (!user || !token) {
      console.warn('[AuthContext] Cannot refresh coins: no user or token');
      return;
    }

    try {
      console.log('[AuthContext] Refreshing coins for user:', user.user_id);
      const freshCoins = await fetchUserCoinsFromAPI(user.user_id, token);
      const updatedUser = { ...user, coins: freshCoins };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('user_coins_timestamp', String(Date.now()));
      console.log('[AuthContext] Coins refreshed successfully:', freshCoins);
    } catch (error) {
      console.error('[AuthContext] Failed to refresh coins:', error);
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
        refreshCoins,
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
