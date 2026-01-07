import axios from 'axios';

const API_BASE_URL = 'http://localhost:8003/api';

// Timeout configuration for long-running operations
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for quiz operations
});

/**
 * Generate quiz from YouTube video
 * Integrated with YouTube summarizer
 */
export const generateQuizFromYouTube = async (
  videoUrl: string,
  numQuestions: number = 5,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
) => {
  try {
    const response = await axiosInstance.post('/youtube/summarize/', {
      video_url: videoUrl,
      generate_quiz: true,
      quiz_questions: numQuestions,
      quiz_difficulty: difficulty,
    });

    return {
      success: true,
      data: response.data,
      summary: response.data.summary,
      notes: response.data.notes,
      questions: response.data.questions,
      quiz: response.data.quiz,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    };
  }
};

/**
 * Generate quiz from text content
 */
export const generateQuizFromText = async (
  transcript: string,
  title: string,
  sourceType: 'youtube' | 'text' | 'image' = 'text',
  sourceId: string = '',
  numQuestions: number = 5,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
) => {
  try {
    const response = await axiosInstance.post('/quiz/create/', {
      transcript,
      title,
      source_type: sourceType,
      source_id: sourceId,
      num_questions: numQuestions,
      difficulty,
    });

    return {
      success: true,
      data: response.data,
      quizId: response.data.quiz_id,
      questions: response.data.questions,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    };
  }
};

/**
 * Submit quiz responses and get scoring
 */
export const submitQuiz = async (
  quizId: string,
  responses: Record<string, string>,
  sessionId: string = 'anonymous'
) => {
  try {
    const response = await axiosInstance.post(`/quiz/${quizId}/submit/`, {
      session_id: sessionId,
      responses,
    });

    return {
      success: true,
      data: response.data,
      score: response.data.score,
      correctAnswers: response.data.correct_answers,
      totalQuestions: response.data.total_questions,
      analysis: response.data.analysis,
      results: response.data.results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data?.details,
    };
  }
};

/**
 * Get quiz results and detailed analysis
 */
export const getQuizResults = async (responseId: string) => {
  try {
    const response = await axiosInstance.get(`/quiz/${responseId}/results/`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Get quiz questions (without answers)
 */
export const getQuizQuestions = async (quizId: string) => {
  try {
    const response = await axiosInstance.get(`/quiz/${quizId}/`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

export default {
  generateQuizFromYouTube,
  generateQuizFromText,
  submitQuiz,
  getQuizResults,
  getQuizQuestions,
};
