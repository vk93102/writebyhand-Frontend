import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiQuizService } from '../quiz/GeminiQuizService';
import { geminiFlashcardService } from '../quiz/GeminiFlashcardService';
import { geminiPredictedQuestionsService } from '../quiz/GeminiPredictedQuestionsService';

// Dynamic API URL based on platform
const getApiUrl = () => {
  if (Platform.OS === 'android') {
    // Android uses the production backend
    return 'https://ed-tech-backend-tzn8.onrender.com/api';
  } else if (Platform.OS === 'ios') {
    // iOS uses the production backend
    return 'https://ed-tech-backend-tzn8.onrender.com/api';
  } else {
    // Web or other platforms - use production backend
    return 'https://ed-tech-backend-tzn8.onrender.com/api';
  }
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Auth token management (persist in AsyncStorage)
const AUTH_TOKEN_KEY = 'AUTH_TOKEN';

export const setAuthToken = async (token: string | null) => {
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      delete api.defaults.headers.common['Authorization'];
    }
  } catch (e) {
    // ignore storage errors for now
    console.warn('Failed to persist auth token', e);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

// Initialize token from storage
(async () => {
  const t = await getAuthToken();
  if (t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
})();

// Response interceptor to handle 401 globally (optional)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // token invalid or expired - clear stored token
      setAuthToken(null);
    }
    return Promise.reject(err);
  }
);

/**
 * Solve question using text input
 * @param text - The question text
 * @param maxResults - Number of search results (default: 5)
 */
export const solveQuestionByText = async (text: string, maxResults: number = 5) => {
  try {
    const response = await api.post('/solve/', {
      text: text,
      max_results: maxResults,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to solve question');
  }
};

/**
 * Solve question using image upload
 * @param imageUri - The local URI of the image
 * @param maxResults - Number of search results (default: 5)
 */
export const solveQuestionByImage = async (imageUri: string, maxResults: number = 5) => {
  try {
    const formData = new FormData();
    
    let imageFile: any;
    
    if (Platform.OS === 'web') {
      // For web, handle data URLs
      if (imageUri.startsWith('data:')) {
        // Convert data URL to blob
        const arr = imageUri.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        imageFile = new File([blob], 'question.jpg', { type: mime });
      } else {
        // For blob URLs, fetch the blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        imageFile = new File([blob], 'question.jpg', { type: 'image/jpeg' });
      }
    } else {
      // For mobile, use the uri directly
      imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'question.jpg',
      } as any;
    }
    
    formData.append('image', imageFile);
    formData.append('max_results', maxResults.toString());
    
    const response = await api.post('/solve/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to process image');
  }
};

/**
 * Check API health status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Health check failed');
  }
};

/**
 * Check status of all integrated services
 */
export const checkServiceStatus = async () => {
  try {
    const response = await api.get('/status/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Service status check failed');
  }
};

/**
 * Generate quiz from topic or document
 * Uses Gemini API directly
 * @param topic - The topic or text content
 * @param numQuestions - Number of questions to generate (default: 5)
 * @param difficulty - Difficulty level: easy, medium, hard (default: medium)
 * @param document - Optional document file
 */
export const generateQuiz = async (
  topic: string, 
  numQuestions: number = 5, 
  difficulty: string = 'medium',
  document?: any
) => {
  try {
    // Validate minimum text length
    if (!topic || topic.trim().length < 5) {
      throw new Error('Please provide text content');
    }
    
    // Use Gemini service directly
    const response = await geminiQuizService.generateQuiz({
      topic: topic,
      numQuestions: numQuestions,
      difficulty: difficulty,
      language: 'English',
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate quiz');
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate quiz');
  }
};

/**
 * Generate flashcards from topic or document
 * Uses Gemini API directly
 * @param topic - The topic or text content
 * @param numCards - Number of flashcards to generate (default: 10)
 * @param document - Optional document file
 */
export const generateFlashcards = async (
  topic: string, 
  numCards: number = 10,
  document?: any
) => {
  try {
    // Use Gemini service directly
    const response = await geminiFlashcardService.generateFlashcards({
      topic: topic || 'General Knowledge',
      numCards: numCards,
      language: 'english',
      difficulty: 'medium',
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate flashcards');
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate flashcards');
  }
};

/**
 * Generate comprehensive study material from document or text
 * Extracts: Topics, Concepts, Study Notes, Sample Questions
 * @param text - Text content (for direct text input)
 * @param document - Optional document file (.txt, .jpg, .png, .pdf)
 */
export const generateStudyMaterial = async (
  text?: string,
  document?: any
) => {
  try {
    const formData = new FormData();
    
    if (document) {
      // For web, document might already be a File object
      if (Platform.OS === 'web' && document.file) {
        formData.append('document', document.file);
      } else if (Platform.OS === 'web' && document instanceof File) {
        formData.append('document', document);
      } else {
        // For mobile platforms
        const documentFile = {
          uri: document.uri,
          type: document.mimeType || document.type || 'application/octet-stream',
          name: document.name || 'document',
        } as any;
        formData.append('document', documentFile);
      }
    } else if (text) {
      formData.append('text', text);
    } else {
      throw new Error('Please provide either text or a document');
    }
    
    const response = await api.post('/study-material/generate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate study material');
  }
};

/**
 * Summarize YouTube video
 * @param videoUrl - YouTube video URL
 * @param useDemo - Use demo mode for testing UI (optional)
 */
export const summarizeYouTubeVideo = async (videoUrl: string, useDemo: boolean = false) => {
  try {
    const url = useDemo ? '/youtube/summarize/?demo=true' : '/youtube/summarize/';
    const response = await api.post(url, {
      video_url: videoUrl,
    }, {
      timeout: 60000, // 60 seconds for real video processing
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to summarize video');
  }
};

/**
 * Check YouTube summarizer service health
 */
export const checkYouTubeHealth = async () => {
  try {
    const response = await api.get('/youtube/health/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'YouTube health check failed');
  }
};

/**
 * Generate predicted important questions from topic or document
 * Uses Gemini API directly
 * @param topic - Topic name (for text-based generation)
 * @param examType - Type of exam (General, JEE, NEET, etc.)
 * @param numQuestions - Number of questions (default: 5)
 * @param document - Optional document file
 */
export const generatePredictedQuestions = async (
  topic?: string,
  examType: string = 'General',
  numQuestions: number = 5,
  document?: any
) => {
  try {
    // Use Gemini service directly
    const response = await geminiPredictedQuestionsService.generatePredictedQuestions({
      topic: topic || 'General Knowledge',
      examType: examType,
      numQuestions: numQuestions,
      language: 'english',
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate predicted questions');
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate predicted questions');
  }
};

/**
 * SUBSCRIPTION & PRICING APIs
 */

/**
 * Play & Win API
 */

/**
 * Get today's Play & Win
 * @param userId - User identifier
 */
export const getDailyQuiz = async (userId: string) => {
  try {
    const response = await api.get('/daily-quiz/', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get Play & Win');
  }
};

/**
 * User authentication (register / login)
 */
export const registerUser = async (username: string, email: string, password: string, full_name?: string) => {
  try {
    const response = await api.post('/auth/register/', {
      username,
      email,
      password,
      full_name: full_name || '',
    });
    const data = response.data;
    const token = data?.token || data?.data?.token || (data?.data && data?.data?.access_token);
    if (token) await setAuthToken(token);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed');
  }
};

export const loginUser = async (usernameOrEmail: string, password: string) => {
  try {
    // Try to detect email format
    const payload: any = { password };
    const identifier = (usernameOrEmail || '').trim();
    if (identifier.includes('@')) payload.email = identifier.toLowerCase();
    else payload.username = identifier;

    const response = await api.post('/auth/login/', payload);
    const data = response.data;
    const token = data?.token || data?.data?.token || (data?.data && data?.data?.access_token);
    if (token) await setAuthToken(token);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed');
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    console.log('[Auth] POST /auth/request-password-reset/ - Requesting password reset for:', email);
    const response = await api.post('/auth/request-password-reset/', {
      email: email.toLowerCase().trim(),
    });
    console.log('[Auth] Password reset requested:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Auth] Password reset request error:', {
      status: error.response?.status,
      message: error.response?.data?.error,
      endpoint: 'POST /api/auth/request-password-reset/',
    });
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to request password reset');
  }
};

export const validateResetToken = async (token: string) => {
  try {
    console.log('[Auth] POST /auth/validate-reset-token/ - Validating reset token');
    const response = await api.post('/auth/validate-reset-token/', {
      token: token.trim(),
    });
    console.log('[Auth] Reset token valid:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Auth] Reset token validation error:', {
      status: error.response?.status,
      endpoint: 'POST /api/auth/validate-reset-token/',
    });
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Invalid or expired reset token');
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    console.log('[Auth] POST /auth/reset-password/ - Resetting password');
    const response = await api.post('/auth/reset-password/', {
      token: token.trim(),
      new_password: newPassword,
    });
    console.log('[Auth] Password reset successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Auth] Password reset error:', {
      status: error.response?.status,
      message: error.response?.data?.error,
      endpoint: 'POST /api/auth/reset-password/',
    });
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to reset password');
  }
};

/**
 * Start the Play & Win and award participation coins
 * @param userId - User identifier
 * @param quizId - Quiz id returned from getDailyQuiz
 */
export const startDailyQuiz = async (userId: string, quizId: string) => {
  try {
    const response = await api.post('/daily-quiz/start/', {
      user_id: userId,
      quiz_id: quizId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to start Play & Win');
  }
};

/**
 * Submit Play & Win answers
 * @param userId - User identifier
 * @param quizId - Quiz ID
 * @param answers - User's answers {question_id: option_index} e.g. {"1": 0, "2": 2}
 * @param timeTaken - Time taken in seconds
 */
export const submitDailyQuiz = async (
  userId: string,
  quizId: string,
  answers: Record<string, number>,
  timeTaken: number
) => {
  try {
    console.log('Submitting quiz:', { userId, quizId, answers, timeTaken });
    const response = await api.post('/daily-quiz/submit/', {
      user_id: userId,
      quiz_id: quizId,
      answers: answers,
      time_taken_seconds: timeTaken,
    });
    console.log('Submit response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Submit error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to submit quiz');
  }
};

/**
 * Get user's coin balance and stats
 * @param userId - User identifier
 */
export const getUserCoins = async (userId: string) => {
  try {
    const response = await api.get('/daily-quiz/coins/', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get coins');
  }
};

/**
 * Get user's quiz history
 * @param userId - User identifier
 * @param limit - Number of records to fetch
 */
export const getQuizHistory = async (userId: string, limit: number = 30) => {
  try {
    const response = await api.get('/daily-quiz/history/', {
      params: { user_id: userId, limit: limit }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get quiz history');
  }
};

export const getDailyQuizAttempt = async (userId: string, quizId: string) => {
  try {
    const response = await api.get('/daily-quiz/attempt/detail/', {
      params: { user_id: userId, quiz_id: quizId }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch quiz attempt details');
  }
};

/**
 * Get user profile including coins
 * Requires valid auth token in headers
 */
export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get user profile');
  }
};

/**
 * COIN WITHDRAWAL APIs
 */

/**
 * Request coin withdrawal - Convert coins to money
 * Conversion Rate: 10 coins = ₹1
 * Minimum Withdrawal: 100 coins (₹10)
 * 
 * @param userId - User identifier
 * @param coinsAmount - Amount of coins to withdraw (min 100)
 * @param payoutMethod - Payment method: 'upi' or 'bank'
 * @param accountHolderName - Account holder's name
 * @param upiId - UPI ID (required if payoutMethod is 'upi')
 * @param accountNumber - Bank account number (required if payoutMethod is 'bank')
 * @param ifscCode - IFSC code (required if payoutMethod is 'bank')
 */
export const requestCoinWithdrawal = async (
  userId: string,
  coinsAmount: number,
  payoutMethod: 'upi' | 'bank',
  accountHolderName: string,
  upiId?: string,
  accountNumber?: string,
  ifscCode?: string
) => {
  try {
    const payload: any = {
      user_id: userId,
      coins_amount: coinsAmount,
      payout_method: payoutMethod,
      account_holder_name: accountHolderName,
    };

    if (payoutMethod === 'upi' && upiId) {
      payload.upi_id = upiId;
    } else if (payoutMethod === 'bank') {
      if (accountNumber && ifscCode) {
        payload.account_number = accountNumber;
        payload.ifsc_code = ifscCode;
      } else {
        throw new Error('Account number and IFSC code are required for bank transfer');
      }
    }

    const response = await api.post('/razorpay/withdraw/', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to request withdrawal');
  }
};

/**
 * Get withdrawal history for a user
 * @param userId - User identifier
 */
export const getWithdrawalHistory = async (userId: string) => {
  try {
    const response = await api.get('/razorpay/withdrawals/', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get withdrawal history');
  }
};

/**
 * Get withdrawal status
 * @param withdrawalId - Withdrawal ID
 */
export const getWithdrawalStatus = async (withdrawalId: string) => {
  try {
    const response = await api.get(`/razorpay/withdrawal/${withdrawalId}/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get withdrawal status');
  }
};

/**
 * Cancel pending withdrawal and refund coins
 * @param withdrawalId - Withdrawal ID
 */
export const cancelWithdrawal = async (withdrawalId: string) => {
  try {
    const response = await api.post(`/razorpay/withdrawal/${withdrawalId}/cancel/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to cancel withdrawal');
  }
};

// ============================================
// SUBSCRIPTION MANAGEMENT APIs (Razorpay Subscriptions)
// ============================================

/**
 * Get available subscription plans
 * Returns 2 plans: Free (₹0) and Premium (₹1 → ₹99/month)
 */
export const getSubscriptionPlans = async () => {
  try {
    const response = await api.get('/subscription/plans/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get subscription plans');
  }
};

/**
 * Get user's subscription status and usage
 * @param userId - User identifier
 */
export const getSubscriptionStatus = async (userId: string) => {
  try {
    const response = await api.get('/subscription/status/', {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get subscription status');
  }
};

/**
 * Create Razorpay subscription (Recurring payments)
 * First month: ₹1, Then: ₹99/month auto-debit
 * @param userId - User identifier
 */
export const createRazorpaySubscription = async (userId: string, plan: string = 'basic') => {
  try {
    const response = await api.post('/subscriptions/create/', {
      user_id: userId,
      plan: plan
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to create subscription');
  }
};

/**
 * Cancel Razorpay subscription
 * @param userId - User identifier
 * @param cancelAtCycleEnd - If true, cancels at end of current billing period
 */
export const cancelRazorpaySubscription = async (
  userId: string,
  cancelAtCycleEnd: boolean = true
) => {
  try {
    const response = await api.post('/subscription/cancel-razorpay/', {
      user_id: userId,
      cancel_at_cycle_end: cancelAtCycleEnd
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to cancel subscription');
  }
};

// ---- Razorpay Order/Payment (production checkout) ----

/**
 * Create a Razorpay order for one-time or subscription entry payments.
 * Amount must be in rupees; backend converts to paise.
 */
export const createRazorpayOrder = async (
  amountRupees: number,
  userId: string,
  notes: Record<string, any> = {},
  currency: string = 'INR'
) => {
  try {
    const response = await api.post('/payment/create-order/', {
      amount: amountRupees,
      currency,
      user_id: userId,
      notes,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to create Razorpay order');
  }
};

/**
 * Verify payment on backend using Razorpay signature.
 */
export const verifyRazorpayPayment = async (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  try {
    const response = await api.post('/payment/verify-payment/', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to verify payment');
  }
};

/**
 * Fetch public Razorpay key for checkout.
 */
export const getRazorpayKey = async () => {
  try {
    const response = await api.get('/razorpay/key/');
    return response.data?.key_id as string;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to load Razorpay key');
  }
};

/**
 * Validate a promo code
 */
export const validatePromoCode = async (
  code: string,
  userId: string,
  plan: string,
  amount: number
) => {
  try {
    const response = await api.post('/promo/validate/', {
      code,
      user_id: userId,
      plan,
      amount,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to validate promo code');
  }
};

/**
 * Apply a promo code
 */
export const applyPromoCode = async (
  code: string,
  userId: string,
  subscriptionId: string | null,
  originalAmount: number,
  discountedAmount: number
) => {
  try {
    const response = await api.post('/promo/apply/', {
      code,
      user_id: userId,
      subscription_id: subscriptionId,
      original_amount: originalAmount,
      discounted_amount: discountedAmount,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to apply promo code');
  }
};

/**
 * Get user's promo code history
 */
export const getUserPromoHistory = async (userId: string) => {
  try {
    const response = await api.get(`/promo/history/?user_id=${userId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get promo history');
  }
};

export default api;
