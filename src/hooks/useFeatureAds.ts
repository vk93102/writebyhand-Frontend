import { useEffect, useCallback } from 'react';
import { AdsManager } from '../services/ads/AdsManager';
import { usePremium } from '../context/PremiumContext';

interface UseFeatureAdsOptions {
  featureName: string;
  showAdOnComplete?: boolean;
}

export const useFeatureAds = (options: UseFeatureAdsOptions) => {
  const { featureName, showAdOnComplete = true } = options;
  const { isPremium } = usePremium();

  /**
   * Show interstitial ad after feature completion
   * Only for free users
   */
  const showFeatureCompleteAd = useCallback(async () => {
    if (isPremium || !showAdOnComplete) {
      console.log(`[FeatureAds] Skipping ad for ${featureName} (${isPremium ? 'premium user' : 'disabled'})`);
      return;
    }

    try {
      console.log(`[FeatureAds] Showing ad after ${featureName} completion`);
      const adsManager = AdsManager.getInstance();
      await adsManager.showAd();
      console.log(`[FeatureAds] ✅ Ad shown for ${featureName}`);
    } catch (error) {
      console.error(`[FeatureAds] Failed to show ad for ${featureName}:`, error);
    }
  }, [isPremium, showAdOnComplete, featureName]);

  /**
   * Check if ad is ready
   */
  const isAdReady = useCallback(() => {
    const adsManager = AdsManager.getInstance();
    return adsManager.isReady();
  }, []);

  return {
    showFeatureCompleteAd,
    isAdReady,
    isPremium,
  };
};
