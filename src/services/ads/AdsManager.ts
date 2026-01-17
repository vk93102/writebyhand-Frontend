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
        console.log('[AdsManager] 👑 Premium user detected, ads disabled');
        this.isInitialized = true;
        this.isAdReady = false; // Ensure no ads show for premium users
        return;
      }

      // Get platform-specific Game ID
      const gameId = Platform.OS === 'ios' ? this.IOS_GAME_ID : this.ANDROID_GAME_ID;
      
      console.log(`[AdsManager] 🚀 Initializing Unity Ads on ${Platform.OS} with Game ID: ${gameId}`);

      // Initialize UnityAds SDK
      if (Platform.OS === 'web') {
        console.log('[AdsManager] 🌐 Web platform detected - using simulated ads');
        this.isInitialized = true;
        this.isAdReady = true; // Simulate ads ready for web testing
      } else if (NativeModules.UnityAdsBridge) {
        // Wait for initialization with timeout
        const initTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Unity Ads initialization timeout')), 10000)
        );
        
        await Promise.race([
          NativeModules.UnityAdsBridge.initialize(gameId, false), // testMode = false for production
          initTimeout
        ]);
        
        console.log('[AdsManager] ✅ Unity Ads initialized successfully');
        this.isInitialized = true;

        // Wait a moment before preloading first ad
        setTimeout(() => {
          this.preloadAd();
        }, 1000);
      } else {
        console.warn('[AdsManager] ⚠️ UnityAdsBridge module not available (native module missing)');
        this.isInitialized = true;
        // Fall back to simulated mode for development
        this.isAdReady = true;
      }
    } catch (error) {
      console.error('[AdsManager] ❌ Initialization failed:', error);
      this.isInitialized = true; // Mark as initialized to prevent retry loops
      // Still allow app to work without ads
      this.isAdReady = false;
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
   * Show interstitial ad - PRODUCTION READY
   * Only shows if ad is ready and user is not premium
   */
  async showAd(): Promise<void> {
    try {
      // Check premium status first
      if (this.isPremium) {
        console.log('[AdsManager] 👑 Premium user - skipping ad');
        return;
      }

      // Check initialization
      if (!this.isInitialized) {
        console.warn('[AdsManager] ⚠️ Ads not initialized yet, attempting to initialize...');
        await this.initialize(false);
        // Don't show ad immediately after init, wait for next feature use
        return;
      }

      // Check if ad is ready
      if (!this.isAdReady) {
        console.warn('[AdsManager] ⚠️ Ad not ready yet, preloading...');
        this.preloadAd();
        return;
      }

      // Handle web/simulation mode
      if (Platform.OS === 'web' || !NativeModules.UnityAdsBridge) {
        console.log('[AdsManager] 🌐 Web mode - showing simulated ad');
        this._simulateAdDisplay();
        return;
      }

      // Show actual Unity Ad
      const adUnitId = Platform.OS === 'ios' ? 'Interstitial_iOS' : 'Interstitial_Android';
      
      console.log(`[AdsManager] 📺 Displaying Unity Ad: ${adUnitId}`);
      
      // Set timeout for ad display
      const adTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Ad display timeout')), 30000)
      );
      
      await Promise.race([
        NativeModules.UnityAdsBridge.showAd(adUnitId),
        adTimeout
      ]);
      
      console.log('[AdsManager] ✅ Ad displayed successfully');
      
      // Ad completed, mark as not ready and preload next one
      this.isAdReady = false;
      setTimeout(() => {
        this.preloadAd();
      }, 2000); // Wait 2 seconds before preloading next ad
      
    } catch (error: any) {
      console.error('[AdsManager] ❌ Failed to show ad:', error.message || error);
      
      // Mark ad as not ready on error
      this.isAdReady = false;
      
      // Attempt to preload next ad after delay
      setTimeout(() => {
        console.log('[AdsManager] 🔄 Retrying ad preload after error...');
        this.preloadAd();
      }, 5000);
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
