/**
 * Enhanced Payment Service
 * Handles Razorpay payments with duplicate subscription prevention
 * Production-level service with comprehensive validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { premiumFeatureService } from './premiumFeatureService';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes: {
    userId: string;
    planId: string;
  };
}

export interface PaymentVerification {
  success: boolean;
  message: string;
  orderId: string;
  paymentId: string;
  signature: string;
  subscriptionId: string;
}

class EnhancedPaymentService {
  private pendingPayments = new Map<string, PaymentOrder>();

  /**
   * Create payment order with validation
   */
  async createPaymentOrder(
    userId: string,
    planId: string,
    amount: number
  ): Promise<PaymentOrder> {
    try {
      console.log('[PaymentService] Creating payment order:', { userId, planId, amount });

      // CRITICAL: Check if user already has active subscription
      const hasActive = await premiumFeatureService.hasActiveSubscription(userId);
      if (hasActive) {
        const error = new Error('USER_ALREADY_SUBSCRIBED');
        console.error('[PaymentService] User already has active subscription');
        throw error;
      }

      // Check if payment is pending for this user
      if (this.pendingPayments.has(userId)) {
        console.warn('[PaymentService] User has pending payment, clearing old one');
        this.pendingPayments.delete(userId);
      }

      // Create order on backend
      const response = await api.post('/payments/create-order/', {
        user_id: userId,
        plan_id: planId,
        amount,
        currency: 'INR',
      });

      const order: PaymentOrder = {
        id: response.data.order_id,
        amount,
        currency: 'INR',
        receipt: response.data.receipt,
        notes: { userId, planId },
      };

      // Store pending payment
      this.pendingPayments.set(userId, order);

      // Cache order info
      await AsyncStorage.setItem(
        `pending_payment_${userId}`,
        JSON.stringify(order)
      );

      console.log('[PaymentService] Order created successfully:', order.id);
      return order;
    } catch (error: any) {
      console.error('[PaymentService] Error creating payment order:', {
        error: error.message,
        userId,
        planId,
      });

      // Check for specific error
      if (error.message === 'USER_ALREADY_SUBSCRIBED') {
        throw new Error('You already have an active subscription. Please wait for it to expire or contact support.');
      }

      throw new Error(error.response?.data?.error || 'Failed to create payment order');
    }
  }

  /**
   * Verify and complete payment with comprehensive validation
   */
  async verifyPayment(
    userId: string,
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<PaymentVerification> {
    try {
      console.log('[PaymentService] Verifying payment:', { userId, orderId, paymentId });

      // Verify with backend
      const response = await api.post('/payments/verify-payment/', {
        order_id: orderId,
        payment_id: paymentId,
        signature,
        user_id: userId,
      });

      // Clear pending payment
      this.pendingPayments.delete(userId);
      await AsyncStorage.removeItem(`pending_payment_${userId}`);

      const result: PaymentVerification = {
        success: response.data.success,
        message: response.data.message,
        orderId: response.data.order_id,
        paymentId: response.data.payment_id,
        signature: response.data.signature,
        subscriptionId: response.data.subscription_id,
      };

      console.log('[PaymentService] Payment verified successfully');
      
      // Refresh premium status after successful payment
      setTimeout(() => {
        premiumFeatureService.refreshStatus(userId).catch(err => 
          console.error('[PaymentService] Error refreshing status after payment:', err)
        );
      }, 1000);

      return result;
    } catch (error: any) {
      console.error('[PaymentService] Error verifying payment:', {
        error: error.message,
        orderId,
      });

      throw new Error(error.response?.data?.error || 'Payment verification failed');
    }
  }

  /**
   * Check if user has pending payment
   */
  async hasPendingPayment(userId: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(`pending_payment_${userId}`);
      return cached !== null || this.pendingPayments.has(userId);
    } catch (error) {
      console.error('[PaymentService] Error checking pending payment:', error);
      return false;
    }
  }

  /**
   * Cancel pending payment
   */
  async cancelPendingPayment(userId: string): Promise<void> {
    try {
      console.log('[PaymentService] Cancelling pending payment for user:', userId);
      
      this.pendingPayments.delete(userId);
      await AsyncStorage.removeItem(`pending_payment_${userId}`);
      
      console.log('[PaymentService] Pending payment cancelled');
    } catch (error) {
      console.error('[PaymentService] Error cancelling pending payment:', error);
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      console.log('[PaymentService] Fetching payment history for user:', userId);
      
      const response = await api.get(`/payments/history/${userId}`);
      return response.data.payments || [];
    } catch (error: any) {
      console.error('[PaymentService] Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(userId: string, planId: string, amount: number): Promise<PaymentOrder> {
    try {
      console.log('[PaymentService] Retrying payment for user:', userId);

      // Clear previous pending payment
      await this.cancelPendingPayment(userId);

      // Create new order
      return await this.createPaymentOrder(userId, planId, amount);
    } catch (error) {
      console.error('[PaymentService] Error retrying payment:', error);
      throw error;
    }
  }

  /**
   * Track payment completion
   */
  async trackPaymentCompletion(userId: string, success: boolean): Promise<void> {
    try {
      console.log('[PaymentService] Tracking payment completion:', { userId, success });
      
      await AsyncStorage.setItem(
        `last_payment_status_${userId}`,
        JSON.stringify({ success, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('[PaymentService] Error tracking payment:', error);
    }
  }
}

// Export singleton instance
export const enhancedPaymentService = new EnhancedPaymentService();
