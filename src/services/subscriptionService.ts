import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';


export interface SubscriptionPlan {
  id: string;
  name: string;
  first_month_price: number;
  recurring_price: number;
  features: Record<string, any>;
  billing_cycle?: string;
  trial_days?: number;
  description?: string;
}

export interface SubscriptionStatus {
  plan: string;
  subscription_id: string;
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'inactive';
  subscription_status?: 'active' | 'trial' | 'past_due' | 'cancelled' | 'inactive';
  unlimited_access?: boolean;
  is_trial?: boolean;
  trial_end_date?: string | null;
  next_billing_date?: string | null;
  last_payment_date?: string | null;
  user_id?: string;
  current_period_end?: string;
  created_at?: string;
  features_unlocked?: string[];
}

export interface UsageStatus {
  allowed: boolean;
  unlimited?: boolean;
  reason: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  percentage_used?: number;
  upgrade_required?: boolean;
  upgrade_message?: string;
}

export interface DashboardFeature {
  display_name: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
  percentage_used: number;
}

export interface DashboardData {
  user_id: string;
  plan: string;
  subscription_id: string;
  features: Record<string, DashboardFeature>;
  billing: {
    first_month_price: number;
    recurring_price: number;
    is_trial: boolean;
    trial_end_date?: string | null;
    subscription_status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'inactive';
    subscription_start_date: string;
    next_billing_date?: string | null;
    last_payment_date?: string | null;
  };
}

export interface FeatureCheckRequest {
  feature: string;
}

export interface FeatureCheckResponse {
  success: boolean;
  message?: string;
  status: UsageStatus;
  error?: string;
}

export interface FeatureRecordRequest {
  feature: string;
  input_size?: number;
  usage_type?: string;
  metadata?: Record<string, any>;
}

export interface FeatureRecordResponse {
  success: boolean;
  message: string;
  usage?: UsageStatus;
  updated_usage?: UsageStatus;
  error?: string;
}

export interface FeatureStatusResponse {
  success: boolean;
  feature: string;
  status: UsageStatus;
  error?: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_period: string;
  trial_period_days?: number;
  is_trial_plan?: boolean;
}

export interface CreateSubscriptionRequest {
  user_id: string;
  plan: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  short_url: string;
  subscription_id: string;
  order_id?: string;
  error?: string;
}

export interface PaymentValidationResponse {
  validated: boolean;
  subscription_id: string;
  status: SubscriptionStatus;
  checks: {
    unlimited_access: boolean;
    payment_confirmed: boolean;
    account_active: boolean;
  };
  error?: string;
}

export interface RazorpayKeyResponse {
  razorpay_key: string;
  success: boolean;
}

export interface UpgradeTooltip {
  title: string;
  message: string;
  features?: string[];
  pricing?: {
    trial_amount: number;
    trial_days: number;
    recurring_amount: number;
    recurring_period: string;
  };
}

// ==================== Subscription Service Class ====================

class SubscriptionServiceClass {
  private apiClient: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = this.getApiUrl();
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to include auth token or user ID
    this.apiClient.interceptors.request.use(async (config) => {
      // Try to use Bearer token if available via auth header
      const authHeader = authService.getAuthHeader();
      if (authHeader.Authorization) {
        config.headers.Authorization = authHeader.Authorization;
      } else {
        // Fallback to X-User-ID if no token
        const user = authService.getCurrentUser();
        if (user) {
          const userId = typeof user === 'string' ? user : user.id;
          config.headers['X-User-ID'] = userId;
        }
      }
      return config;
    });

    // Add response error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.warn('Unauthorized access - redirecting to login');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get API URL based on platform
   */
  private getApiUrl(): string {
    return 'https://ed-tech-backend-tzn8.onrender.com/api';
  }

  // ==================== SUBSCRIPTION STATUS APIs ====================

  /**
   * Get current subscription status
   * GET /api/subscriptions/status/?user_id=...
   */
  async getSubscriptionStatus(userId?: string): Promise<SubscriptionStatus> {
    try {
      const currentUser = userId || (await authService.getCurrentUser());
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await this.apiClient.get<SubscriptionStatus>(
        '/subscriptions/status/',
        {
          params: { user_id: currentUser.id || currentUser },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch subscription status'
      );
    }
  }

  /**
   * Get list of available subscription plans
   * GET /api/subscriptions/plans/
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await this.apiClient.get<{
        success: boolean;
        plans: SubscriptionPlan[];
      }>('/subscriptions/plans/');

      return response.data.plans;
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch subscription plans'
      );
    }
  }

  // ==================== FEATURE USAGE APIs ====================

  /**
   * Check if user can use a feature (before execution)
   * POST /api/usage/check/
   */
  async checkFeatureAvailability(feature: string): Promise<FeatureCheckResponse> {
    try {
      const response = await this.apiClient.post<FeatureCheckResponse>(
        '/usage/check/',
        { feature }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error checking feature availability:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to check feature availability'
      );
    }
  }

  /**
   * Record feature usage (after successful execution)
   * POST /api/usage/record/
   */
  async recordFeatureUsage(
    feature: string,
    inputSize?: number,
    usageType?: string,
    metadata?: Record<string, any>
  ): Promise<FeatureRecordResponse> {
    try {
      const body: any = { feature };
      
      if (inputSize !== undefined) {
        body.input_size = inputSize;
      }
      if (usageType !== undefined) {
        body.usage_type = usageType;
      }
      if (metadata) {
        body.metadata = metadata;
      }

      const response = await this.apiClient.post<FeatureRecordResponse>(
        '/usage/record/',
        body
      );

      return response.data;
    } catch (error: any) {
      console.error('Error recording feature usage:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to record feature usage'
      );
    }
  }

  /**
   * Get dashboard data with all feature usage information
   * GET /api/usage/dashboard/
   */
  async getDashboard(): Promise<DashboardData> {
    try {
      const response = await this.apiClient.get<{
        success: boolean;
        dashboard: DashboardData;
      }>('/usage/dashboard/');

      return response.data.dashboard;
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch dashboard'
      );
    }
  }

  /**
   * Get detailed usage statistics for current user
   * GET /api/usage/statistics/
   */
  async getUsageStatistics(): Promise<Record<string, UsageStatus>> {
    try {
      const response = await this.apiClient.get<{
        success: boolean;
        statistics: Record<string, UsageStatus>;
      }>('/usage/statistics/');

      return response.data.statistics;
    } catch (error: any) {
      console.error('Error fetching usage statistics:', error);
      // Fallback to dashboard if statistics endpoint doesn't exist
      try {
        const dashboard = await this.getDashboard();
        const stats: Record<string, UsageStatus> = {};
        
        Object.entries(dashboard.features).forEach(([key, feature]) => {
          stats[key] = {
            allowed: feature.remaining !== null && feature.remaining > 0,
            reason: feature.remaining === null ? 'Unlimited' : `${feature.used}/${feature.limit}`,
            limit: feature.limit,
            used: feature.used,
            remaining: feature.remaining,
            unlimited: feature.unlimited,
            percentage_used: feature.percentage_used,
          };
        });
        
        return stats;
      } catch (dashboardError) {
        throw new Error(
          error.response?.data?.error || 'Failed to fetch usage statistics'
        );
      }
    }
  }

  /**
   * Get feature status for a specific feature
   * GET /api/usage/feature/{feature}/
   */
  async getFeatureStatus(feature: string): Promise<FeatureStatusResponse> {
    try {
      const response = await this.apiClient.get<FeatureStatusResponse>(
        `/usage/feature/${feature}/`
      );

      return response.data;
    } catch (error: any) {
      console.error(`Error fetching ${feature} status:`, error);
      throw new Error(
        error.response?.data?.error || `Failed to fetch ${feature} status`
      );
    }
  }

  // ==================== SUBSCRIPTION MANAGEMENT APIs ====================

  /**
   * Create a new subscription
   * POST /api/subscriptions/create/
   */
  async createSubscription(
    plan: string
  ): Promise<CreateSubscriptionResponse> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await this.apiClient.post<CreateSubscriptionResponse>(
        '/subscriptions/create/',
        {
          user_id: currentUser.id || currentUser,
          plan,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to create subscription'
      );
    }
  }

  /**
   * Validate subscription after payment
   * GET /api/subscriptions/validate/?user_id=...
   */
  async validateSubscription(userId?: string): Promise<PaymentValidationResponse> {
    try {
      const currentUser = userId || (await authService.getCurrentUser());
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await this.apiClient.get<PaymentValidationResponse>(
        '/subscriptions/validate/',
        {
          params: { user_id: currentUser.id || currentUser },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error validating subscription:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to validate subscription'
      );
    }
  }

  /**
   * Cancel user's subscription
   * POST /api/subscriptions/cancel/
   */
  async cancelSubscription(reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await this.apiClient.post<{
        success: boolean;
        message: string;
      }>('/subscriptions/cancel/', {
        user_id: currentUser.id || currentUser,
        reason,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to cancel subscription'
      );
    }
  }

  /**
   * Upgrade to a higher plan
   * POST /api/subscriptions/upgrade/
   */
  async upgradePlan(newPlan: string): Promise<CreateSubscriptionResponse> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await this.apiClient.post<CreateSubscriptionResponse>(
        '/subscriptions/upgrade/',
        {
          user_id: currentUser.id || currentUser,
          new_plan: newPlan,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to upgrade plan'
      );
    }
  }

  // ==================== PAYMENT APIs ====================

  /**
   * Get Razorpay public key
   * GET /api/subscriptions/razorpay-key/
   */
  async getRazorpayKey(): Promise<RazorpayKeyResponse> {
    try {
      const response = await this.apiClient.get<RazorpayKeyResponse>(
        '/subscriptions/razorpay-key/'
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Razorpay key:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch Razorpay key'
      );
    }
  }

  /**
   * Get payment history
   * GET /api/subscriptions/payment-history/
   */
  async getPaymentHistory(): Promise<any[]> {
    try {
      const response = await this.apiClient.get<{
        success: boolean;
        payments: any[];
      }>('/subscriptions/payment-history/');

      return response.data.payments;
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch payment history'
      );
    }
  }

  /**
   * Update payment method
   * POST /api/subscriptions/update-payment-method/
   */
  async updatePaymentMethod(
    razorpayPaymentId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.post<{
        success: boolean;
        message: string;
      }>('/subscriptions/update-payment-method/', {
        razorpay_payment_id: razorpayPaymentId,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to update payment method'
      );
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if user has unlimited access
   */
  async hasUnlimitedAccess(): Promise<boolean> {
    try {
      const dashboard = await this.getDashboard();
      return Object.values(dashboard.features).some(f => f.unlimited);
    } catch {
      return false;
    }
  }

  /**
   * Get formatted subscription info
   */
  async getFormattedSubscriptionInfo(): Promise<string> {
    try {
      const status = await this.getSubscriptionStatus();

      let info = `Plan: ${status.plan.toUpperCase()}\n`;
      info += `Status: ${status.status.toUpperCase()}\n`;

      if (status.is_trial && status.trial_end_date) {
        const endDate = new Date(status.trial_end_date);
        info += `Trial ends: ${endDate.toLocaleDateString()}\n`;
      }

      if (status.next_billing_date) {
        const billingDate = new Date(status.next_billing_date);
        info += `Next billing: ${billingDate.toLocaleDateString()}\n`;
      }

      return info;
    } catch {
      return 'Unable to fetch subscription info';
    }
  }

  /**
   * Get days remaining in trial
   */
  getDaysRemainingInTrial(trialEndDate: string | null): number {
    if (!trialEndDate) return 0;

    const end = new Date(trialEndDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Format subscription status for display
   */
  formatStatusBadge(status: string): {
    label: string;
    color: string;
    icon: string;
  } {
    const badges: Record<
      string,
      { label: string; color: string; icon: string }
    > = {
      active: { label: '✅ ACTIVE', color: '#10b981', icon: 'check-circle' },
      trial: { label: '⏱️ TRIAL', color: '#3b82f6', icon: 'clock' },
      past_due: {
        label: '⚠️ PAST DUE',
        color: '#ef4444',
        icon: 'warning',
      },
      cancelled: {
        label: '❌ CANCELLED',
        color: '#6b7280',
        icon: 'cancel',
      },
      inactive: {
        label: 'INACTIVE',
        color: '#6b7280',
        icon: 'info',
      },
    };

    return (
      badges[status] || { label: 'UNKNOWN', color: '#6b7280', icon: 'help' }
    );
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(status: SubscriptionStatus): boolean {
    return status.status === 'active' || status.status === 'trial';
  }

  /**
   * Get upgrade recommendation message
   */
  getUpgradeMessage(featureName: string): string {
    return `You've reached your monthly limit for ${featureName}. Upgrade to unlimited access for just ₹1 for 30 days, then ₹99/month.`;
  }
}

// ==================== Export Singleton Instance ====================

export const subscriptionService = new SubscriptionServiceClass();
