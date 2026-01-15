// Production-Ready Ad Manager
// Shows interstitial ads when users leave/exit any feature page
import { InterstitialAd, RewardedAd } from 'react-native-google-mobile-ads';
import { Platform, AppState } from 'react-native';

/**
 * Production-ready ad manager
 * Shows full-screen ads when users navigate away from feature pages
 * 
 * Features:
 * - Automatic ad loading in background
 * - Prevents ad spam (configurable delay between ads)
 * - Error handling (app always works even if ads fail)
 * - Platform-specific ad units
 * - High performance, production-grade code
 */
class ProductionAdsManager {
  // State management
  private isPreloading = false;
  private isShowingAd = false;
  private adShownCount = 0;
  private lastAdTime = 0;
  private preloadedAd: InterstitialAd | null = null;

  // Configuration
  private readonly MIN_TIME_BETWEEN_ADS = 8000; // 8 seconds - avoid ad spam
  private readonly PRELOAD_DELAY = 3000; // Preload ads 3 seconds after last ad
  private preloadTimeout: NodeJS.Timeout | null = null;

  // Platform-specific ad unit IDs (REPLACE THESE WITH YOUR REAL IDS FROM ADMOB)
  private readonly AD_UNIT_IDS = {
    ios: {
      interstitial: 'ca-app-pub-3940256099942544/4411468910', // iOS Test Interstitial
    },
    android: {
      interstitial: 'ca-app-pub-3940256099942544/1033173712', // Android Test Interstitial
    },
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the ad manager
   * Called once when app starts
   */
  private initialize() {
    try {
      console.log('[Ads] Manager initialized');
      // Start preloading first ad immediately
      this.preloadNextAd();
    } catch (error) {
      console.error('[Ads] Initialization error:', error);
    }
  }

  /**
   * Main method: Show ad when user exits a feature page
   * Call this when user navigates away from any feature screen
   * Safe to call multiple times - has built-in rate limiting
   */
  async showAdOnPageExit(): Promise<void> {
    try {
      // Check if enough time passed since last ad
      const timeSinceLastAd = Date.now() - this.lastAdTime;
      if (timeSinceLastAd < this.MIN_TIME_BETWEEN_ADS) {
        console.log(`[Ads] Rate limited (${timeSinceLastAd}ms ago). Skipping ad.`);
        return;
      }

      // Prevent multiple ads showing simultaneously
      if (this.isShowingAd) {
        console.log('[Ads] Ad already showing. Skipping.');
        return;
      }

      this.isShowingAd = true;

      // Use preloaded ad if available, otherwise create new one
      const adUnitId = this.getAdUnitId();
      const ad = this.preloadedAd || InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      // If we had preloaded ad, clear the reference
      if (this.preloadedAd) {
        this.preloadedAd = null;
      }

      // Load if not already loaded
      if (!ad.loaded) {
        await ad.load();
      }

      // Show the ad
      await ad.show();

      // Update stats
      this.adShownCount++;
      this.lastAdTime = Date.now();
      console.log(`[Ads] Ad shown (Total: ${this.adShownCount})`);

      // Schedule next ad to be preloaded
      this.schedulePreload();
    } catch (error) {
      console.error('[Ads] Error showing ad:', error);
      // Don't break the app - silently fail
    } finally {
      this.isShowingAd = false;
    }
  }

  /**
   * Preload next ad in background for better UX
   * This runs after each ad is shown
   */
  private preloadNextAd(): void {
    if (this.isPreloading || this.preloadedAd) {
      return;
    }

    this.isPreloading = true;

    try {
      const adUnitId = this.getAdUnitId();
      const ad = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      ad.load().then(() => {
        this.preloadedAd = ad;
        console.log('[Ads] Ad preloaded for next use');
      }).catch((error) => {
        console.error('[Ads] Preload error:', error);
      }).finally(() => {
        this.isPreloading = false;
      });
    } catch (error) {
      console.error('[Ads] Preload error:', error);
      this.isPreloading = false;
    }
  }

  /**
   * Schedule preload to happen after delay
   */
  private schedulePreload(): void {
    // Clear existing timeout
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }

    // Schedule new preload
    this.preloadTimeout = setTimeout(() => {
      this.preloadNextAd();
    }, this.PRELOAD_DELAY);
  }

  /**
   * Get ad unit ID for current platform
   */
  private getAdUnitId(): string {
    const platform = Platform.OS as 'ios' | 'android';
    const unitId = this.AD_UNIT_IDS[platform].interstitial;
    
    if (!unitId || unitId.includes('xxxxxxxx')) {
      console.warn('[Ads] Ad unit ID not configured. Update SimpleAdsManager.ts with your AdMob IDs.');
    }
    
    return unitId;
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      adsShown: this.adShownCount,
      lastAdTime: this.lastAdTime,
      timeSinceLastAd: Date.now() - this.lastAdTime,
      isShowingAd: this.isShowingAd,
      hasPreloadedAd: this.preloadedAd !== null,
    };
  }

  /**
   * Reset all stats
   */
  resetStats(): void {
    this.adShownCount = 0;
    this.lastAdTime = 0;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }
  }
}

// Export singleton instance
export const adsManager = new ProductionAdsManager();
