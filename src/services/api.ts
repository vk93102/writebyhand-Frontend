import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const PRODUCTION_API_URL = 'https://ed-tech-backend-tzn8.onrender.com/api';

const api = axios.create({
  baseURL: PRODUCTION_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});


const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const USER_ID_KEY = 'USER_ID';

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

export const setUserId = async (userId: string | null) => {
  try {
    if (userId) {
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      api.defaults.headers.common['X-User-ID'] = userId;
    } else {
      await AsyncStorage.removeItem(USER_ID_KEY);
      delete api.defaults.headers.common['X-User-ID'];
    }
  } catch (e) {
    console.warn('Failed to persist user ID', e);
  }
};

export const getUserId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch (e) {
    return null;
  }
};

(async () => {
  const token = await getAuthToken();
  const userId = await getUserId();
  
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    api.defaults.headers.common['X-User-ID'] = userId;
  }
})();

// ==================== REQUEST INTERCEPTOR ====================

// Add user ID header to every request if available
api.interceptors.request.use(
  async (config) => {
    try {
      const userId = await getUserId();
      if (userId && !config.headers['X-User-ID']) {
        config.headers['X-User-ID'] = userId;
      }
    } catch (e) {
      console.warn('Failed to add user ID to request', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================

// Handle authentication errors and server responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Token expired or invalid - clear credentials
      setAuthToken(null);
      setUserId(null);
    }
    // Log API errors for debugging (remove in production if verbose)
    if (err?.response?.status >= 500) {
      console.error('Server error:', err?.response?.data || err.message);
    }
    return Promise.reject(err);
  }
);

// ==================== QUESTION SOLVING APIs ====================

/**
 * Solve question using text input
 * Production-ready with proper error handling
 * 
 * API: POST /solve/
 * Headers: X-User-ID: {userId}, Content-Type: application/json
 * Body: { text: "question text" }
 * 
 * @param text - The question text to solve
 * @returns API response with solution
 */
export const solveQuestionByText = async (text: string): Promise<any> => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Question text cannot be empty');
    }

    // Production-level request with exact API format
    const response = await api.post('/solve/', {
      text: text.trim(),
    });

    if (!response.data) {
      throw new Error('No response received from server');
    }

    return response.data;
  } catch (error: any) {
    // Production-level error handling
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to solve question';
    
    console.error('solveQuestionByText error:', {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    throw new Error(errorMessage);
  }
};

/**
 * Solve question using image upload
 * Production-ready with platform-specific handling
 * 
 * API: POST /solve/ with multipart/form-data
 * Headers: X-User-ID: {userId}, Content-Type: multipart/form-data
 * Body: FormData with image file
 * 
 * @param imageUri - The local URI of the image
 * @returns API response with solution from image
 */
export const solveQuestionByImage = async (imageUri: string): Promise<any> => {
  try {
    if (!imageUri || imageUri.trim().length === 0) {
      throw new Error('Image URI cannot be empty');
    }

    const formData = new FormData();
    let imageFile: any;

    // Platform-specific image handling
    if (Platform.OS === 'web') {
      // Web: Handle data URLs and blob URLs
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
        // Handle blob/regular URLs
        const response = await fetch(imageUri);
        const blob = await response.blob();
        imageFile = new File([blob], 'question.jpg', { type: 'image/jpeg' });
      }
    } else {
      // Mobile: Use URI directly (React Native handles it)
      imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'question.jpg',
      } as any;
    }

    // Append image to form data with exact API format
    formData.append('image', imageFile);

    // Production-level multipart request
    const response = await api.post('/solve/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data) {
      throw new Error('No response received from server');
    }

    return response.data;
  } catch (error: any) {
    // Production-level error handling
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to process image';

    console.error('solveQuestionByImage error:', {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    throw new Error(errorMessage);
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
    if (!topic || topic.trim().length < 50) {
      throw new Error('Please provide text content with at least 50 characters');
    }
    
    // Map difficulty to backend format
    const response = await api.post('/quiz/generate/', {
      topic: topic,
      num_questions: numQuestions,
      difficulty: difficulty
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate quiz');
  }
};

/**
 * Generate flashcards from topic with language and difficulty options
 * Production-ready API endpoint matching backend specification
 * 
 * API: POST /flashcards/generate/
 * Headers: X-User-ID (auto-injected), Content-Type: application/json
 * Body: { topic, num_cards, language, difficulty }
 * 
 * @param topic - The topic or subject for flashcards (e.g., "World History", "Biology Cells")
 * @param numCards - Number of flashcards to generate (default: 5, range: 1-20)
 * @param language - Language for flashcards (default: "english", options: "english", "hindi")
 * @param difficulty - Difficulty level (default: "medium", options: "easy", "medium", "hard")
 * @returns API response with generated flashcards data
 */
export const generateFlashcards = async (
  topic: string, 
  numCards: number = 5,
  language: string = 'english',
  difficulty: string = 'medium'
): Promise<any> => {
  try {
    if (!topic || topic.trim().length === 0) {
      throw new Error('Topic cannot be empty');
    }

    // Validate parameters
    const validLanguages = ['english', 'hindi'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    if (!validLanguages.includes(language)) {
      language = 'english';
    }
    if (!validDifficulties.includes(difficulty)) {
      difficulty = 'medium';
    }

    // Ensure numCards is within valid range
    const validNumCards = Math.min(Math.max(numCards, 1), 20);

    // Production-level request matching backend API format exactly
    const payload = {
      topic: topic.trim(),
      num_cards: validNumCards,
      language: language.toLowerCase(),
      difficulty: difficulty.toLowerCase(),
    };

    console.log('[API] generateFlashcards - Calling endpoint: POST /flashcards/generate/')
    console.log('[API] generateFlashcards - Payload:', payload);
    const response = await api.post('/flashcards/generate/', payload);

    console.log('[API] generateFlashcards - Response status:', response.status);
    console.log('[API] generateFlashcards - Raw response:', response.data);

    if (!response.data) {
      throw new Error('No response received from server');
    }

    // Handle wrapped response format: { success: true, data: { title, cards, ... } }
    // If data is wrapped in a 'data' field, return the data portion
    // Otherwise return the entire response
    let result: any = response.data;
    
    if (response.data.data && response.data.success) {
      result = response.data.data;
    }

    console.log('[API] generateFlashcards - Returning result with', result?.cards?.length || 0, 'cards');
    return result;
  } catch (error: any) {
    // Production-level error handling
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to generate flashcards';

    console.error('[API] generateFlashcards error:', {
      endpoint: 'POST /flashcards/generate/',
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    throw error; // Throw the full error to let handler get full details
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
 * Production-ready API endpoint matching backend specification
 * 
 * API: POST /youtube/summarize/
 * Headers: X-User-ID (auto-injected), Content-Type: application/json
 * Body: { video_url }
 * Response: { metadata: {...}, summary: string, sections: array }
 * 
 * @param videoUrl - YouTube video URL (must be valid YouTube URL)
 * @param useDemo - Use demo mode for testing UI (optional)
 * @returns Video summary data with metadata and sections
 */
export const summarizeYouTubeVideo = async (videoUrl: string, useDemo: boolean = false): Promise<any> => {
  try {
    if (!videoUrl || videoUrl.trim().length === 0) {
      throw new Error('Video URL cannot be empty');
    }

    // Validate YouTube URL format
    const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//i;
    if (!youtubeUrlPattern.test(videoUrl)) {
      throw new Error('Invalid YouTube URL format');
    }

    // Production-level request matching backend API format
    const payload = {
      video_url: videoUrl.trim(),
    };

    const url = useDemo ? '/youtube/summarize/?demo=true' : '/youtube/summarize/';
    const response = await api.post(url, payload, {
      timeout: 60000, // 60 seconds for video processing
    });

    if (!response.data) {
      throw new Error('No response received from server');
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to summarize video';

    console.error('summarizeYouTubeVideo error:', {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    throw new Error(errorMessage);
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
 * @param topic - Topic name (for text-based generation)
 * @param examType - Type of exam (General, JEE, NEET, etc.)
 * @param numQuestions - Number of questions (default: 5)
 * @param document - Optional document file
 */
/**
 * Generate predicted exam questions using AI
 * Production-ready API endpoint matching backend specification
 * 
 * API: POST /predicted-questions/generate/
 * Headers: X-User-ID (auto-injected), Content-Type: application/json
 * Body: { topic, user_id, difficulty, num_questions }
 * Response: { data: { questions: [], confidence_score: float } }
 * 
 * @param topic - Subject/topic for question generation (e.g., "Science", "Math")
 * @param userId - User identifier for tracking
 * @param difficulty - Question difficulty level (default: "medium", options: "easy", "medium", "hard")
 * @param numQuestions - Number of questions to generate (default: 3, range: 1-10)
 * @returns API response with predicted questions and confidence score
 */
export const generatePredictedQuestions = async (
  topic: string,
  userId: string,
  difficulty: string = 'medium',
  numQuestions: number = 3
): Promise<any> => {
  try {
    if (!topic || topic.trim().length === 0) {
      throw new Error('Topic cannot be empty');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      difficulty = 'medium';
    }

    // Ensure numQuestions is within valid range
    const validNumQuestions = Math.min(Math.max(numQuestions, 1), 10);

    // Production-level request matching backend API format exactly
    const payload = {
      topic: topic.trim(),
      user_id: userId.trim(),
      difficulty: difficulty.toLowerCase(),
      num_questions: validNumQuestions,
    };

    const response = await api.post('/predicted-questions/generate/', payload, {
      timeout: 45000, // 45 seconds for AI generation
    });

    if (!response.data) {
      throw new Error('No response received from server');
    }

    return response.data;
  } catch (error: any) {
    // Production-level error handling
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to generate predicted questions';

    console.error('generatePredictedQuestions error:', {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    throw new Error(errorMessage);
  }
};

/**
 * SUBSCRIPTION & PRICING APIs
 */

/**
 * Play & Win API
 */

/**
 * Daily Quiz APIs - Play & Win Feature
 */

/**
 * Get today's daily quiz
 * Production-ready API endpoint matching backend specification
 * 
 * API: GET /daily-quiz/?language={language}&user_id={user_id}
 * Headers: X-User-ID (auto-injected)
 * Query Params: language, user_id
 * Response: { quiz_id, questions: [], ... }
 * 
 * @param language - Quiz language (default: "english", options: "english", "hindi")
 * @param userId - User identifier
 * @returns Quiz data with questions
 */
export const getDailyQuiz = async (language: string = 'english', userId?: string): Promise<any> => {
  try {
    const validLanguages = ['english', 'hindi'];
    if (!validLanguages.includes(language)) {
      language = 'english';
    }

    const response = await api.get('/daily-quiz/', {
      params: { 
        language: language.toLowerCase(),
        ...(userId && { user_id: userId })
      }
    });

    if (!response.data) {
      throw new Error('No quiz data received from server');
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to get daily quiz';

    console.error('getDailyQuiz error:', {
      status: error.response?.status,
      message: errorMessage,
    });

    throw new Error(errorMessage);
  }
};

/**
 * User authentication (register / login)
 */
export const registerUser = async (username: string, email: string, password: string, full_name?: string) => {
  try {
    console.log('[Auth] POST /auth/register/ - Registering user:', { username, email, full_name });
    const response = await api.post('/auth/register/', {
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      full_name: (full_name || '').trim(),
    });
    console.log('[Auth] Registration response:', response.data);
    
    const data = response.data;
    // Handle response format: { success: true, data: { token, user_id, ... } }
    const token = data?.data?.token || data?.token;
    const userId = data?.data?.user_id || data?.user_id;
    
    if (!token) {
      throw new Error('No authentication token received from server');
    }
    
    if (!userId) {
      throw new Error('No user ID received from server');
    }
    
    await setAuthToken(token);
    await setUserId(String(userId));
    
    console.log('[Auth] Registration successful, token and userId stored');
    return {
      success: true,
      data: {
        token,
        user_id: userId,
        username: data?.data?.username || username,
        email: data?.data?.email || email,
        full_name: data?.data?.full_name || full_name || '',
      },
    };
  } catch (error: any) {
    console.error('[Auth] Registration error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.response?.data?.message,
      endpoint: 'POST /auth/register/',
    });
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed');
  }
};

export const loginUser = async (usernameOrEmail: string, password: string) => {
  try {
    const payload: any = { password };
    const identifier = (usernameOrEmail || '').trim();
    if (identifier.includes('@')) payload.email = identifier.toLowerCase();
    else payload.username = identifier;

    console.log('[Auth] POST /auth/login/ - Logging in user with:', { identifier: identifier.includes('@') ? 'email' : 'username' });
    const response = await api.post('/auth/login/', payload);
    console.log('[Auth] Login response:', response.data);
    
    const data = response.data;
    const token = data?.data?.token || data?.token;
    const userId = data?.data?.user_id || data?.user_id;
    
    if (!token) {
      throw new Error('No authentication token received from server');
    }
    
    if (!userId) {
      throw new Error('No user ID received from server');
    }
    
    await setAuthToken(token);
    await setUserId(String(userId));
    
    console.log('[Auth] Login successful, token and user ID stored');
    return {
      success: true,
      data: {
        token,
        user_id: userId,
        username: data?.data?.username || identifier,
        email: data?.data?.email || (identifier.includes('@') ? identifier : ''),
        full_name: data?.data?.full_name || '',
      },
    };
  } catch (error: any) {
    console.error('[Auth] Login error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.response?.data?.message,
      endpoint: 'POST /auth/login/',
    });
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
      endpoint: 'POST /auth/request-password-reset/',
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
      endpoint: 'POST /auth/validate-reset-token/',
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
      endpoint: 'POST /auth/reset-password/',
    });
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to reset password');
  }
};

/**
 * Change user password (requires email and old password)
 * Production-ready API endpoint matching backend specification
 * 
 * API: POST /auth/change-password/
 * Headers: Content-Type: application/json
 * Body: { email, old_password, new_password }
 * Response: { success: true, message: string }
 * 
 * @param email - User's email address
 * @param oldPassword - Current password
 * @param newPassword - New password to set
 * @returns Success response with message
 */
export const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
  try {
    console.log('[Auth] POST /auth/change-password/ - Changing password for:', email);
    const response = await api.post('/auth/change-password/', {
      email: email.toLowerCase().trim(),
      old_password: oldPassword,
      new_password: newPassword,
    });
    console.log('[Auth] Password change successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Auth] Password change error:', {
      status: error.response?.status,
      message: error.response?.data?.error,
      endpoint: 'POST /auth/change-password/',
    });
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to change password');
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
 * Submit daily quiz answers
 * Production-ready API endpoint matching backend specification
 * 
 * API: POST /daily-quiz/submit/
 * Headers: X-User-ID (auto-injected), Content-Type: application/json
 * Body: { user_id, quiz_id, answers, time_taken_seconds }
 * Response: { result: { coins_earned, score_percentage }, total_coins }
 * 
 * @param userId - User identifier
 * @param quizId - Quiz ID from getDailyQuiz
 * @param answers - User's answers in format {question_id: option_index} e.g. {"1": 0, "2": 2}
 * @param timeTakenSeconds - Time taken to complete quiz in seconds
 * @returns Result data with coins earned and score
 */
export const submitDailyQuiz = async (
  userId: string,
  quizId: string,
  answers: Record<string, number>,
  timeTakenSeconds: number
): Promise<any> => {
  try {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!quizId || quizId.trim().length === 0) {
      throw new Error('Quiz ID cannot be empty');
    }

    if (!answers || Object.keys(answers).length === 0) {
      throw new Error('Answers cannot be empty');
    }

    if (!Number.isInteger(timeTakenSeconds) || timeTakenSeconds < 0) {
      throw new Error('Time taken must be a positive integer');
    }

    // Production-level request matching backend API format exactly
    const payload = {
      user_id: userId.trim(),
      quiz_id: quizId.trim(),
      answers: answers,
      time_taken_seconds: timeTakenSeconds,
    };

    const response = await api.post('/daily-quiz/submit/', payload);

    if (!response.data) {
      throw new Error('No response received from server');
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to submit quiz';

    console.error('submitDailyQuiz error:', {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    throw new Error(errorMessage);
  }
};

/**
 * Get user's coin balance and transaction history
 * Production-ready API endpoint matching backend specification
 * 
 * API: GET /daily-quiz/coins/?user_id={user_id}
 * Headers: X-User-ID (auto-injected)
 * Query Params: user_id
 * Response: { total_coins, recent_transactions: [...] }
 * 
 * @param userId - User identifier
 * @returns User's coin balance and recent transactions
 */
export const getUserCoins = async (userId: string | number | null): Promise<any> => {
  try {
    if (!userId) {
      throw new Error('User ID cannot be empty');
    }

    const userIdStr = String(userId).trim();
    if (userIdStr.length === 0) {
      throw new Error('User ID cannot be empty');
    }

    const response = await api.get('/daily-quiz/coins/', {
      params: { user_id: userIdStr }
    });

    if (!response.data) {
      throw new Error('No coin data received from server');
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to get coins';

    console.error('getUserCoins error:', {
      status: error.response?.status,
      message: errorMessage,
    });

    throw new Error(errorMessage);
  }
};

/**
 * Get user's quiz history with attempt statistics
 * Production-ready API endpoint matching backend specification
 * 
 * API: GET /daily-quiz/history/?user_id={user_id}&limit={limit}
 * Headers: X-User-ID (auto-injected)
 * Query Params: user_id, limit
 * Response: { history: [...], stats: { total_attempts, average_score, total_coins_earned } }
 * 
 * @param userId - User identifier
 * @param limit - Maximum number of records to fetch (default: 5)
 * @returns Quiz history with statistics
 */
export const getQuizHistory = async (userId: string, limit: number = 5): Promise<any> => {
  try {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    // Ensure limit is within valid range
    const validLimit = Math.min(Math.max(limit, 1), 100);

    const response = await api.get('/daily-quiz/history/', {
      params: { 
        user_id: userId.trim(), 
        limit: validLimit 
      }
    });

    if (!response.data) {
      throw new Error('No history data received from server');
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to get quiz history';

    console.error('getQuizHistory error:', {
      status: error.response?.status,
      message: errorMessage,
    });

    throw new Error(errorMessage);
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
    // Convert coins to rupees (e.g., 1000 coins = 100 rupees)
    const amount = coinsAmount / 10;
    const payload: any = {
      user_id: userId,
      amount: amount, // Send amount in rupees as expected by backend
    };

    // Add payment method specific fields
    if (payoutMethod === 'upi') {
      if (!upiId) {
        throw new Error('UPI ID is required for UPI transfer');
      }
      payload.upi_id = upiId;
    } else if (payoutMethod === 'bank') {
      if (!accountNumber || !ifscCode) {
        throw new Error('Account number and IFSC code are required for bank transfer');
      }
      payload.account_number = accountNumber;
      payload.ifsc_code = ifscCode;
    }

    const response = await api.post('/razorpay/withdraw/', payload);
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Withdrawal request failed');
    }

    return {
      success: true,
      ...response.data,
      // Include coins for consistency with component expectations
      coins_deducted: coinsAmount,
      remaining_balance: response.data?.remaining_coins,
    };
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to request withdrawal';
    throw new Error(errorMessage);
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
// ADMIN WITHDRAWAL MANAGEMENT APIs
// ============================================

/**
 * Get all withdrawals (admin only)
 * @param status - Filter by status: 'pending', 'completed', 'failed', 'cancelled'
 */
export const getAdminWithdrawals = async (status?: string) => {
  try {
    const response = await api.get('/admin/withdrawals/', {
      params: { status }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to get withdrawals');
  }
};

/**
 * Approve withdrawal (admin only)
 * @param withdrawalId - Withdrawal ID to approve
 */
export const approveWithdrawal = async (withdrawalId: string) => {
  try {
    const response = await api.post(`/admin/withdrawals/${withdrawalId}/approve/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to approve withdrawal');
  }
};

/**
 * Reject withdrawal and refund coins (admin only)
 * @param withdrawalId - Withdrawal ID to reject
 */
export const rejectWithdrawal = async (withdrawalId: string) => {
  try {
    const response = await api.post(`/admin/withdrawals/${withdrawalId}/reject/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to reject withdrawal');
  }
};

/**
 * Delete withdrawal record (admin only)
 * @param withdrawalId - Withdrawal ID to delete
 * @param userId - User ID associated with withdrawal
 */
export const deleteWithdrawal = async (withdrawalId: string, userId?: string) => {
  try {
    const response = await api.delete(`/admin/withdrawals/${withdrawalId}/`, {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to delete withdrawal');
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

// ==================== FEATURE USAGE RESTRICTION SYSTEM ====================

/**
 * Check if user can access a feature
 * POST /api/usage/check/
 * @param feature - Feature name (quiz, flashcards, study-material, etc.)
 * @returns { success: boolean, allowed: boolean, error?: string, usage?: {...} }
 */
export const checkFeatureUsage = async (feature: string) => {
  try {
    console.log(`[API] checkFeatureUsage - Calling endpoint: POST /usage/check/ for feature:`, feature);
    
    // Call the usage check endpoint
    const response = await api.post('/usage/check/', {
      feature: feature.toLowerCase(),
    });
    
    console.log(`[API] checkFeatureUsage - Response:`, response.data);
    
    // Handle backend response format: { success: true, status: { allowed: true, reason: "...", limit: 3, used: 0, remaining: 3 } }
    const data = response.data;
    return {
      success: data?.success ?? true,
      allowed: data?.status?.allowed ?? data?.allowed ?? true,
      reason: data?.status?.reason,
      limit: data?.status?.limit,
      used: data?.status?.used,
      remaining: data?.status?.remaining ?? data?.remaining,
      error: data?.error,
    };
  } catch (error: any) {
    console.warn(`[API] checkFeatureUsage - Check failed:`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    
    // If the endpoint doesn't exist (404) or other error, return a permissive default
    // This allows the feature to work even if the usage tracking endpoint isn't ready
    if (error.response?.status === 404 || error.response?.status === 503) {
      console.warn(`[API] checkFeatureUsage - Endpoint not available (${error.response?.status}), allowing access`);
      return {
        success: true,
        allowed: true,
        message: 'Usage check temporarily unavailable',
      };
    }
    
    // If 403, it means access is forbidden/limit exceeded
    if (error.response?.status === 403) {
      return {
        success: false,
        allowed: false,
        error: error.response?.data?.error || 'Monthly limit reached for this feature',
        usage: error.response?.data?.usage,
      };
    }
    
    // For other errors, also return permissive to not break the feature
    console.warn(`[API] checkFeatureUsage - Returning permissive default due to error:`, error.message);
    return {
      success: true,
      allowed: true,
      message: 'Usage check failed, allowing access',
    };
  }
};

/**
 * Record feature usage after successful execution
 * POST /api/usage/record/
 * @param feature - Feature name
 * @param inputSize - Size of input/content in bytes
 * @param usageType - Type: text | image | video | audio
 * @param metadata - Optional metadata
 * @returns { success: boolean, message: string, usage: {...} }
 */
export const recordFeatureUsage = async (
  feature: string,
  inputSize: number = 0,
  usageType: string = 'text',
  metadata: Record<string, any> = {}
) => {
  try {
    console.log(`[API] recordFeatureUsage - Calling endpoint: POST /usage/record/ for:`, feature);
    const response = await api.post('/usage/record/', {
      feature: feature.toLowerCase(),
      input_size: inputSize,
      usage_type: usageType.toLowerCase(),
      metadata: metadata,
    });
    console.log(`[API] recordFeatureUsage - Response:`, response.data);
    console.log(`[API] recordFeatureUsage - Usage updated. Remaining:`, response.data?.usage?.remaining);
    return response.data;
  } catch (error: any) {
    console.error(`[Usage] Record error:`, error.response?.data || error.message);
    // Don't throw - recording failure shouldn't break the feature
    return {
      success: false,
      message: 'Failed to record usage',
      error: error.message,
    };
  }
};

/**
 * Get user's usage dashboard with all feature limits
 * GET /api/usage/dashboard/
 * @returns { success: boolean, dashboard: {...} }
 */
export const getUsageDashboard = async () => {
  try {
    console.log(`[Usage] Fetching usage dashboard`);
    const response = await api.get('/usage/dashboard/');
    console.log(`[Usage] Dashboard response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[Usage] Dashboard error:`, error.response?.status, error.response?.data || error.message);
    
    // If 401 or 403, user is not authenticated or doesn't have permission
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('[Usage] User not authenticated, returning empty dashboard');
      return {
        success: false,
        dashboard: null,
        error: 'Not authenticated - please log in',
      };
    }
    
    throw error;
  }
};

/**
 * Get specific feature status
 * GET /api/usage/feature/{feature}/
 * @param feature - Feature name
 * @returns { success: boolean, feature: string, status: {...} }
 */
export const getFeatureStatus = async (feature: string) => {
  try {
    console.log(`[Usage] Fetching feature status: ${feature}`);
    const response = await api.get(`/usage/feature/${feature.toLowerCase()}/`);
    console.log(`[Usage] Feature status response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[Usage] Feature status error:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get usage statistics
 * GET /api/usage/stats/
 * @returns { success: boolean, stats: {...} }
 */
export const getUsageStats = async () => {
  try {
    console.log(`[Usage] Fetching usage statistics`);
    const response = await api.get('/usage/stats/');
    console.log(`[Usage] Stats response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[Usage] Stats error:`, error.response?.data || error.message);
    throw error;
  }
};

// ==================== OCR & IMAGE PROCESSING ====================

/**
 * Process image with OCR to extract text
 * POST /api/ocr/process-image/
 * @param imageFile - Image file to process
 * @returns { success: boolean, text: string, confidence: number, metadata?: {...} }
 */
export const processImageWithOCR = async (imageFile: any): Promise<any> => {
  try {
    const formData = new FormData();
    
    // Handle different image sources
    if (typeof imageFile === 'string') {
      // Image URI from device
      const filename = imageFile.split('/').pop() || 'image.jpg';
      const fileData = {
        uri: imageFile,
        type: 'image/jpeg',
        name: filename,
      } as any;
      formData.append('image', fileData);
    } else if (imageFile instanceof File) {
      // Web File object
      formData.append('image', imageFile);
    } else if (imageFile.file) {
      // DocumentPicker asset with file property
      formData.append('image', imageFile.file);
    } else {
      throw new Error('Invalid image source');
    }

    console.log('[OCR] Processing image with OCR...');
    const response = await api.post('/ocr/process-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    console.log('[OCR] Image processing response:', response.data);
    return {
      success: true,
      text: response.data.text || response.data.extracted_text || '',
      confidence: response.data.confidence || 0.95,
      metadata: response.data.metadata || {},
    };
  } catch (error: any) {
    console.error('[OCR] Image processing error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to process image');
  }
};

/**
 * Generate flashcards from image
 * Sends image directly to backend for OCR and flashcard generation
 * Extracts text from image and generates flashcards
 * @param imageFile - Image file to process
 * @param numCards - Number of flashcards to generate
 * @param language - Language for flashcards
 * @param difficulty - Difficulty level
 * @returns Flashcard data
 */
export const generateFlashcardsFromImage = async (
  imageFile: any,
  numCards: number = 5,
  language: string = 'english',
  difficulty: string = 'medium'
): Promise<any> => {
  try {
    console.log('[Flashcards] generateFlashcardsFromImage called with:', { imageFile: typeof imageFile, numCards, language, difficulty });
    console.log('[Flashcards] Generating flashcards from image...');
    
    const formData = new FormData();
    
    // Handle different image sources
    if (typeof imageFile === 'string') {
      // Image URI from device
      console.log('[Flashcards] Processing image URI:', imageFile.substring(0, 60) + '...');
      const filename = imageFile.split('/').pop() || 'image.jpg';
      const fileData = {
        uri: imageFile,
        type: 'image/jpeg',
        name: filename,
      } as any;
      formData.append('document', fileData);
    } else if (imageFile instanceof File) {
      // Web File object
      console.log('[Flashcards] Processing Web File object:', imageFile.name);
      formData.append('document', imageFile);
    } else if (imageFile.file) {
      // DocumentPicker asset with file property
      console.log('[Flashcards] Processing DocumentPicker asset:', imageFile.name);
      formData.append('document', imageFile.file);
    } else {
      throw new Error('Invalid image source');
    }

    formData.append('num_cards', numCards.toString());
    formData.append('language', language.toLowerCase());
    formData.append('difficulty', difficulty.toLowerCase());

    console.log('[Flashcards] POST /flashcards/generate/ with image form data - num_cards:', numCards, 'language:', language, 'difficulty:', difficulty);
    
    const response = await api.post('/flashcards/generate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    });

    console.log('[Flashcards] Image upload response status:', response.status);
    console.log('[Flashcards] Image upload response data:', response.data);

    // Handle wrapped response format: { success: true, data: { title, cards, ... } }
    // Return unwrapped data for consistency with generateFlashcards
    let result: any = response.data;
    if (response.data.data && response.data.success) {
      result = response.data.data;
    }
    
    console.log('[Flashcards] Returning flashcard result with', result?.cards?.length || 0, 'cards');
    return result;
  } catch (error: any) {
    console.error('[Flashcards] Error generating from image:', {
      endpoint: 'POST /flashcards/generate/',
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
      errorStack: error.stack,
    });
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate flashcards from image');
  }
};


/**
 * Generate predicted questions from image
 * Sends image directly to backend for OCR and question generation
 * @param imageFile - Image file to process
 * @param userId - User ID
 * @param examType - Type of exam (JEE, NEET, General, etc.)
 * @param numQuestions - Number of questions to generate
 * @returns Predicted questions data
 */
export const generatePredictedQuestionsFromImage = async (
  imageFile: any,
  userId: string,
  examType: string = 'General',
  numQuestions: number = 3
): Promise<any> => {
  try {
    console.log('[PredictedQuestions] generatePredictedQuestionsFromImage called with:', { imageFile: typeof imageFile, userId, examType, numQuestions });
    console.log('[PredictedQuestions] Generating from image...');
    
    const formData = new FormData();
    
    // Handle different image sources
    if (typeof imageFile === 'string') {
      // Image URI from device
      console.log('[PredictedQuestions] Processing image URI:', imageFile.substring(0, 60) + '...');
      const filename = imageFile.split('/').pop() || 'image.jpg';
      const fileData = {
        uri: imageFile,
        type: 'image/jpeg',
        name: filename,
      } as any;
      formData.append('document', fileData);
    } else if (imageFile instanceof File) {
      // Web File object
      console.log('[PredictedQuestions] Processing Web File object:', imageFile.name);
      formData.append('document', imageFile);
    } else if (imageFile.file) {
      // DocumentPicker asset with file property
      console.log('[PredictedQuestions] Processing DocumentPicker asset:', imageFile.name);
      formData.append('document', imageFile.file);
    } else {
      throw new Error('Invalid image source');
    }

    formData.append('user_id', userId);
    formData.append('difficulty', examType.toLowerCase());
    formData.append('num_questions', numQuestions.toString());

    console.log('[PredictedQuestions] POST /predicted-questions/generate/ with image form data - examType:', examType, 'numQuestions:', numQuestions);
    
    const response = await api.post('/predicted-questions/generate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    });

    console.log('[PredictedQuestions] Image response status:', response.status);
    console.log('[PredictedQuestions] Image response data:', response.data);

    // Handle wrapped response format: { success: true, data: { questions, ... } }
    // Return unwrapped data for consistency with generatePredictedQuestions
    let result: any = response.data;
    if (response.data.data && response.data.success) {
      result = response.data.data;
    }
    
    console.log('[PredictedQuestions] Returning image-based result with', result?.questions?.length || 0, 'questions');
    return result;
  } catch (error: any) {
    console.error('[PredictedQuestions] Error generating from image:', {
      endpoint: 'POST /predicted-questions/generate/',
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
      errorStack: error.stack,
    });
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate predicted questions from image');
  }
};


/**
 * Generate flashcards from document file (PDF, TXT, Image)
 * @param file - Document file to process
 * @param numCards - Number of flashcards
 * @param language - Language
 * @param difficulty - Difficulty level
 * @returns Flashcard data
 */
export const generateFlashcardsFromFile = async (
  file: any,
  numCards: number = 5,
  language: string = 'english',
  difficulty: string = 'medium'
): Promise<any> => {
  try {
    const fileExtension = (file.name || '').split('.').pop()?.toLowerCase();
    console.log(`[Flashcards] Generating from file: ${file.name} (${fileExtension})`);

    // If image file, use OCR
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension || '')) {
      return await generateFlashcardsFromImage(file, numCards, language, difficulty);
    }

    // For text/PDF files, extract content and generate
    const formData = new FormData();
    
    if (file.file && file.file instanceof File) {
      formData.append('document', file.file);
    } else if (file instanceof File) {
      formData.append('document', file);
    } else if (file.uri) {
      const filename = file.name || 'document';
      const fileData = {
        uri: file.uri,
        type: file.mimeType || 'text/plain',
        name: filename,
      } as any;
      formData.append('document', fileData);
    }

    formData.append('num_cards', numCards.toString());
    formData.append('language', language);
    formData.append('difficulty', difficulty);

    const response = await api.post('/flashcards/generate-from-document/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    // Handle wrapped response format: { success: true, data: { title, cards, ... } }
    // Return unwrapped data for consistency with generateFlashcards
    let result: any = response.data;
    if (response.data.data && response.data.success) {
      result = response.data.data;
    }
    
    console.log('[Flashcards] Returning file-based flashcard result with', result?.cards?.length || 0, 'cards');
    return result;
  } catch (error: any) {
    console.error('[Flashcards] Error generating from file:', error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate flashcards from file');
  }
};

/**
 * Generate predicted questions from document file
 * @param file - Document file
 * @param userId - User ID
 * @param examType - Exam type
 * @param numQuestions - Number of questions
 * @returns Predicted questions data
 */
export const generatePredictedQuestionsFromFile = async (
  file: any,
  userId: string,
  examType: string = 'General',
  numQuestions: number = 3
): Promise<any> => {
  try {
    const fileExtension = (file.name || '').split('.').pop()?.toLowerCase();
    console.log(`[PredictedQuestions] Generating from file: ${file.name} (${fileExtension})`);

    // If image file, use OCR
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension || '')) {
      return await generatePredictedQuestionsFromImage(file, userId, examType, numQuestions);
    }

    // For text/PDF files, extract content and generate
    const formData = new FormData();
    
    if (file.file && file.file instanceof File) {
      formData.append('document', file.file);
    } else if (file instanceof File) {
      formData.append('document', file);
    } else if (file.uri) {
      const filename = file.name || 'document';
      const fileData = {
        uri: file.uri,
        type: file.mimeType || 'text/plain',
        name: filename,
      } as any;
      formData.append('document', fileData);
    }

    formData.append('user_id', userId);
    formData.append('difficulty', examType);
    formData.append('num_questions', numQuestions.toString());

    const response = await api.post('/predicted-questions/generate-from-document/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    // Handle wrapped response format: { success: true, data: { questions, ... } }
    // Return unwrapped data for consistency with generatePredictedQuestions
    let result: any = response.data;
    if (response.data.data && response.data.success) {
      result = response.data.data;
    }
    
    console.log('[PredictedQuestions] Returning file-based result with', result?.questions?.length || 0, 'questions');
    return result;
  } catch (error: any) {
    console.error('[PredictedQuestions] Error generating from file:', error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate predicted questions from file');
  }
};

export { api };
export default api;
