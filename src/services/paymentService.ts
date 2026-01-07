/**
 * Razorpay Payment Service
 * Handles payment processing on the frontend
 * Integrates with Razorpay checkout and backend payment API
 */

import axios from 'axios';
import { authService } from './authService';

interface PaymentOrder {
  order_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  key_id: string;
  plan: string;
  payment_record_id: string;
}

interface PaymentVerificationPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  auto_pay?: boolean;
}

interface PaymentResponse {
  success: boolean;
  message?: string;
  order_id?: string;
  payment_id?: string;
  status?: string;
  error?: string;
  details?: string;
}

interface PaymentHistory {
  success: boolean;
  total_payments: number;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    razorpay_payment_id: string;
    created_at: string;
    billing_cycle: {
      start: string;
      end: string;
    };
  }>;
}

/**
 * Load Razorpay script dynamically
 */
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay script is already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

/**
 * Payment Service Class
 * Manages all payment-related operations with Razorpay
 */
class PaymentService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8003/api';
  }

  /**
   * Create a payment order
   * Called when user initiates payment
   */
  async createPaymentOrder(plan: string = 'premium', autoPay: boolean = false): Promise<PaymentOrder | null> {
    try {
      const token = await authService.getAccessToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/payment/create-order/`,
        {
          plan,
          auto_pay: autoPay,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to create payment order'
      );
    }
  }

  /**
   * Initialize Razorpay checkout
   * Displays payment modal to user
   */
  async initiatePayment(order: PaymentOrder): Promise<any> {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay checkout');
    }

    return new Promise((resolve, reject) => {
      const Razorpay = (window as any).Razorpay;

      const options = {
        key: order.key_id, // Razorpay Key ID from backend
        amount: order.amount_paise, // Amount in paise (100 paise = 1 INR)
        currency: order.currency,
        name: 'EdTech Solver',
        description: `${order.plan.toUpperCase()} Subscription`,
        order_id: order.order_id, // Order ID from backend
        
        // Callback handlers
        handler: (response: any) => {
          // Payment successful - verify signature on backend
          resolve(response);
        },

        prefill: {
          name: authService.getUserName() || '',
          email: authService.getUserEmail() || '',
        },

        // Payment method options
        method: {
          emandate: true,
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
        },

        // Subscription/Auto-pay option (if enabled)
        ...(order.plan === 'premium_annual' && {
          recurring: '1',
        }),

        // Theme customization
        theme: {
          color: '#3b82f6', // Blue primary color
          backdrop_color: 'rgba(0, 0, 0, 0.7)',
        },

        // Retry settings
        retry: {
          enabled: true,
          max_count: 3,
        },

        // Error callback
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
        },

        // Callback when payment fails
        notes: {
          note_key_1: 'Payment for EdTech Premium',
          note_key_2: `Plan: ${order.plan}`,
        },
      };

      try {
        const razorpayCheckout = new Razorpay(options);
        razorpayCheckout.open();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process full payment flow
   * 1. Create order on backend
   * 2. Show Razorpay checkout
   * 3. Verify payment signature
   */
  async processPayment(plan: string = 'premium', autoPay: boolean = false): Promise<PaymentResponse> {
    try {
      // Step 1: Create payment order
      const order = await this.createPaymentOrder(plan, autoPay);
      if (!order) {
        throw new Error('Failed to create payment order');
      }

      // Step 2: Show Razorpay checkout
      const paymentResult = await this.initiatePayment(order);

      // Step 3: Verify payment on backend
      const verificationResult = await this.verifyPayment(
        order.order_id,
        paymentResult.razorpay_payment_id,
        paymentResult.razorpay_signature,
        autoPay
      );

      return verificationResult;
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message || 'Payment failed',
        details: error.response?.data?.details || '',
      };
    }
  }

  /**
   * Verify payment signature with backend
   */
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    autoPay: boolean = false
  ): Promise<PaymentResponse> {
    try {
      const token = await authService.getAccessToken();

      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/payment/verify/`,
        {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          auto_pay: autoPay,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: 'Payment verification failed',
        details: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId: string): Promise<PaymentResponse> {
    try {
      const token = await authService.getAccessToken();

      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(
        `${this.apiBaseUrl}/payment/status/`,
        {
          params: { order_id: orderId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      return {
        success: false,
        error: 'Failed to get payment status',
      };
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(): Promise<PaymentHistory> {
    try {
      const token = await authService.getAccessToken();

      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(
        `${this.apiBaseUrl}/payment/history/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      return {
        success: false,
        total_payments: 0,
        payments: [],
      };
    }
  }

  /**
   * Request refund for a payment
   */
  async requestRefund(paymentId: string, reason: string = 'User requested refund'): Promise<PaymentResponse> {
    try {
      const token = await authService.getAccessToken();

      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/payment/refund/`,
        {
          payment_id: paymentId,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error requesting refund:', error);
      return {
        success: false,
        error: 'Refund request failed',
        details: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get Razorpay public key
   */
  async getRazorpayKey(): Promise<string> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/payment/razorpay-key/`
      );

      return response.data.key_id;
    } catch (error: any) {
      console.error('Error getting Razorpay key:', error);
      throw new Error('Failed to load payment gateway');
    }
  }

  /**
   * Handle payment timeout
   */
  handlePaymentTimeout(): void {
    console.warn('Payment timeout - session expired');
    // Clear order data and redirect to payment screen
  }

  /**
   * Get pricing information
   */
  getPricingInfo(): Record<string, any> {
    return {
      premium: {
        amount: 199,
        currency: 'INR',
        period: 'Monthly',
        features: [
          'Unlimited questions',
          'Unlimited quizzes',
          'Unlimited flashcards',
          'Advanced AI features',
        ],
      },
      premium_annual: {
        amount: 1990,
        currency: 'INR',
        period: 'Annual',
        features: [
          'Unlimited questions',
          'Unlimited quizzes',
          'Unlimited flashcards',
          'Advanced AI features',
          'Priority support',
        ],
        savings: '₹398 (Save 17%)',
      },
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for testing/custom usage
export default PaymentService;
