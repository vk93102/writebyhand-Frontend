import { api } from './api';

/**
 * Check subscription status for a user
 * CRITICAL: Called before every feature access
 * 
 * API: GET /api/subscriptions/status/?user_id=<user_id>
 * @param userId - User ID
 * @returns Subscription status
 */
export const checkSubscriptionStatus = async (userId: string) => {
  try {
    // console.log('[Subscription Check] Checking subscription status for user:', userId);

    const response = await api.get('/subscriptions/status/', {
      params: { user_id: userId },
    });

    // console.log('[Subscription Check] Status response:', response.data);

    const status = response.data;

    return {
      success: true,
      userId: status.user_id,
      currentPlan: status.current_plan, // 'free' | 'plan_a_trial' | 'plan_b_monthly'
      isActive: status.is_active,
      isTrial: status.is_trial,
      periodStart: status.period_start,
      periodEnd: status.period_end,
      daysRemaining: status.days_remaining,
      autoRenewalEnabled: status.auto_renewal_enabled,
      status: status.status, // 'active' | 'inactive'
      canAccess: status.is_active === true, // TRUE only if active
    };
  } catch (error: any) {
    console.error('[Subscription Check] Error:', {
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });

    // Return default: no access
    return {
      success: false,
      canAccess: false,
      currentPlan: 'free',
      isActive: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Get all available subscription plans
 * 
 * API: GET /api/subscriptions/plans/
 * @returns List of available plans
 */
export const getAvailablePlans = async () => {
  try {
    console.log('[Subscription Check] Fetching available plans');

    const response = await api.get('/subscriptions/plans/');

    console.log('[Subscription Check] Plans response:', response.data);

    return {
      success: true,
      plans: response.data.plans || response.data,
    };
  } catch (error: any) {
    console.error('[Subscription Check] Error fetching plans:', {
      status: error.response?.status,
      message: error.message,
    });

    return {
      success: false,
      plans: [],
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Subscribe to a plan
 * 
 * API: POST /api/subscriptions/subscribe/
 * @param userId - User ID
 * @param plan - Plan ID ('plan_a_trial' or 'plan_b_monthly')
 * @returns Subscription response with payment link
 */
export const subscribeToPlan = async (userId: string, plan: string) => {
  try {
    console.log('[Subscription Check] Subscribing to plan:', { userId, plan });

    const response = await api.post('/subscriptions/subscribe/', {
      user_id: userId,
      plan,
    });

    console.log('[Subscription Check] Subscribe response:', response.data);

    return {
      success: true,
      subscriptionId: response.data.subscription_id,
      shortUrl: response.data.short_url,
      orderId: response.data.order_id,
      razorpayKey: response.data.razorpay_key,
    };
  } catch (error: any) {
    console.error('[Subscription Check] Error subscribing:', {
      status: error.response?.status,
      message: error.message,
    });

    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Confirm payment after Razorpay transaction
 * 
 * API: POST /api/subscriptions/confirm-payment/
 * @param userId - User ID
 * @param plan - Plan ID
 * @param razorpayPaymentId - Razorpay payment ID
 * @param razorpayOrderId - Razorpay order ID
 * @returns Confirmation response
 */
export const confirmPayment = async (
  userId: string,
  plan: string,
  razorpayPaymentId: string,
  razorpayOrderId: string
) => {
  try {
    console.log('[Subscription Check] Confirming payment:', {
      userId,
      plan,
      razorpayPaymentId,
      razorpayOrderId,
    });

    const response = await api.post('/subscriptions/confirm-payment/', {
      user_id: userId,
      plan,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
    });

    console.log('[Subscription Check] Payment confirmation response:', response.data);

    return {
      success: true,
      subscriptionId: response.data.subscription_id,
      status: response.data.status,
    };
  } catch (error: any) {
    console.error('[Subscription Check] Error confirming payment:', {
      status: error.response?.status,
      message: error.message,
    });

    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Check if user can access a specific feature
 * Enforces subscription gating
 * 
 * @param userId - User ID
 * @param featureName - Feature name ('predicted-questions' | 'flashcards' | 'quiz')
 * @returns Whether user can access this feature
 */
export const canAccessFeature = async (
  userId: string,
  featureName: 'predicted-questions' | 'flashcards' | 'quiz'
): Promise<boolean> => {
  try {
    const status = await checkSubscriptionStatus(userId);

    if (!status.success || !status.canAccess) {
      console.warn(`[Subscription Check] User ${userId} cannot access ${featureName} - subscription inactive`);
      return false;
    }

    console.log(`[Subscription Check] User ${userId} can access ${featureName}`);
    return true;
  } catch (error) {
    console.error(`[Subscription Check] Error checking feature access for ${featureName}:`, error);
    return false; // Deny access on error
  }
};

export default {
  checkSubscriptionStatus,
  getAvailablePlans,
  subscribeToPlan,
  confirmPayment,
  canAccessFeature,
};
