import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ed-tech-backend-tzn8.onrender.com/api';
const AUTH_TOKEN_KEY = 'authToken';

// Helper to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

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

// Production-level subscription status interface
export interface SubscriptionStatus {
  success: boolean;
  user_id: string;
  plan: string;
  is_paid: boolean;
  subscription_active: boolean;
  subscription_status: 'active' | 'cancelled' | 'expired' | 'trial';
  auto_renewal: boolean;
  subscription_start_date: string;
  currency: string;
  next_billing_date?: string;
  next_billing_amount?: number;
  days_until_next_billing?: number;
  is_trial: boolean;
  trial_end_date?: string;
  trial_days_remaining?: number;
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

// Payment order response interface
export interface PaymentOrderResponse {
  success: boolean;
  order_id?: string;
  amount?: number;
  amount_paise?: number;
  currency?: string;
  key_id?: string;
  plan?: string;
  payment_record_id?: string;
  error?: string;
  message?: string;
  current_plan?: string;
  subscription_status?: string;
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
 * GET /api/subscription/status/?user_id=<user_id>
 * Production-level implementation with comprehensive validation
 */
export const checkSubscriptionStatus = async (
  userId: string
): Promise<SubscriptionStatus> => {
  try {
    console.log('[Subscription] 🔍 Checking status for user:', userId);
    
    // Use correct endpoint matching backend test results
    const response = await axios.get(`${API_BASE_URL}/subscription/status/`, {
      params: { user_id: userId },
      headers: { 
        'Content-Type': 'application/json',
        'X-User-ID': userId 
      },
    });
    
    console.log('[Subscription] 📊 Status response:', response.data);
    
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
    console.error('[Subscription] ❌ Error checking status:', {
      endpoint: 'GET /subscription/status/',
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw new Error(error.response?.data?.error || 'Failed to check subscription status');
  }
};

/**
 * Check if user can access premium features - PRODUCTION LEVEL VALIDATION
 * Returns true if subscription is active with comprehensive checks
 * Matches backend validation logic from test results
 */
export const canAccessPremiumFeature = async (userId: string): Promise<boolean> => {
  try {
    const status = await checkSubscriptionStatus(userId);
    
    // Production-level validation matching backend requirements:
    // 1. success === true (API call succeeded)
    // 2. is_paid === true (user has paid)
    // 3. subscription_active === true (subscription is active)
    // 4. plan !== 'free' (not on free plan)
    // 5. subscription_status === 'active' (status is active)
    const hasAccess = (
      status.success === true &&
      status.is_paid === true &&
      status.subscription_active === true &&
      status.plan !== 'free' &&
      status.subscription_status === 'active'
    );
    
    console.log('[Subscription] ✅ Premium feature access check:', {
      userId,
      hasAccess,
      success: status.success,
      is_paid: status.is_paid,
      subscription_active: status.subscription_active,
      plan: status.plan,
      subscription_status: status.subscription_status,
      is_trial: status.is_trial,
      days_remaining: status.days_until_next_billing,
    });
    
    return hasAccess;
  } catch (error) {
    console.error('[Subscription] ❌ Error checking premium access:', error);
    // Default to false if error occurs - fail secure
    return false;
  }
};

/**
 * Create payment order - PRODUCTION LEVEL with duplicate detection
 * POST /api/payment/create-order/
 * Handles 409 Conflict responses for duplicate subscriptions
 */
export const createPaymentOrder = async (
  userId: string,
  plan: string
): Promise<PaymentOrderResponse> => {
  try {
    console.log('[Subscription] 📦 Creating payment order:', { userId, plan });

    const response = await axios.post(
      `${API_BASE_URL}/payment/create-order/`,
      {
        user_id: userId,
        plan: plan,
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId 
        },
      }
    );

    if (response.data.success) {
      console.log('[Subscription] ✅ Payment order created:', response.data.order_id);
      return response.data;
    }

    return {
      success: false,
      error: response.data.error || 'Failed to create order',
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('[Subscription] ❌ Error creating payment order:', error.message);

    // Handle 409 Conflict - Duplicate subscription
    // This matches the backend test results showing proper duplicate detection
    if (error.response?.status === 409) {
      const errorData = error.response.data;
      console.log('[Subscription] ⚠️ Duplicate subscription detected:', errorData);
      return {
        success: false,
        error: 'Already Subscribed',
        message: errorData.message || 'You already have an active subscription',
        current_plan: errorData.current_plan,
        subscription_status: errorData.subscription_status,
      };
    }

    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to create order',
      message: error.response?.data?.message,
    };
  }
};

/**
 * Verify payment after Razorpay checkout - CRITICAL STEP
 * This updates the subscription status in the backend database
 */
export const verifyPayment = async (
  userId: string,
  orderId: string,
  paymentId: string,
  signature: string,
  plan: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    console.log('[Subscription] 🔐 Verifying payment with backend:', { orderId, paymentId, userId });

    // Get auth token for Authorization header
    const token = await getAuthToken();
    console.log('[Subscription] 🔑 Auth token status:', token ? `Found (length: ${token.length})` : '❌ NOT FOUND');
    
    const headers: any = { 
      'Content-Type': 'application/json',
      'X-User-ID': userId 
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[Subscription] ✅ Added Authorization header');
    } else {
      console.error('[Subscription] ❌ WARNING: No auth token found! Request will likely fail with 401');
    }

    console.log('[Subscription] 📤 Sending verification request with headers:', Object.keys(headers));

    const response = await axios.post(
      `${API_BASE_URL}/payment/verify/`,
      {
        user_id: userId,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        plan: plan,
      },
      { headers }
    );

    if (response.data.success) {
      console.log('[Subscription] ✅ Payment verified successfully, subscription updated');
      return { success: true, message: response.data.message };
    }

    return {
      success: false,
      error: response.data.error || 'Payment verification failed',
    };
  } catch (error: any) {
    console.error('[Subscription] ❌ Payment verification error:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Payment verification failed',
    };
  }
};

/**
 * Poll subscription status after payment - PRODUCTION LEVEL
 * Waits for backend to update subscription status after payment verification
 * Essential for ensuring features unlock immediately after payment
 */
export const pollSubscriptionStatus = async (
  userId: string,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<boolean> => {
  console.log('[Subscription] 🔄 Polling subscription status after payment...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Subscription] 🔍 Polling attempt ${attempt}/${maxAttempts}`);

    try {
      const isPremium = await canAccessPremiumFeature(userId);
      
      if (isPremium) {
        console.log('[Subscription] 🎉 Premium status confirmed after payment!');
        return true;
      }
    } catch (error) {
      console.warn(`[Subscription] ⚠️ Polling attempt ${attempt} failed:`, error);
    }

    if (attempt < maxAttempts) {
      console.log(`[Subscription] ⏳ Waiting ${intervalMs}ms before next check...`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  console.log('[Subscription] ⏰ Polling timeout - status not updated yet');
  return false;
};

/**
 * Load Razorpay script for web platform - PRODUCTION LEVEL
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    return Promise.resolve(true); // Not needed for mobile
  }

  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      console.log('[Subscription] ✅ Razorpay script already loaded');
      resolve(true);
      return;
    }

    console.log('[Subscription] 📥 Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('[Subscription] ✅ Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('[Subscription] ❌ Failed to load Razorpay script');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

/**
 * Open Razorpay checkout modal - PRODUCTION LEVEL
 * Only for web platform
 */
export const openRazorpayCheckout = async (
  orderData: PaymentOrderResponse,
  userId: string,
  userEmail: string,
  userName: string,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
): Promise<void> => {
  if (Platform.OS !== 'web') {
    throw new Error('Razorpay checkout is only available on web platform');
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay payment gateway');
  }

  const Razorpay = (window as any).Razorpay;

  const options = {
    key: orderData.key_id,
    amount: orderData.amount_paise,
    currency: orderData.currency,
    name: 'Brain Pay - EdTech',
    description: `${orderData.plan?.toUpperCase()} Subscription`,
    order_id: orderData.order_id,
    
    handler: (response: any) => {
      console.log('[Subscription] 💳 Payment successful:', response.razorpay_payment_id);
      onSuccess(response);
    },

    prefill: {
      name: userName,
      email: userEmail,
    },

    theme: {
      color: '#3b82f6',
      backdrop_color: 'rgba(0, 0, 0, 0.7)',
    },

    modal: {
      ondismiss: () => {
        console.log('[Subscription] ❌ Payment cancelled by user');
        onFailure(new Error('Payment cancelled'));
      },
    },

    notes: {
      user_id: userId,
      plan: orderData.plan,
    },
  };

  console.log('[Subscription] 🚀 Opening Razorpay checkout...');
  const razorpayInstance = new Razorpay(options);
  razorpayInstance.open();
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
