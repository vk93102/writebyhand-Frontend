import { useEffect, useCallback, useRef } from 'react';
import { adsManager } from '../services/ads/AdsManager';

/**
 * useFeatureWithAd - Hook to wrap any feature function with ad logic
 * 
 * Usage:
 *   const { executeFeature } = useFeatureWithAd();
 *   
 *   const handleSaveQuiz = async () => {
 *     await executeFeature(async () => {
 *       // Your feature logic here
 *       await saveQuiz();
 *     }, 'quiz-save');
 *   };
 */

interface FeatureExecutionOptions {
  featureName?: string;
  delayBeforeAd?: number; // milliseconds
  showAdImmediately?: boolean; // show ad without delay
}

class FeatureWithAdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureWithAdError';
  }
}

export const useFeatureWithAd = () => {
  const isExecuting = useRef(false);
  const lastAdShowTime = useRef(0);
  const MIN_AD_INTERVAL = 30000; // Minimum 30 seconds between ads (prevent spam)

  /**
   * Execute a feature function and show ad after completion
   * 
   * @param featureFunction - Async function to execute
   * @param options - Configuration options
   * @returns Result from featureFunction
   */
  const executeFeature = useCallback(
    async (
      featureFunction: () => Promise<any>,
      options: FeatureExecutionOptions = {}
    ): Promise<any> => {
      const {
        featureName = 'unknown',
        delayBeforeAd = 500,
        showAdImmediately = false,
      } = options;

      // Prevent concurrent executions
      if (isExecuting.current) {
        console.warn('[useFeatureWithAd] Feature already executing, skipping');
        return;
      }

      try {
        isExecuting.current = true;

        console.log(`[useFeatureWithAd] Starting feature: ${featureName}`);

        // Step 1: Execute the feature function
        let result;
        try {
          result = await featureFunction();
          console.log(`[useFeatureWithAd] ✅ Feature completed: ${featureName}`);
        } catch (featureError) {
          console.error(`[useFeatureWithAd] ❌ Feature failed: ${featureName}`, featureError);
          throw new FeatureWithAdError(
            `Feature execution failed: ${featureError instanceof Error ? featureError.message : 'Unknown error'}`
          );
        }

        // Step 2: Show ad after feature completes (if not premium)
        if (!showAdImmediately && delayBeforeAd > 0) {
          console.log(`[useFeatureWithAd] Waiting ${delayBeforeAd}ms before showing ad...`);
          await new Promise(resolve => setTimeout(resolve, delayBeforeAd));
        }

        // Step 3: Check if enough time has passed since last ad
        const timeSinceLastAd = Date.now() - lastAdShowTime.current;
        if (timeSinceLastAd < MIN_AD_INTERVAL) {
          const waitTime = MIN_AD_INTERVAL - timeSinceLastAd;
          console.log(`[useFeatureWithAd] Rate limiting - waiting ${waitTime}ms before next ad`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Step 4: Trigger ad
        await triggerAd(featureName);
        lastAdShowTime.current = Date.now();

        return result;
      } finally {
        isExecuting.current = false;
      }
    },
    []
  );

  /**
   * Manually trigger ad display
   */
  const triggerAd = useCallback(async (featureName: string = 'manual'): Promise<void> => {
    try {
      console.log(`[useFeatureWithAd] Triggering ad after feature: ${featureName}`);

      // Check if ads are available
      if (!adsManager.isReady()) {
        console.log('[useFeatureWithAd] Ads not ready yet, will retry');
        return;
      }

      // Show the ad
      await adsManager.showAd();

      console.log('[useFeatureWithAd] ✅ Ad shown successfully');
    } catch (error) {
      console.error('[useFeatureWithAd] Error showing ad:', error);
      // Don't throw - ads are secondary to feature functionality
    }
  }, []);

  /**
   * Check if AdsManager is initialized
   */
  useEffect(() => {
    const checkAdsInitialization = async () => {
      const isInitialized = adsManager.getIsInitialized();
      if (!isInitialized) {
        console.warn('[useFeatureWithAd] AdsManager not initialized. Make sure to call adsManager.initialize() in App startup');
      }
    };

    checkAdsInitialization();
  }, []);

  return {
    executeFeature,
    triggerAd,
  };
};

export default useFeatureWithAd;
