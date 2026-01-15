// Production-Ready Hook: Auto-show ads when leaving feature pages
import React, { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { adsManager } from '../services/ads/SimpleAdsManager';

/**
 * Production-ready hook for showing ads when user exits a feature page
 * 
 * Usage:
 * export const DailyQuizScreen = ({ navigation }) => {
 *   useShowAdOnPageExit(navigation);  // That's it!
 *   return <View>... your feature ...</View>;
 * };
 * 
 * How it works:
 * - Tracks when user navigates away from this screen
 * - Automatically shows ad as they leave
 * - Handles errors gracefully
 * - Production-grade code
 */
export const useShowAdOnPageExit = (navigation: any): void => {
  const isMountedRef = useRef(true);
  const hasShownAdRef = useRef(false);

  // Reset when component mounts
  useEffect(() => {
    isMountedRef.current = true;
    hasShownAdRef.current = false;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Listen for when user navigates AWAY from this screen
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - user is viewing it
      hasShownAdRef.current = false;

      return () => {
        // Screen is about to lose focus - user is leaving
        // Show ad when they exit
        if (isMountedRef.current && !hasShownAdRef.current) {
          hasShownAdRef.current = true;
          
          // Show ad asynchronously (don't wait for it)
          adsManager.showAdOnPageExit().catch((error) => {
            console.error('[Hook] Error showing ad:', error);
          });
        }
      };
    }, []),
  );
};

/**
 * Legacy hook name (for backward compatibility)
 * Just wraps useShowAdOnPageExit
 */
export const useShowAdAfterFeature = () => {
  return {
    showAd: async () => {
      await adsManager.showAdOnPageExit();
    },
  };
};

