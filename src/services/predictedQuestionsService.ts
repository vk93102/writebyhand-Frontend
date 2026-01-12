import { geminiPredictedQuestionsService } from './quiz/GeminiPredictedQuestionsService';

/**
 * Generate Predicted Questions from topic or document
 * Uses Gemini API directly
 * @param input - Either topic (string) or document (file)
 * @param userId - User ID (required)
 * @param examType - Exam type (required)
 * @param numQuestions - Number of questions (optional)
 * @param language - Language (optional)
 * @returns Predicted questions data
 */
export const generatePredictedQuestions = async (
  input: { topic?: string; document?: any },
  userId: string,
  examType: string,
  numQuestions?: number,
  language?: string
) => {
  try {
    console.log('[Predicted Questions Service] generatePredictedQuestions called with:', {
      hasDocument: !!input.document,
      documentLength: input.document?.length || 0,
      topic: input.topic,
      examType,
      numQuestions,
      language,
    });

    // Extract topic/content from input
    let topic = input.topic || 'General Knowledge';
    
    // If document content is provided, use it as the main content
    if (input.document && typeof input.document === 'string') {
      const docLength = input.document.length;
      
      // If document is reasonably sized text content (likely a real document, not garbage)
      if (docLength > 50 && !input.document.includes('\x00') && !input.document.includes('Binary')) {
        // Use the full document as topic for better context
        topic = input.document;
      } else if (!input.topic) {
        // Fallback to default
        topic = 'General Knowledge';
      }
    }

    // Use Gemini service directly
    console.log('[Predicted Questions Service] Calling Gemini Predicted Questions Service with topic length:', topic.length);
    const response = await geminiPredictedQuestionsService.generatePredictedQuestions({
      topic,
      numQuestions: numQuestions || 5,
      language: language || 'english',
      examType: examType || 'general',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate predicted questions from Gemini');
    }

    console.log('[Predicted Questions Service] Response received with', response.data.questions.length, 'questions');

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('[Predicted Questions Service] Error:', error.message);
    throw error;
  }
};

export default {
  generatePredictedQuestions,
};
