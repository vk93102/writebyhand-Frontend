import axios from 'axios';

// Gemini API Configuration
const GEMINI_API_KEY = typeof process !== 'undefined' && process.env ? (process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '') : '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';

// Debug: Log if key is available
if (GEMINI_API_KEY) {
  console.log('✅ Gemini API Key loaded successfully');
} else {
  console.warn('⚠️ Gemini API Key NOT found in environment');
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface FlashcardGenerationOptions {
  topic: string;
  numCards: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
}

export interface FlashcardResponse {
  success: boolean;
  cards: Flashcard[];
  data?: Flashcard[];
  metadata: {
    topic: string;
    totalCards: number;
    generatedAt: string;
  };
  error?: string;
}

class GeminiFlashcardService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
  }

  /**
   * Generate flashcards using Gemini API
   */
  async generateFlashcards(options: FlashcardGenerationOptions): Promise<FlashcardResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const prompt = this.buildPrompt(options);
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 120 seconds for AI generation
        }
      );

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No response from Gemini API');
      }

      const cards = this.parseGeneratedFlashcards(generatedText, options);

      return {
        success: true,
        cards,
        data: cards,
        metadata: {
          topic: options.topic,
          totalCards: cards.length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('❌ Gemini Flashcard Generation Error:', error);
      
      return {
        success: false,
        cards: [],
        data: [],
        metadata: {
          topic: options.topic,
          totalCards: 0,
          generatedAt: new Date().toISOString(),
        },
        error: error.response?.data?.error?.message || error.message || 'Failed to generate flashcards',
      };
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private buildPrompt(options: FlashcardGenerationOptions): string {
    const { topic, numCards, difficulty = 'medium', language = 'English' } = options;

    return `Generate ${numCards} flashcards for studying about "${topic}".

Requirements:
- Each flashcard should have a question/prompt on one side and answer on the other
- Questions should be concise and clear
- Answers should be comprehensive but concise
- Difficulty level: ${difficulty}
- Language: ${language}
- Focus on key concepts and important facts
- Include diverse question types (definitions, explanations, examples, etc.)

Format your response as a valid JSON array with this exact structure:
[
  {
    "question": "What is/Who is/Explain... ?",
    "answer": "Concise and clear answer",
    "difficulty": "${difficulty}",
    "topic": "${topic}"
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text before or after.`;
  }

  /**
   * Parse the generated text from Gemini into structured flashcards
   */
  private parseGeneratedFlashcards(
    generatedText: string,
    options: FlashcardGenerationOptions
  ): Flashcard[] {
    try {
      // Remove markdown code blocks if present
      let jsonText = generatedText.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const parsedCards = JSON.parse(jsonText);
      
      if (!Array.isArray(parsedCards)) {
        throw new Error('Generated response is not an array');
      }

      return parsedCards.map((card, index) => ({
        id: `flashcard_${Date.now()}_${index}`,
        question: card.question || '',
        answer: card.answer || '',
        difficulty: card.difficulty || options.difficulty || 'medium',
        topic: card.topic || options.topic,
      }));
    } catch (error) {
      console.error('❌ Failed to parse Gemini response:', error);
      console.error('Raw response:', generatedText);
      
      // Return empty array if parsing fails
      return [];
    }
  }
}

// Export singleton instance
export const geminiFlashcardService = new GeminiFlashcardService();
export default GeminiFlashcardService;
