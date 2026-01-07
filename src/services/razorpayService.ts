/**
 * Razorpay Payment Service
 * React Native integration for Razorpay Payment Gateway
 * 
 * @author EdTech Platform
 * @date December 20, 2024
 */
import RazorpayCheckout from 'react-native-razorpay';
import { API_BASE_URL } from '../config/api';

export interface PaymentOptions {
  amount: number;  // Amount in rupees
  currency?: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
}

export interface RazorpayOrder {
  order_id: string;
  amount: number;  // Amount in paise (smallest currency unit)
  currency: string;
  key_id: string;
}

export interface PaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Create payment order on backend
 * 
 * Step 1 of payment flow: Server-side order creation
 * 
 * @param userId - User identifier
 * @param amount - Amount in rupees (e.g., 299.99)
 * @param notes - Optional metadata
 * @returns Promise<RazorpayOrder>
 */
export const createPaymentOrder = async (
  userId: string,
  amount: number,
  notes: Record<string, any> = {}
): Promise<RazorpayOrder> => {
  try {
    console.log(`Creating payment order: ₹${amount} for user ${userId}`);
    
    const response = await fetch(`${API_BASE_URL}/payment/create-order/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        amount: amount,
        currency: 'INR',
        notes: notes,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create payment order');
    }

    console.log('Order created successfully:', data.order_id);

    return {
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency,
      key_id: data.key_id,
    };
  } catch (error: any) {
    console.error('Create order error:', error);
    throw new Error(error.message || 'Failed to create payment order');
  }
};

/**
 * Open Razorpay Checkout
 * 
 * Step 2 of payment flow: Client-side payment collection
 * 
 * Opens the Razorpay payment modal with configured options
 * Handles the payment process and returns payment details on success
 * 
 * @param order - Order details from backend
 * @param options - Checkout customization options
 * @returns Promise<PaymentResult>
 */
export const openRazorpayCheckout = async (
  order: RazorpayOrder,
  options: PaymentOptions
): Promise<PaymentResult> => {
  try {
    // Construct Razorpay checkout options as per official docs
    const checkoutOptions = {
      key: order.key_id,                    // Razorpay Key ID (public)
      amount: order.amount,                 // Amount in smallest unit (paise)
      currency: order.currency,             // Currency code (INR)
      order_id: order.order_id,             // Order ID from backend
      name: 'EdTech Platform',              // Business name
      description: options.description,      // Transaction description
      image: 'https://your-logo-url.com/logo.png',  // Company logo
      
      // Prefill customer details (improves conversion)
      prefill: {
        name: options.prefill?.name || '',
        email: options.prefill?.email || '',
        contact: options.prefill?.contact || '',
      },
      
      // Custom metadata
      notes: options.notes || {},
      
      // UI customization
      theme: {
        color: options.theme?.color || '#6366F1',  // Brand color
      },
    };

    console.log('Opening Razorpay Checkout...');
    console.log('Options:', {
      ...checkoutOptions,
      key: checkoutOptions.key.substring(0, 15) + '...',  // Don't log full key
    });

    // Open Razorpay Checkout (returns Promise)
    const paymentData = await RazorpayCheckout.open(checkoutOptions);

    console.log('Payment successful!');
    console.log('Payment ID:', paymentData.razorpay_payment_id);

    return {
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_signature: paymentData.razorpay_signature,
    };
  } catch (error: any) {
    console.error('Razorpay Checkout error:', error);

    // Handle specific error codes
    if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
      throw new Error('Payment cancelled by user');
    }

    if (error.code === RazorpayCheckout.NETWORK_ERROR) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw new Error(error.description || error.message || 'Payment failed');
  }
};

/**
 * Verify payment on backend
 * 
 * Step 3 of payment flow: Server-side signature verification
 * 
 * CRITICAL SECURITY STEP: Verifies payment authenticity using HMAC SHA256
 * This prevents fraudulent payments from being accepted
 * 
 * @param paymentResult - Payment details from Razorpay
 * @returns Promise<boolean>
 */
export const verifyPayment = async (
  paymentResult: PaymentResult
): Promise<boolean> => {
  try {
    console.log('Verifying payment signature...');
    
    const response = await fetch(`${API_BASE_URL}/payment/verify-payment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Payment verification failed');
    }

    console.log('✅ Payment verified successfully');
    console.log('Payment ID:', data.payment_id);
    console.log('Status:', data.status);
    
    return true;
  } catch (error: any) {
    console.error('Payment verification error:', error);
    throw new Error(error.message || 'Payment verification failed');
  }
};

/**
 * Complete payment flow (All 3 steps combined)
 * 
 * This is the recommended method - handles entire flow:
 * 1. Creates order on backend
 * 2. Opens Razorpay checkout
 * 3. Verifies payment signature
 * 
 * @param userId - User identifier
 * @param amount - Amount in rupees
 * @param options - Payment options
 * @returns Promise<PaymentResult>
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await processPayment('user123', 299.99, {
 *     description: 'Premium Subscription',
 *     prefill: {
 *       name: 'John Doe',
 *       email: 'john@example.com',
 *       contact: '+919876543210'
 *     },
 *     notes: {
 *       plan: 'premium',
 *       duration: 'monthly'
 *     }
 *   });
 *   console.log('Payment successful!', result.razorpay_payment_id);
 * } catch (error) {
 *   console.error('Payment failed:', error.message);
 * }
 * ```
 */
export const processPayment = async (
  userId: string,
  amount: number,
  options: PaymentOptions
): Promise<PaymentResult> => {
  try {
    console.log('=== Starting Payment Process ===');
    console.log(`User: ${userId}`);
    console.log(`Amount: ₹${amount}`);
    
    // Step 1: Create order on backend
    console.log('\n[Step 1/3] Creating order...');
    const order = await createPaymentOrder(userId, amount, options.notes);
    console.log(`✅ Order created: ${order.order_id}`);

    // Step 2: Open Razorpay checkout
    console.log('\n[Step 2/3] Opening payment gateway...');
    const paymentResult = await openRazorpayCheckout(order, options);
    console.log(`✅ Payment completed: ${paymentResult.razorpay_payment_id}`);

    // Step 3: Verify payment on backend
    console.log('\n[Step 3/3] Verifying payment...');
    await verifyPayment(paymentResult);
    console.log('✅ Payment verified');

    console.log('\n=== Payment Process Complete ===\n');
    return paymentResult;
    
  } catch (error: any) {
    console.error('\n❌ Payment process failed:', error.message);
    throw error;
  }
};

/**
 * Get payment status for an order
 * 
 * @param orderId - Razorpay order ID
 * @returns Promise<any>
 */
export const getPaymentStatus = async (orderId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/status/${orderId}/`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch payment status');
    }

    return data;
  } catch (error: any) {
    console.error('Get payment status error:', error);
    throw error;
  }
};

/**
 * Get payment history for user
 * 
 * @param userId - User identifier
 * @returns Promise<any[]>
 */
export const getPaymentHistory = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/history/?user_id=${userId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch payment history');
    }

    return data.payments || [];
  } catch (error: any) {
    console.error('Get payment history error:', error);
    throw error;
  }
};

export default {
  createPaymentOrder,
  openRazorpayCheckout,
  verifyPayment,
  processPayment,
  getPaymentStatus,
  getPaymentHistory,
};
