import { Platform, NativeModules } from 'react-native';


class AdsManager {
  private static instance: AdsManager | null = null;
  private isInitialized = false;
  private isAdReady = false;
  private isPremium = false;
  private readonly IOS_GAME_ID = '6018265';
  private readonly ANDROID_GAME_ID = '6018264';
  private readonly AD_UNIT_ID = 'Interstitial_Android'; // or 'Interstitial_iOS' for iOS
  private initPromise: Promise<void> | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): AdsManager {
    if (!AdsManager.instance) {
      AdsManager.instance = new AdsManager();
    }
    return AdsManager.instance;
  }

  /**
   * Initialize Unity Ads SDK
   * Must be called on app startup
   */
  async initialize(isPremium: boolean = false): Promise<void> {
    // Prevent multiple initialization calls
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initializeAsync(isPremium);
    return this.initPromise;
  }

  private async _initializeAsync(isPremium: boolean): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[AdsManager] Already initialized');
        return;
      }

      this.isPremium = isPremium;

      // If user is premium, skip ads initialization
      if (isPremium) {
        console.log('[AdsManager] Premium user detected, ads disabled');
        this.isInitialized = true;
        return;
      }

      // Get platform-specific Game ID
      const gameId = Platform.OS === 'ios' ? this.IOS_GAME_ID : this.ANDROID_GAME_ID;
      
      console.log(`[AdsManager] Initializing on ${Platform.OS} with Game ID: ${gameId}`);

      // Initialize UnityAds SDK
      if (NativeModules.UnityAdsBridge) {
        await NativeModules.UnityAdsBridge.initialize(gameId);
        console.log('[AdsManager] ✅ Unity Ads initialized successfully');
        this.isInitialized = true;

        // Preload first ad after initialization
        this.preloadAd();
      } else {
        console.warn('[AdsManager] ⚠️ UnityAdsBridge not available (web/preview mode)');
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('[AdsManager] ❌ Initialization failed:', error);
      this.isInitialized = true; // Mark as initialized to prevent retry loops
    }
  }

  /**
   * Preload the next interstitial ad
   * Called after an ad is shown or on app start
   */
  async preloadAd(): Promise<void> {
    try {
      if (!this.isInitialized || this.isPremium) {
        return;
      }

      if (!NativeModules.UnityAdsBridge) {
        console.log('[AdsManager] Skipping preload (web mode)');
        return;
      }

      const adUnitId = Platform.OS === 'ios' ? 'Interstitial_iOS' : 'Interstitial_Android';
      
      console.log(`[AdsManager] Preloading ad: ${adUnitId}`);
      
      await NativeModules.UnityAdsBridge.loadAd(adUnitId);
      
      this.isAdReady = true;
      console.log('[AdsManager] ✅ Ad preloaded and ready');
    } catch (error) {
      console.error('[AdsManager] Failed to preload ad:', error);
      this.isAdReady = false;
    }
  }

  /**
   * Show interstitial ad
   * Only shows if ad is ready and user is not premium
   */
  async showAd(): Promise<void> {
    try {
      if (this.isPremium) {
        console.log('[AdsManager] Premium user - skipping ad');
        return;
      }

      if (!this.isInitialized) {
        console.warn('[AdsManager] Ads not initialized yet');
        return;
      }

      if (!this.isAdReady) {
        console.warn('[AdsManager] Ad not ready yet');
        return;
      }

      if (!NativeModules.UnityAdsBridge) {
        console.log('[AdsManager] Skipping ad display (web mode)');
        // Simulate ad in web/preview mode
        this._simulateAdDisplay();
        return;
      }

      const adUnitId = Platform.OS === 'ios' ? 'Interstitial_iOS' : 'Interstitial_Android';
      
      console.log(`[AdsManager] Showing ad: ${adUnitId}`);
      
      // Show the ad
      await NativeModules.UnityAdsBridge.showAd(adUnitId);
      
      console.log('[AdsManager] ✅ Ad displayed successfully');
      
      // Ad completed, preload next one
      this.isAdReady = false;
      this.preloadAd();
    } catch (error) {
      console.error('[AdsManager] ❌ Failed to show ad:', error);
      this.isAdReady = false;
      this.preloadAd(); // Attempt to preload next ad
    }
  }

  /**
   * Simulate ad display in web/preview mode for testing
   */
  private _simulateAdDisplay(): void {
    console.log('[AdsManager] 📺 SIMULATED AD (Web Mode) - Interstitial displayed');
    console.log('[AdsManager] Simulated ad duration: 5 seconds');
    
    // Reset ad ready after simulated display
    setTimeout(() => {
      this.isAdReady = false;
      this.preloadAd();
    }, 5000);
  }

  /**
   * Update premium status and reinitialize if needed
   */
  async updatePremiumStatus(isPremium: boolean): Promise<void> {
    const wasAdEnabled = !this.isPremium;
    this.isPremium = isPremium;
    const isAdEnabled = !this.isPremium;

    if (wasAdEnabled && isAdEnabled === false) {
      // Transitioned to premium - disable ads
      console.log('[AdsManager] User upgraded to premium, disabling ads');
      this.isAdReady = false;
    } else if (!wasAdEnabled && isAdEnabled) {
      // Transitioned to free - enable ads
      console.log('[AdsManager] User downgraded to free, enabling ads');
      if (this.isInitialized) {
        this.preloadAd();
      } else {
        this.initialize(false);
      }
    }
  }

  /**
   * Check if ad is currently ready to show
   */
  isReady(): boolean {
    return this.isAdReady && this.isInitialized && !this.isPremium;
  }

  /**
   * Get current premium status
   */
  getIsPremium(): boolean {
    return this.isPremium;
  }

  /**
   * Get initialization status
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export class (use AdsManager.getInstance())
export { AdsManager };

// Export singleton instance for backward compatibility
export const adsManager = AdsManager.getInstance();

// Default export
export default AdsManager;
