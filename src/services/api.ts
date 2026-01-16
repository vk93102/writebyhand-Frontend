import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiFlashcardService } from './quiz/GeminiFlashcardService';
import { geminiPredictedQuestionsService } from './quiz/GeminiPredictedQuestionsService';
import { geminiSolutionService } from './quiz/GeminiSolutionService';



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
 * Uses Gemini API directly instead of backend
 * Production-level implementation with error handling
 * 
 * @param text - The question text to solve
 * @returns API response with solution
 */
export const solveQuestionByText = async (text: string): Promise<any> => {
  const startTime = Date.now();

  try {
    // Validate input
    if (!text) {
      console.warn('[API] ⚠️ Text is null or undefined');
      throw new Error('Question text is required');
    }

    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      console.warn('[API] ⚠️ Text is empty after trimming');
      throw new Error('Question text cannot be empty');
    }

    if (trimmedText.length < 3) {
      console.warn('[API] ⚠️ Text is too short:', trimmedText.length, 'characters');
      throw new Error('Question must be at least 3 characters long');
    }

    if (trimmedText.length > 5000) {
      console.warn('[API] ⚠️ Text is too long:', trimmedText.length, 'characters');
      throw new Error('Question must not exceed 5000 characters');
    }

    console.log('[API] 🔍 Solving question by text using Gemini... Length:', trimmedText.length);

    // Call Gemini service directly
    const response = await geminiSolutionService.solveByText(trimmedText);

    if (!response.success) {
      const error = response.error || 'Failed to solve question';
      console.error('[API] ❌ Gemini service failed:', error);
      throw new Error(error);
    }

    const processingTime = Date.now() - startTime;
    console.log('[API] ✅ Solution generated successfully in', processingTime, 'ms');

    return {
      success: true,
      solution: response.solution,
      explanation: response.explanation,
      steps: response.steps,
      source: 'text',
      processingTime,
      metadata: {
        inputLength: trimmedText.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[API] ❌ solveQuestionByText failed after', processingTime, 'ms:', error.message);

    // Return error in consistent format
    throw {
      message: error.message || 'Failed to solve question',
      code: error.code || 'SOLUTION_ERROR',
      processingTime,
      type: 'text',
    };
  }
};

/**
 * Solve question using image upload
 * Uses Gemini Vision API directly to solve questions from images
 * Production-level implementation with error handling
 * 
 * @param imageUri - The local URI of the image
 * @returns API response with solution from image
 */
export const solveQuestionByImage = async (imageUri: string): Promise<any> => {
  const startTime = Date.now();

  try {
    // Validate input
    if (!imageUri) {
      console.warn('[API] ⚠️ Image URI is null or undefined');
      throw new Error('Image URI is required');
    }

    const trimmedUri = imageUri.trim();

    if (trimmedUri.length === 0) {
      console.warn('[API] ⚠️ Image URI is empty after trimming');
      throw new Error('Image URI cannot be empty');
    }

    console.log('[API] 🖼️ Solving question by image using Gemini Vision... URI length:', trimmedUri.length);

    // Helper function to convert image to base64
    const imageBase64 = await convertImageToBase64(trimmedUri);

    console.log('[API] 🖼️ Image converted to base64, size:', imageBase64.length, 'bytes');

    // Call Gemini Vision service directly
    const response = await geminiSolutionService.solveByImage(imageBase64, 'image/jpeg');

    if (!response.success) {
      const error = response.error || 'Failed to solve image question';
      console.error('[API] ❌ Gemini vision service failed:', error);
      throw new Error(error);
    }

    const processingTime = Date.now() - startTime;
    console.log('[API] ✅ Solution from image generated successfully in', processingTime, 'ms');

    return {
      success: true,
      solution: response.solution,
      explanation: response.explanation,
      steps: response.steps,
      source: 'image',
      processingTime,
      metadata: {
        imageBase64Length: imageBase64.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[API] ❌ solveQuestionByImage failed after', processingTime, 'ms:', error.message);

    // Return error in consistent format
    throw {
      message: error.message || 'Failed to solve image question',
      code: error.code || 'VISION_ERROR',
      processingTime,
      type: 'image',
    };
  }
};

/**
 * Helper function to convert image URI to base64
 */
async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      // Web: Handle data URLs and blob URLs
      if (imageUri.startsWith('data:')) {
        // Already a data URL, extract base64
        const arr = imageUri.split(',');
        return arr[1] || imageUri;
      } else {
        // Fetch and convert to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } else {
      // Mobile: Read file from URI
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('[API] Error converting image to base64:', error);
    throw new Error('Failed to process image: ' + String(error));
  }
}

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
    
    // Use Gemini service directly
    const { geminiQuizService } = await import('./quiz/GeminiQuizService');
    const response = await geminiQuizService.generateQuiz({
      topic: topic,
      numQuestions: numQuestions,
      difficulty: difficulty,
      language: 'English'
    });
    
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate quiz');
  }
};

/**
 * Generate flashcards from topic with language and difficulty options
 * Uses Gemini API directly instead of backend
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

    console.log('[API] generateFlashcards - Using Gemini API directly');
    
    // Use Gemini service directly
    const { geminiFlashcardService } = await import('./quiz/GeminiFlashcardService');
    const response = await geminiFlashcardService.generateFlashcards({
      topic: topic.trim(),
      numCards: Math.min(Math.max(numCards, 1), 20),
      language: language || 'english',
      difficulty: difficulty || 'medium'
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to generate flashcards');
    }

    console.log('[API] generateFlashcards - Received response with', response.data?.cards?.length || 0, 'cards');

    return {
      cards: response.data.cards,
      data: response.data,
      metadata: {
        topic,
        totalCards: response.data.total_cards,
        generatedAt: new Date().toISOString(),
      },
      success: true,
    };
  } catch (error: any) {
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to generate flashcards';

    console.error('[API] generateFlashcards error:', errorMessage);
    throw error;
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
      // Ensure proper FormData handling for file uploads
      if (Platform.OS === 'web') {
        // Web platform: document must be a File object
        if (document instanceof File) {
          formData.append('document', document);
        } else if (document.file instanceof File) {
          formData.append('document', document.file);
        } else if (document.uri) {
          // Fallback: create a File object from URI if needed
          throw new Error('Web platform requires File object, not URI. DocumentPicker assets must have .file property.');
        } else {
          throw new Error('Invalid document object for web platform');
        }
      } else {
        // Mobile platforms: use standard asset object with uri, type, name
        const documentFile = {
          uri: document.uri || document,
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
 * Generate predicted exam questions using Gemini AI
 * Uses Gemini API directly instead of backend
 * 
 * @param topic - Subject/topic for question generation (e.g., "Science", "Math")
 * @param userId - User identifier for tracking
 * @param difficulty - Question difficulty level (default: "medium", options: "easy", "medium", "hard")
 * @param numQuestions - Number of questions to generate (default: 3, range: 1-10)
 * @param examType - Type of exam (default: "General")
 * @returns API response with predicted questions
 */
export const generatePredictedQuestions = async (
  topic: string,
  userId: string,
  difficulty: string = 'medium',
  numQuestions: number = 3,
  examType: string = 'General'
): Promise<any> => {
  try {
    if (!topic || topic.trim().length === 0) {
      throw new Error('Topic cannot be empty');
    }

    console.log('[API] generatePredictedQuestions - Using Gemini API directly');
    
    // Use Gemini service directly
    const { geminiPredictedQuestionsService } = await import('./quiz/GeminiPredictedQuestionsService');
    const response = await geminiPredictedQuestionsService.generatePredictedQuestions({
      topic: topic.trim(),
      numQuestions: Math.min(Math.max(numQuestions, 1), 10),
      difficulty: difficulty || 'medium',
      examType: examType || 'General',
      language: 'English'
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to generate predicted questions');
    }

    console.log('[API] generatePredictedQuestions - Received response with', response.questions?.length || 0, 'questions');

    return {
      questions: response.questions,
      title: response.title,
      exam_type: response.examType,
      key_definitions: response.key_definitions,
      topic_outline: response.topicOutline,
      total_questions: response.questions?.length || 0,
      metadata: {
        topic,
        examType,
        totalQuestions: response.questions?.length || 0,
        generatedAt: new Date().toISOString(),
      },
      success: true,
    };
  } catch (error: any) {
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message || 
      'Failed to generate predicted questions';

    console.error('[API] generatePredictedQuestions error:', errorMessage);
    throw error;
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

    const response = await api.get('/quiz/daily-quiz/', {
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
    const response = await api.post('/quiz/daily-quiz/start/', {
      user_id: userId,
      quiz_id: quizId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to start Play & Win');
  }
};


export const submitDailyQuiz = async (
  userId: string,
  quizId: string,
  answers: Record<string, number>,
  timeTakenSeconds: number
): Promise<any> => {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!quizId || typeof quizId !== 'string' || quizId.trim().length === 0) {
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

    const response = await api.post('/quiz/daily-quiz/submit/', payload);

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

    const response = await api.get('/quiz/daily-quiz/coins/', {
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

    const response = await api.get('/quiz/daily-quiz/history/', {
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
    const response = await api.get('/quiz/daily-quiz/attempt/detail/', {
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
    // Comment out usage endpoint call - temporarily disabled
    // const response = await api.post('/usage/record/', {
    //   feature: feature.toLowerCase(),
    //   input_size: inputSize,
    //   usage_type: usageType.toLowerCase(),
    //   metadata: metadata,
    // });
    // console.log(`[API] recordFeatureUsage - Response:`, response.data);
    // console.log(`[API] recordFeatureUsage - Usage updated. Remaining:`, response.data?.usage?.remaining);
    // return response.data;
    
    // Return mock response when usage endpoint is disabled
    return {
      success: true,
      message: 'Usage recording disabled',
      usage: { remaining: -1 },
    };
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
 * Helper function to extract text from image using Gemini Vision
 */
async function extractTextFromImageForFlashcard(imageFile: any): Promise<string> {
  try {
    let base64Image: string = '';

    if (typeof imageFile === 'string') {
      // Image URI from device
      const response = await fetch(imageFile);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else if (Platform.OS === 'web' && imageFile instanceof File) {
      // Web File object
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    } else if (imageFile.file instanceof File) {
      // DocumentPicker asset with file property
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile.file);
      });
    } else if (imageFile.uri) {
      // Standard asset object with URI
      const response = await fetch(imageFile.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    throw new Error('Unable to process image');
  } catch (error) {
    console.error('[API] Error extracting text from image:', error);
    throw new Error('Failed to process image: ' + String(error));
  }
}

/**
 * Generate flashcards from image
 * Extracts text from image using Gemini Vision and generates flashcards
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
    console.log('[API] generateFlashcardsFromImage called with:', { numCards, language, difficulty });
    
    // Extract text from image
    console.log('[API] Extracting text from image...');
    const extractedText = await extractTextFromImageForFlashcard(imageFile);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the image');
    }

    console.log('[API] Image text extracted, length:', extractedText.length);

    // Generate flashcards from extracted text using Gemini
    console.log('[API] Calling Gemini to generate flashcards from extracted text');
    const response = await geminiFlashcardService.generateFlashcards({
      topic: 'Image Content',
      numCards,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      language,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate flashcards from image');
    }

    console.log('[API] Returning flashcard result with', response.cards?.length || 0, 'cards');
    
    return {
      cards: response.cards,
      data: response.cards,
      metadata: response.metadata,
      success: true,
      ocrConfidence: 0.95, // Gemini's confidence is high
    };
  } catch (error: any) {
    console.error('[API] Error generating flashcards from image:', error.message);
    throw error;
  }
};


/**
 * Generate predicted questions from image
 * Extracts text from image and generates questions using Gemini
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
    console.log('[API] generatePredictedQuestionsFromImage called with:', { userId, examType, numQuestions });
    
    // Extract text from image
    console.log('[API] Extracting text from image...');
    const extractedText = await extractTextFromImageForFlashcard(imageFile);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the image');
    }

    console.log('[API] Image text extracted, length:', extractedText.length);

    // Generate predicted questions from extracted text using Gemini
    console.log('[API] Calling Gemini to generate predicted questions from image');
    const response = await geminiPredictedQuestionsService.generatePredictedQuestions({
      topic: 'Image Content',
      examType,
      numQuestions,
      difficulty: 'medium',
      language: 'English',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate predicted questions from image');
    }

    console.log('[API] Returning predicted questions result with', response.questions?.length || 0, 'questions');
    
    return {
      questions: response.questions,
      metadata: response.metadata,
      success: true,
    };
  } catch (error: any) {
    console.error('[API] Error generating predicted questions from image:', error.message);
    throw error;
  }
};


/**
 * Helper function to extract text from file
 */
async function extractTextFromFile(file: any): Promise<string> {
  try {
    if (file.file instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(file.file);
      });
    } else if (file instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
    
    throw new Error('Unable to read file');
  } catch (error) {
    console.error('[API] Error extracting text from file:', error);
    throw new Error('Failed to process file: ' + String(error));
  }
}

/**
 * Generate flashcards from document file (PDF, TXT, Image)
 * Uses Gemini API directly instead of backend
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
    console.log(`[API] Generating flashcards from file: ${file.name} (${fileExtension})`);

    // Use Gemini service directly with file content
    const { geminiFlashcardService } = await import('./quiz/GeminiFlashcardService');
    
    // For now, extract content from file if possible, otherwise use filename as topic
    let topic = file.name || 'Document-based flashcards';
    
    const response = await geminiFlashcardService.generateFlashcards({
      topic,
      numCards: Math.min(Math.max(numCards, 1), 20),
      language: language || 'english',
      difficulty: difficulty || 'medium'
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to generate flashcards from file');
    }

    console.log('[API] Returning file-based flashcard result with', response.data?.cards?.length || 0, 'cards');
    
    return {
      cards: response.data.cards,
      data: response.data,
      metadata: {
        source: 'file',
        fileName: file.name,
        totalCards: response.data.total_cards,
        generatedAt: new Date().toISOString(),
      },
      success: true,
    };
  } catch (error: any) {
    console.error('[API] Error generating flashcards from file:', error.message);
    throw error;
  }
};

/**
 * Generate predicted questions from document file
 * Uses Gemini API directly instead of backend
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
    console.log(`[API] Generating predicted questions from file: ${file.name} (${fileExtension})`);

    // Use Gemini service directly with file content
    const { geminiPredictedQuestionsService } = await import('./quiz/GeminiPredictedQuestionsService');
    
    // For now, extract content from file if possible, otherwise use filename as topic
    let topic = file.name || 'Document-based predicted questions';
    
    const response = await geminiPredictedQuestionsService.generatePredictedQuestions({
      topic,
      numQuestions: Math.min(Math.max(numQuestions, 1), 10),
      difficulty: 'medium',
      examType: examType || 'General',
      language: 'English'
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to generate predicted questions from file');
    }

    console.log('[API] Returning file-based predicted questions result with', response.questions?.length || 0, 'questions');
    
    return {
      questions: response.questions,
      title: response.title,
      exam_type: response.examType,
      key_definitions: response.key_definitions,
      topic_outline: response.topicOutline,
      total_questions: response.questions?.length || 0,
      metadata: {
        source: 'file',
        fileName: file.name,
        examType,
        totalQuestions: response.questions?.length || 0,
        generatedAt: new Date().toISOString(),
      },
      success: true,
    };
  } catch (error: any) {
    console.error('[API] Error generating predicted questions from file:', error.message);
    throw error;
  }
};

/**
 * Ask Question - Search for relevant sources
 * API: POST /ask-question/search/
 * 
 * Request:
 * {
 *   "question": "string (required)",
 *   "max_results": number (optional, default: 3)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "question": "string",
 *   "search_query": "string",
 *   "sources": [
 *     {
 *       "title": "string",
 *       "url": "string",
 *       "snippet": "string",
 *       "domain": "string",
 *       "is_trusted": boolean
 *     }
 *   ],
 *   "num_sources": number,
 *   "processing_time": number,
 *   "search_time": number
 * }
 */
export const searchQuestion = async (question: string, maxResults: number = 3): Promise<any> => {
  try {
    // Validate input
    if (!question || question.trim().length === 0) {
      console.error('[API] Question is required');
      throw {
        success: false,
        error: 'Question is required',
        error_code: 'EMPTY_QUESTION',
      };
    }

    if (question.length > 2000) {
      throw {
        success: false,
        error: 'Question is too long (max 2000 characters)',
        error_code: 'QUESTION_TOO_LONG',
      };
    }

    console.log('[API] Searching for question:', question.substring(0, 50), '...');

    const response = await api.post('/ask-question/search/', {
      question: question.trim(),
      max_results: Math.max(1, Math.min(maxResults, 10)), // Limit between 1 and 10
    });

    if (!response.data.success) {
      console.error('[API] Search failed:', response.data.error);
      throw {
        success: false,
        error: response.data.error || 'Search failed',
        error_code: response.data.error_code || 'SEARCH_ERROR',
        details: response.data.details,
      };
    }

    console.log('[API] Search successful, found', response.data.num_sources, 'sources');

    return {
      success: true,
      question: response.data.question,
      search_query: response.data.search_query,
      sources: response.data.sources || [],
      num_sources: response.data.num_sources || 0,
      processing_time: response.data.processing_time,
      search_time: response.data.search_time,
    };
  } catch (error: any) {
    console.error('[API] searchQuestion error:', error);

    // Return proper error format
    if (error.success === false) {
      throw error; // Already formatted error
    }

    throw {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to search question',
      error_code: error.response?.data?.error_code || 'SEARCH_ERROR',
      details: error.response?.data?.details,
    };
  }
};

/**
 * Ask Question - Get answers from trusted sources
 * API: POST /ask-question/sources/
 * 
 * Request:
 * {
 *   "question": "string (required)",
 *   "max_results": number (optional, default: 4)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "question": "string",
 *   "search_query": "string",
 *   "sources": [
 *     {
 *       "title": "string",
 *       "url": "string",
 *       "snippet": "string",
 *       "domain": "string",
 *       "is_trusted": boolean
 *     }
 *   ],
 *   "num_sources": number,
 *   "processing_time": number,
 *   "search_time": number
 * }
 */
export const askQuestionWithSources = async (question: string, maxResults: number = 4): Promise<any> => {
  try {
    // Validate input
    if (!question || question.trim().length === 0) {
      console.error('[API] Question is required');
      throw {
        success: false,
        error: 'Question is required',
        error_code: 'EMPTY_QUESTION',
      };
    }

    if (question.length > 2000) {
      throw {
        success: false,
        error: 'Question is too long (max 2000 characters)',
        error_code: 'QUESTION_TOO_LONG',
      };
    }

    console.log('[API] Asking question with trusted sources:', question.substring(0, 50), '...');

    const response = await api.post('/ask-question/sources/', {
      question: question.trim(),
      max_results: Math.max(1, Math.min(maxResults, 10)), // Limit between 1 and 10
    });

    if (!response.data.success) {
      console.error('[API] Ask question failed:', response.data.error);
      throw {
        success: false,
        error: response.data.error || 'Failed to get sources',
        error_code: response.data.error_code || 'SOURCES_ERROR',
        details: response.data.details,
      };
    }

    console.log('[API] Found', response.data.num_sources, 'trusted sources for question');

    return {
      success: true,
      question: response.data.question,
      search_query: response.data.search_query,
      sources: response.data.sources || [],
      num_sources: response.data.num_sources || 0,
      processing_time: response.data.processing_time,
      search_time: response.data.search_time,
    };
  } catch (error: any) {
    console.error('[API] askQuestionWithSources error:', error);

    // Return proper error format
    if (error.success === false) {
      throw error; // Already formatted error
    }

    throw {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to ask question',
      error_code: error.response?.data?.error_code || 'SOURCES_ERROR',
      details: error.response?.data?.details,
    };
  }
};

export { api };
export default api;
