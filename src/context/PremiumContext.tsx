import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { premiumService } from '../services/ads/premiumService';
import { adsManager } from '../services/ads/AdsManager';

/**
 * PremiumContext - Provides premium status globally to the app
 * Wraps the app at root level to ensure premium status is available everywhere
 */

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
  userId?: string;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ 
  children, 
  userId = 'guest' 
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch premium status on component mount and update AdsManager
   */
  useEffect(() => {
    const initializePremiumStatus = async () => {
      try {
        setIsLoading(true);

        // Fetch premium status from backend
        const status = await premiumService.getPremiumStatus(userId);
        setIsPremium(status);

        console.log('[PremiumProvider] Premium status loaded:', status);

        // Initialize AdsManager with premium status
        await adsManager.initialize(status);

        console.log('[PremiumProvider] AdsManager initialized');
      } catch (error) {
        console.error('[PremiumProvider] Error initializing:', error);
        // Default to free user if error
        setIsPremium(false);
        await adsManager.initialize(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializePremiumStatus();
  }, [userId]);

  /**
   * Refresh premium status (call this after user makes a purchase)
   */
  const refreshPremiumStatus = async () => {
    try {
      setIsLoading(true);

      // Fetch latest status from backend
      const status = await premiumService.getPremiumStatus(userId);
      setIsPremium(status);

      // Update AdsManager
      await adsManager.updatePremiumStatus(status);

      console.log('[PremiumProvider] Premium status refreshed:', status);
    } catch (error) {
      console.error('[PremiumProvider] Error refreshing premium status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: PremiumContextType = {
    isPremium,
    isLoading,
    refreshPremiumStatus,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

/**
 * Hook to access premium context
 * Usage: const { isPremium, isLoading, refreshPremiumStatus } = usePremium();
 */
export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  
  return context;
};

export default PremiumProvider;
