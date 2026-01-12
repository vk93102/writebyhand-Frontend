import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  currency: string;
  initial_price?: number;
  price?: number;
  recurring_price?: number;
  trial_days: number;
  billing_cycle_days: number;
  auto_renewal: boolean;
  features: string[];
}

export interface SubscriptionStatus {
  user_id: string;
  current_plan: 'free' | 'plan_a_trial' | 'plan_b_monthly';
  is_active: boolean;
  is_trial: boolean;
  period_start: string;
  period_end: string;
  days_remaining: number;
  auto_renewal_enabled: boolean;
  status: 'active' | 'inactive';
  features: string;
  message: string;
}

export interface SubscribeResponse {
  user_id: string;
  plan: string;
  amount: number;
  currency: string;
  razorpay_order_id: string;
  trial_days: number;
  is_trial: boolean;
  next_action: string;
  message: string;
}

/**
 * Get all available subscription plans
 * GET /api/subscriptions/plans/
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    console.log('[Subscription] Fetching available plans from GET /api/subscriptions/plans/');
    const response = await api.get('/subscriptions/plans/');
    console.log('[Subscription] Plans fetched:', response.data);
    return response.data.plans || [];
  } catch (error: any) {
    console.error('[Subscription] Error fetching plans:', {
      endpoint: 'GET /subscriptions/plans/',
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.error || 'Failed to fetch subscription plans');
  }
};

/**
 * Subscribe to a plan and initiate payment
 * POST /api/subscriptions/subscribe/
 */
export const subscribeToPlan = async (
  userId: string,
  planId: string
): Promise<SubscribeResponse> => {
  try {
    console.log('[Subscription] Subscribing user to plan:', { userId, planId });
    const response = await api.post('/subscriptions/subscribe/', {
      user_id: userId,
      plan: planId,
    });
    console.log('[Subscription] Subscription response:', response.data);
    
    // Cache the subscription response
    await AsyncStorage.setItem(
      `subscription_response_${userId}`,
      JSON.stringify(response.data)
    );
    
    return response.data;
  } catch (error: any) {
    console.error('[Subscription] Error subscribing to plan:', {
      endpoint: 'POST /subscriptions/subscribe/',
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.error || 'Failed to subscribe to plan');
  }
};

/**
 * Confirm payment and activate subscription
 * POST /api/subscriptions/confirm-payment/
 */
export const confirmPayment = async (
  userId: string,
  planId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string
): Promise<any> => {
  try {
    console.log('[Subscription] Confirming payment:', {
      userId,
      planId,
      razorpayPaymentId,
      razorpayOrderId,
    });
    
    const response = await api.post('/subscriptions/confirm-payment/', {
      user_id: userId,
      plan: planId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
    });
    
    console.log('[Subscription] Payment confirmed:', response.data);
    
    // Clear cached response after confirmation
    await AsyncStorage.removeItem(`subscription_response_${userId}`);
    
    // Refresh subscription status
    await checkSubscriptionStatus(userId);
    
    return response.data;
  } catch (error: any) {
    console.error('[Subscription] Error confirming payment:', {
      endpoint: 'POST /subscriptions/confirm-payment/',
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.error || 'Failed to confirm payment');
  }
};

/**
 * Check current subscription status - CRITICAL FOR FEATURE GATING
 * GET /api/subscriptions/status/?user_id=<user_id>
 */
export const checkSubscriptionStatus = async (
  userId: string
): Promise<SubscriptionStatus> => {
  try {
    // console.log('[Subscription] Checking status for user:', userId);
    const response = await api.get(`/subscriptions/status/?user_id=${userId}`);
    // console.log('[Subscription] Status response:', response.data);
    
    // Cache subscription status with timestamp
    await AsyncStorage.setItem(
      `subscription_status_${userId}`,
      JSON.stringify({
        ...response.data,
        cached_at: new Date().toISOString(),
      })
    );
    
    return response.data;
  } catch (error: any) {
    console.error('[Subscription] Error checking status:', {
      endpoint: 'GET /subscriptions/status/',
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.error || 'Failed to check subscription status');
  }
};

/**
 * Check if user can access premium features
 * Returns true if subscription is active OR trial is valid
 */
export const canAccessPremiumFeature = async (userId: string): Promise<boolean> => {
  try {
    const status = await checkSubscriptionStatus(userId);
    
    // User can access if:
    // 1. is_active is true (primary check)
    // 2. status is 'active' (fallback for API variations)
    // 3. is_trial is true AND days_remaining > 0 (valid trial)
    const hasAccess = 
      status.is_active === true || 
      status.status === 'active' || 
      (status.is_trial && status.days_remaining > 0);
    
    // console.log('[Subscription] Premium feature access for', userId, ':', hasAccess, {
    //   is_active: status.is_active,
    //   is_trial: status.is_trial,
    //   days_remaining: status.days_remaining,
    //   status: status.status,
    // });
    
    return hasAccess;
  } catch (error) {
    console.error('[Subscription] Error checking premium access:', error);
    // Default to false if error occurs
    return false;
  }
};

/**
 * Get cached subscription status (for instant checking)
 */
export const getCachedSubscriptionStatus = async (
  userId: string
): Promise<SubscriptionStatus | null> => {
  try {
    const cached = await AsyncStorage.getItem(`subscription_status_${userId}`);
    if (cached) {
      const status = JSON.parse(cached);
      console.log('[Subscription] Using cached status for', userId);
      return status;
    }
    return null;
  } catch (error) {
    console.error('[Subscription] Error reading cached status:', error);
    return null;
  }
};

/**
 * Clear subscription cache (on logout)
 */
export const clearSubscriptionCache = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`subscription_status_${userId}`);
    await AsyncStorage.removeItem(`subscription_response_${userId}`);
    console.log('[Subscription] Cleared cache for', userId);
  } catch (error) {
    console.error('[Subscription] Error clearing cache:', error);
  }
};
