/**
 * useFeatureAvailability Hook
 * Manages feature availability checking before execution
 * Provides subscription and usage management functions
 */

import { useState, useCallback, useEffect } from 'react';
import {
  subscriptionService,
  FeatureCheckResponse,
  UsageStatus,
  SubscriptionStatus,
} from '../services/subscriptionService';

interface UseFeatureAvailabilityReturn {
  // Check feature availability
  checkFeature: (feature: string) => Promise<boolean>;
  
  // Record feature usage after success
  recordUsage: (
    feature: string,
    inputSize?: number,
    usageType?: string,
    metadata?: Record<string, any>
  ) => Promise<boolean>;
  
  // Get current usage status
  getUsageStatus: (feature: string) => Promise<UsageStatus | null>;
  
  // Get subscription status
  getSubscriptionStatus: () => Promise<SubscriptionStatus | null>;
  
  // Check if unlimited
  isUnlimited: () => Promise<boolean>;
  
  // State
  loading: boolean;
  error: string | null;
  lastFeatureChecked: string | null;
  lastFeatureStatus: UsageStatus | null;
}

/**
 * Hook to manage feature availability checking and usage recording
 * Call checkFeature() BEFORE executing a feature
 * Call recordUsage() AFTER successful execution
 */
export function useFeatureAvailability(): UseFeatureAvailabilityReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeatureChecked, setLastFeatureChecked] = useState<string | null>(null);
  const [lastFeatureStatus, setLastFeatureStatus] = useState<UsageStatus | null>(null);

  /**
   * Check if feature is available for use
   * Should be called BEFORE executing feature
   * Returns true if allowed, false if blocked
   */
  const checkFeature = useCallback(async (feature: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionService.checkFeatureAvailability(feature);

      setLastFeatureChecked(feature);
      setLastFeatureStatus(response.status);

      if (!response.success) {
        setError(response.error || 'Failed to check feature availability');
        return false;
      }

      if (!response.status.allowed) {
        setError(response.status.reason);
        return false;
      }

      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to check feature availability';
      setError(errorMsg);
      console.error('checkFeature error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Record feature usage after successful execution
   * Should be called ONLY IF feature executed successfully
   */
  const recordUsage = useCallback(
    async (
      feature: string,
      inputSize?: number,
      usageType?: string,
      metadata?: Record<string, any>
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await subscriptionService.recordFeatureUsage(
          feature,
          inputSize,
          usageType,
          metadata
        );

        if (!response.success) {
          setError(response.error || 'Failed to record feature usage');
          return false;
        }

        // Update status after recording
        if (response.usage) {
          setLastFeatureStatus(response.usage);
        } else if (response.updated_usage) {
          setLastFeatureStatus(response.updated_usage);
        }

        return true;
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to record feature usage';
        setError(errorMsg);
        console.error('recordUsage error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get current usage status for a feature
   */
  const getUsageStatus = useCallback(
    async (feature: string): Promise<UsageStatus | null> => {
      try {
        const response = await subscriptionService.checkFeatureAvailability(
          feature
        );
        return response.status;
      } catch (err) {
        console.error('getUsageStatus error:', err);
        return null;
      }
    },
    []
  );

  /**
   * Get current subscription status
   */
  const getSubscriptionStatus = useCallback(
    async (): Promise<SubscriptionStatus | null> => {
      try {
        return await subscriptionService.getSubscriptionStatus();
      } catch (err) {
        console.error('getSubscriptionStatus error:', err);
        return null;
      }
    },
    []
  );

  /**
   * Check if user has unlimited access
   */
  const isUnlimited = useCallback(async (): Promise<boolean> => {
    try {
      return await subscriptionService.hasUnlimitedAccess();
    } catch (err) {
      console.error('isUnlimited error:', err);
      return false;
    }
  }, []);

  return {
    checkFeature,
    recordUsage,
    getUsageStatus,
    getSubscriptionStatus,
    isUnlimited,
    loading,
    error,
    lastFeatureChecked,
    lastFeatureStatus,
  };
}

/**
 * Example usage in a component:
 *
 * const { checkFeature, recordUsage, lastFeatureStatus } = useFeatureAvailability();
 *
 * // Before executing feature
 * const canUseQuiz = await checkFeature('quiz');
 * if (!canUseQuiz) {
 *   showUpgradePrompt(lastFeatureStatus);
 *   return;
 * }
 *
 * // Execute feature
 * try {
 *   const result = await executeQuiz();
 *   
 *   // After successful execution
 *   await recordUsage('quiz', { duration: 300 });
 *   
 *   showSuccess('Quiz completed!');
 * } catch (error) {
 *   showError('Quiz failed');
 * }
 */
