import { geminiFlashcardService } from './quiz/GeminiFlashcardService';

/**
 * Generate Flashcards from topic or document
 * Uses Gemini API directly
 * @param input - Either topic (string) or document (file)
 * @param userId - User ID (required)
 * @param numCards - Number of cards (optional)
 * @param language - Language (optional)
 * @returns Flashcards data
 */
export const generateFlashcards = async (
  input: { topic?: string; document?: any },
  userId: string,
  numCards: number = 5,
  language: string = 'english'
) => {
  try {
    console.log('[Flashcards Service] generateFlashcards called with:', {
      hasDocument: !!input.document,
      documentLength: input.document?.length || 0,
      topic: input.topic,
      numCards,
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
    console.log('[Flashcards Service] Calling Gemini Flashcard Service with topic length:', topic.length);
    const response = await geminiFlashcardService.generateFlashcards({
      topic,
      numCards: numCards || 5,
      language: language || 'english',
      difficulty: 'medium',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate flashcards from Gemini');
    }

    console.log('[Flashcards Service] Response received with', response.data.cards.length, 'cards');

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('[Flashcards Service] Error:', error.message);
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

export default {
  generateFlashcards,
};
