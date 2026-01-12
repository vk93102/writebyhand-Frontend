import { geminiQuizService } from './quiz/GeminiQuizService';

export const generateQuiz = async (
  input: { topic?: string; document?: any },
  userId: string,
  numQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  subject?: string
) => {
  try {
    console.log('[Quiz Service] generateQuiz called with:', { 
      hasDocument: !!input.document,
      documentLength: input.document?.length || 0,
      topic: input.topic,
      numQuestions,
      difficulty,
      subject 
    });
    
    // Extract topic/content from input
    let topic = input.topic || subject || 'General Knowledge';
    
    // If document content is provided, use it as the main content
    if (input.document && typeof input.document === 'string') {
      const docLength = input.document.length;
      
      // If document is reasonably sized text content (likely a real document, not garbage)
      if (docLength > 50 && !input.document.includes('\x00') && !input.document.includes('Binary')) {
        // Use the full document as topic for better context
        topic = input.document;
      } else if (!input.topic) {
        // Fallback to first meaningful part or subject
        topic = subject || 'General Knowledge';
      }
    }

    // Use Gemini service directly
    console.log('[Quiz Service] Calling Gemini Quiz Service with topic length:', topic.length);
    const response = await geminiQuizService.generateQuiz({
      topic,
      difficulty,
      numQuestions: numQuestions || 5,
      language: 'English',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate quiz from Gemini');
    }

    console.log('[Quiz Service] generateQuiz response received with', response.questions.length, 'questions');

    // Extract a clean title from topic
    const titlePreview = topic.substring(0, 50).split('\n')[0].replace(/\[.*?\]/g, '').trim();
    const title = titlePreview || `Quiz: ${subject || 'General Knowledge'}`;

    return {
      success: true,
      data: {
        title,
        topic: titlePreview || topic.substring(0, 100),
        difficulty,
        questions: response.questions,
      },
      questions: response.questions,
    };
  } catch (error: any) {
    console.error('[Quiz Service] generateQuiz error:', error.message);
    throw error;
  }
};

/**
 * Helper function to determine file type from extension
 */
function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}


async function extractTextFromImage(imageFile: any): Promise<string> {
  try {
    let base64Image: string = '';

    if (typeof imageFile === 'string') {
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
    console.error('[Quiz Service] Error extracting text from image:', error);
    throw new Error('Failed to process image: ' + String(error));
  }
}

/**
 * Generate quiz from image document
 * Extracts text from image and generates quiz using Gemini API
 * 
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
    
    // Extract text from image
    console.log('[Quiz Service] Extracting text from image...');
    const extractedText = await extractTextFromImage(imageFile);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the image');
    }

    console.log('[Quiz Service] Image text extracted, length:', extractedText.length);

    // Generate quiz from extracted text using Gemini
    console.log('[Quiz Service] Calling Gemini to generate quiz from extracted text');
    const response = await geminiQuizService.generateQuiz({
      topic: 'Image Content',
      difficulty,
      numQuestions,
      language: 'English',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate quiz from image');
    }

    console.log('[Quiz Service] generateQuizFromImage response received with', response.questions.length, 'questions');

    return {
      success: true,
      data: {
        title: 'Quiz from Image',
        topic: 'Image Content',
        difficulty,
        questions: response.questions,
      },
      questions: response.questions,
      source: 'image',
    };
  } catch (error: any) {
    console.error('[Quiz Service] generateQuizFromImage error:', error.message);
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
  getQuizQuestions,
  submitQuiz,
  getQuizResults,
  generateQuizFromYouTube,
};
