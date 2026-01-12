import { api } from './api';

// Note: Using shared api instance from api.ts which includes:
// - X-User-ID header injection via interceptor
// - Bearer token authorization
// - Response/error handling
// - Timeout: 60s (extended to 120s for quiz operations below)

/**
 * Generate quiz from topic (without saving to database)
 * Quick generation for immediate use
 * 
 * API: POST /quiz/generate/
 * @param topic - The topic to generate quiz about
 * @param numQuestions - Number of questions (default: 5)
 * @param difficulty - Difficulty level: easy, medium, hard (default: medium)
 * @returns Generated quiz with questions
 */
export const generateQuiz = async (
  topic: string,
  numQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
) => {
  try {
    console.log('[Quiz Service] generateQuiz endpoint called with:', { topic, num_questions: numQuestions, difficulty: difficulty.toLowerCase() });
    
    // Create axios instance with extended timeout for this specific call
    const axiosInstance = api;
    axiosInstance.defaults.timeout = 120000; // 2 minutes for AI processing
    
    const payload = {
      topic,
      num_questions: numQuestions,
      difficulty: difficulty.toLowerCase(),
    };
    
    console.log('[Quiz Service] POST /quiz/generate/ - Payload:', payload);
    const response = await axiosInstance.post('/quiz/generate/', payload);

    console.log('[Quiz Service] generateQuiz response status:', response.status);
    console.log('[Quiz Service] generateQuiz response data:', response.data);

    return {
      success: true,
      data: response.data,
      questions: response.data.questions,
    };
  } catch (error: any) {
    console.error('[Quiz Service] generateQuiz error:', {
      endpoint: 'POST /quiz/generate/',
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    throw error; // Throw to let handler catch it with full error details
  }
};

/**
 * Create and save quiz to database
 * Stores quiz for later retrieval and tracking
 * 
 * API: POST /quiz/create/
 * @param transcript - Text content for quiz generation
 * @param title - Quiz title
 * @param numQuestions - Number of questions (default: 5)
 * @param difficulty - Difficulty level
 * @param sourceType - Source type: text, youtube, image (default: text)
 * @param sourceId - Optional source identifier
 * @returns Quiz with ID for future reference
 */
export const createQuiz = async (
  transcript: string,
  title: string,
  numQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  sourceType: 'text' | 'youtube' | 'image' = 'text',
  sourceId: string = ''
) => {
  try {
    console.log('[Quiz Service] createQuiz called with:', { title, numQuestions, difficulty, sourceType });
    
    const axiosInstance = api;
    axiosInstance.defaults.timeout = 120000; // 2 minutes for AI processing
    
    const response = await axiosInstance.post('/quiz/create/', {
      transcript,
      title,
      source_type: sourceType,
      source_id: sourceId,
      num_questions: numQuestions,
      difficulty: difficulty.toLowerCase(),
    });

    console.log('[Quiz Service] createQuiz response:', response.data);

    return {
      success: true,
      data: response.data,
      quizId: response.data.quiz_id,
      questions: response.data.questions,
      totalQuestions: response.data.total_questions,
    };
  } catch (error: any) {
    console.error('[Quiz Service] createQuiz error:', error.message, error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    };
  }
};

/**
 * Generate quiz from image document
 * Sends image directly to backend for OCR and quiz generation
 * 
 * API: POST /quiz/generate/
 * @param imageFile - Image file to process
 * @param numQuestions - Number of questions (default: 5)
 * @param difficulty - Difficulty level (default: medium)
 * @returns Generated quiz with questions from image
 */
export const generateQuizFromImage = async (
  imageFile: any,
  numQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
) => {
  try {
    console.log('[Quiz Service] generateQuizFromImage called with:', { num_questions: numQuestions, difficulty });
    
    const formData = new FormData();
    
    // Handle different image sources
    if (typeof imageFile === 'string') {
      // Image URI from device
      const filename = imageFile.split('/').pop() || 'document.jpg';
      const fileData = {
        uri: imageFile,
        type: 'image/jpeg',
        name: filename,
      } as any;
      formData.append('document', fileData);
    } else if (imageFile instanceof File) {
      // Web File object
      formData.append('document', imageFile);
    } else if (imageFile.file) {
      // DocumentPicker asset with file property
      formData.append('document', imageFile.file);
    } else {
      throw new Error('Invalid image source');
    }

    formData.append('num_questions', numQuestions.toString());
    formData.append('difficulty', difficulty.toLowerCase());

    console.log('[Quiz Service] POST /quiz/generate/ with form data - num_questions:', numQuestions, 'difficulty:', difficulty);
    
    const axiosInstance = api;
    axiosInstance.defaults.timeout = 120000; // 2 minutes for AI processing
    
    const response = await axiosInstance.post('/quiz/generate/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('[Quiz Service] generateQuizFromImage response status:', response.status);
    console.log('[Quiz Service] generateQuizFromImage response data:', response.data);

    return {
      success: true,
      data: response.data,
      questions: response.data.questions,
      source: 'image',
    };
  } catch (error: any) {
    console.error('[Quiz Service] generateQuizFromImage error:', {
      endpoint: 'POST /quiz/generate/',
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    throw error;
  }
};

/**
 * Get quiz questions and details
 * Retrieves a previously created quiz
 * 
 * API: GET /quiz/{quiz_id}/
 * @param quizId - The quiz ID
 * @returns Quiz details with questions
 */
export const getQuizQuestions = async (quizId: string) => {
  try {
    console.log('[Quiz Service] getQuizQuestions called with:', { quizId });
    
    const response = await api.get(`/quiz/${quizId}/`);

    console.log('[Quiz Service] getQuizQuestions response:', response.data);

    return {
      success: true,
      data: response.data,
      title: response.data.title,
      questions: response.data.questions,
      totalQuestions: response.data.total_questions,
      difficulty: response.data.difficulty_level,
    };
  } catch (error: any) {
    console.error('[Quiz Service] getQuizQuestions error:', error.message, error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Submit quiz responses and get scoring
 * Evaluates answers and returns performance metrics
 * 
 * API: POST /quiz/{quiz_id}/submit/
 * @param quizId - The quiz ID
 * @param responses - Map of question_id to answer
 * @param sessionId - Optional session identifier (default: auto-generated)
 * @returns Scoring results and response ID
 */
export const submitQuiz = async (
  quizId: string,
  responses: Record<string, any>,
  sessionId: string = `session_${Date.now()}`
) => {
  try {
    console.log('[Quiz Service] submitQuiz called with:', { quizId, sessionId, responseCount: Object.keys(responses).length });
    
    const response = await api.post(`/quiz/${quizId}/submit/`, {
      session_id: sessionId,
      responses,
    });

    console.log('[Quiz Service] submitQuiz response:', response.data);

    return {
      success: true,
      data: response.data,
      responseId: response.data.response_id,
      score: response.data.score,
      correctAnswers: response.data.correct_answers,
      totalQuestions: response.data.total_questions,
      percentage: Math.round((response.data.correct_answers / response.data.total_questions) * 100),
      analysis: response.data.analysis,
    };
  } catch (error: any) {
    console.error('[Quiz Service] submitQuiz error:', error.message, error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    };
  }
};

/**
 * Get quiz results and detailed analysis
 * Retrieves scoring results and feedback
 * 
 * API: GET /quiz/{response_id}/results/
 * @param responseId - The response/submission ID
 * @returns Quiz results with analysis and feedback
 */
export const getQuizResults = async (responseId: string) => {
  try {
    console.log('[Quiz Service] getQuizResults called with:', { responseId });
    
    const response = await api.get(`/quiz/${responseId}/results/`);

    console.log('[Quiz Service] getQuizResults response:', response.data);

    return {
      success: true,
      data: response.data,
      title: response.data.quiz_title,
      score: response.data.score,
      percentage: response.data.percentage,
      feedback: response.data.feedback,
      completedAt: response.data.completed_at,
    };
  } catch (error: any) {
    console.error('[Quiz Service] getQuizResults error:', error.message, error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Generate quiz from YouTube video
 * Integrated with YouTube summarizer - generates quiz from video content
 * 
 * @param videoUrl - YouTube video URL
 * @param numQuestions - Number of questions (default: 5)
 * @param difficulty - Difficulty level (default: intermediate)
 * @returns Quiz with summary and questions
 */
export const generateQuizFromYouTube = async (
  videoUrl: string,
  numQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
) => {
  try {
    console.log('[Quiz Service] generateQuizFromYouTube called with:', { videoUrl, numQuestions, difficulty });
    
    const axiosInstance = api;
    axiosInstance.defaults.timeout = 120000; // 2 minutes for AI processing
    
    const response = await axiosInstance.post('/youtube/summarize/', {
      video_url: videoUrl,
      generate_quiz: true,
      quiz_questions: numQuestions,
      quiz_difficulty: difficulty,
    });

    console.log('[Quiz Service] generateQuizFromYouTube response:', response.data);

    return {
      success: true,
      data: response.data,
      summary: response.data.summary,
      notes: response.data.notes,
      questions: response.data.questions,
      quiz: response.data.quiz,
    };
  } catch (error: any) {
    console.error('[Quiz Service] generateQuizFromYouTube error:', error.message, error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    };
  }
};

export default {
  generateQuiz,
  createQuiz,
  getQuizQuestions,
  submitQuiz,
  getQuizResults,
  generateQuizFromYouTube,
};
