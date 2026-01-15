/**
 * SubscriptionGuard - Hard Feature Isolation
 * 
 * Core Principle: Features are NOT loaded for free users at all.
 * This is NOT a UI condition - it's an architectural gate.
 * 
 * Free users → See ONLY pricing screen
 * Premium users → See ALL features
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { premiumFeatureService } from '@/services/premiumFeatureService';

interface SubscriptionGuardProps {
  userId: string;
  children: React.ReactNode; // Feature routes (for premium only)
  fallback: React.ReactNode; // Pricing screen (for free only)
  loadingComponent?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  userId,
  children,
  fallback,
  loadingComponent,
}) => {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        console.log('[SubscriptionGuard] Checking subscription status for user:', userId);
        
        setIsLoading(true);
        setError(null);

        // Get subscription status
        const status = await premiumFeatureService.getPremiumStatus(userId);
        
        console.log('[SubscriptionGuard] Subscription check result:', {
          isPremium: status.isPremium,
          plan: status.currentPlan,
        });

        setIsPremium(status.isPremium);
      } catch (err) {
        console.error('[SubscriptionGuard] Error checking subscription:', err);
        
        // On error, deny access (fail-safe)
        setIsPremium(false);
        setError('Failed to verify subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [userId]);

  // Loading state
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Error state - default to free access (fail-safe)
  if (error) {
    console.warn('[SubscriptionGuard] Showing fallback due to error:', error);
    return <View>{fallback}</View>;
  }

  // Render appropriate content based on subscription status
  if (isPremium) {
    console.log('[SubscriptionGuard] Premium user - rendering features');
    return <View style={styles.container}>{children}</View>;
  } else {
    console.log('[SubscriptionGuard] Free user - rendering pricing only');
    return <View style={styles.container}>{fallback}</View>;
  }
};

const DefaultLoadingComponent: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6200EE" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
