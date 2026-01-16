import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Premium Service - Fetches and caches premium status from Django backend
 * Reduces API calls by caching status locally with TTL (Time To Live)
 */

const BACKEND_URL = 'https://ed-tech-backend-tzn8.onrender.com/api';
const CACHE_KEY = 'PREMIUM_STATUS_CACHE';
const CACHE_TTL_MINUTES = 60; // Cache premium status for 1 hour
const AUTH_TOKEN_KEY = 'AUTH_TOKEN';

/**
 * Get authentication token from AsyncStorage
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('[PremiumService] Error getting auth token:', error);
    return null;
  }
};

interface PremiumCacheData {
  isPremium: boolean;
  timestamp: number;
}

class PremiumService {
  private currentPremiumStatus: boolean = false;
  private cacheExpiryTime: number = 0;

  /**
   * Fetch premium status from Django backend
   * Uses local cache if fresh, otherwise calls API
   */
  async getPremiumStatus(userId: string): Promise<boolean> {
    try {
      // Check cache first
      const cached = await this._getFromCache();
      
      if (cached && this._isCacheFresh()) {
        console.log('[PremiumService] Using cached premium status:', cached.isPremium);
        this.currentPremiumStatus = cached.isPremium;
        return cached.isPremium;
      }

      // Cache expired or doesn't exist, fetch from API
      console.log('[PremiumService] Fetching premium status from backend...');
      
      // Get authentication token
      const token = await getAuthToken();
      
      if (!token) {
        console.log('[PremiumService] No auth token (user not logged in), defaulting to free');
        this.currentPremiumStatus = false;
        // Don't throw error, just return false for unauthenticated users
        return false;
      }

      const response = await axios.get(
        `${BACKEND_URL}/subscription/status/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const isPremium = response.data?.premium || response.data?.is_premium || false;
      
      console.log('[PremiumService] ✅ Premium status fetched:', isPremium);

      // Cache the result
      await this._saveToCache(isPremium);
      this.currentPremiumStatus = isPremium;
      
      return isPremium;
    } catch (error: any) {
      // Don't log error for 400/401 (unauthenticated users)
      if (error?.response?.status === 400 || error?.response?.status === 401) {
        console.log('[PremiumService] User not authenticated, using free tier');
      } else {
        console.error('[PremiumService] ❌ Error fetching premium status:', error.message || error);
      }
      
      // If API fails, try to use cached value
      const cached = await this._getFromCache();
      if (cached) {
        console.log('[PremiumService] API failed, using cached status:', cached.isPremium);
        this.currentPremiumStatus = cached.isPremium;
        return cached.isPremium;
      }

      // Default to free if everything fails
      this.currentPremiumStatus = false;
      return false;
    }
  }

  /**
   * Get cached premium status without API call
   */
  async getCachedPremiumStatus(): Promise<boolean> {
    const cached = await this._getFromCache();
    return cached?.isPremium || false;
  }

  /**
   * Clear cache (useful after user logout or subscription change)
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      this.currentPremiumStatus = false;
      this.cacheExpiryTime = 0;
      console.log('[PremiumService] Cache cleared');
    } catch (error) {
      console.error('[PremiumService] Error clearing cache:', error);
    }
  }

  /**
   * Get current in-memory premium status (instant, no await)
   */
  getCurrentStatus(): boolean {
    return this.currentPremiumStatus;
  }

  /**
   * Manually set premium status (useful after successful purchase)
   */
  setPremiumStatus(isPremium: boolean): void {
    this.currentPremiumStatus = isPremium;
    this._saveToCache(isPremium);
  }

  // ============ Private Methods ============

  /**
   * Save premium status to AsyncStorage with timestamp
   */
  private async _saveToCache(isPremium: boolean): Promise<void> {
    try {
      const cacheData: PremiumCacheData = {
        isPremium,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      this.cacheExpiryTime = Date.now() + CACHE_TTL_MINUTES * 60 * 1000;
      
      console.log('[PremiumService] Cached premium status for', CACHE_TTL_MINUTES, 'minutes');
    } catch (error) {
      console.error('[PremiumService] Error saving to cache:', error);
    }
  }

  /**
   * Retrieve premium status from AsyncStorage
   */
  private async _getFromCache(): Promise<PremiumCacheData | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      
      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('[PremiumService] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Check if cache is still fresh
   */
  private _isCacheFresh(): boolean {
    const now = Date.now();
    const isValid = now < this.cacheExpiryTime;
    
    if (!isValid) {
      console.log('[PremiumService] Cache expired');
    }
    
    return isValid;
  }
}

// Export singleton instance
export const premiumService = new PremiumService();
export default PremiumService;
