/**
 * Hook for Feature Lock Status
 * Provides lock information for UI components
 */

import { useEffect, useState } from 'react';
import { premiumFeatureService, SubscriptionStatus } from '../services/premiumFeatureService';

interface FeatureLockStatus {
  isLocked: boolean;
  isPremium: boolean;
  plan: 'free' | 'scholar' | 'genius';
  loading: boolean;
  error?: string;
}

export const useFeatureLock = (userId: string): FeatureLockStatus => {
  const [status, setStatus] = useState<FeatureLockStatus>({
    isLocked: true,
    isPremium: false,
    plan: 'free',
    loading: true,
  });

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const subscriptionStatus: SubscriptionStatus = await premiumFeatureService.getSubscriptionStatus(userId);
        
        setStatus({
          isLocked: !subscriptionStatus.isPremium,
          isPremium: subscriptionStatus.isPremium,
          plan: subscriptionStatus.plan,
          loading: false,
        });
      } catch (error) {
        console.error('[useFeatureLock] Error:', error);
        setStatus({
          isLocked: true,
          isPremium: false,
          plan: 'free',
          loading: false,
          error: 'Failed to load premium status',
        });
      }
    };

    loadStatus();
  }, [userId]);

  return status;
};

/**
 * Hook to refresh feature lock status (call after purchase)
 */
export const useRefreshFeatureLock = (userId: string) => {
  return async () => {
    premiumFeatureService.clearCache(userId);
    // Component using this hook should re-render after cache clear
  };
};
