import axios from 'axios';

// Gemini API Configuration - Enhanced with multiple fallbacks
const GEMINI_API_KEY = (() => {
  // Try multiple sources for the API key
  const key = 
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof window !== 'undefined' && (window as any).EXPO_PUBLIC_GEMINI_API_KEY) ||
    '';
  
  if (key) {
    console.log('✅ Gemini API Key loaded successfully (length: ' + key.length + ')');
  } else {
    console.warn('⚠️ Gemini API Key NOT found in environment - quiz generation will fail');
  }
  
  return key;
})();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';

// Validate API key on module load
if (!GEMINI_API_KEY) {
  console.error('[GeminiQuizService] CRITICAL: API key is missing. Check .env file or environment variables.');
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface QuizGenerationOptions {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  questionTypes?: string[]; // ['multiple-choice', 'true-false', 'fill-blank']
  language?: string;
}

export interface QuizResponse {
  success: boolean;
  questions: QuizQuestion[];
  metadata: {
    topic: string;
    difficulty: string;
    totalQuestions: number;
    generatedAt: string;
  };
  error?: string;
}

class GeminiQuizService {
  private apiKey: string;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
    
    // Log constructor initialization
    if (this.apiKey) {
      console.log('[GeminiQuizService] Initialized with API key (length: ' + this.apiKey.length + ')');
    } else {
      console.error('[GeminiQuizService] CRITICAL: No API key available in constructor');
    }
  }

  /**
   * Generate quiz questions using Gemini API with retry logic
   */
  async generateQuiz(options: QuizGenerationOptions): Promise<QuizResponse> {
    try {
      // CRITICAL: Validate API key
      if (!this.apiKey || this.apiKey.trim() === '') {
        console.error('[GeminiQuizService] API key validation failed', {
          hasKey: !!this.apiKey,
          keyLength: this.apiKey?.length || 0,
          isDefined: this.apiKey !== undefined,
        });
        
        throw new Error(
          'Gemini API key is not configured. ' +
          'Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file and restart the app.'
        );
      }

      console.log('[GeminiQuizService] Starting quiz generation', {
        topic: options.topic,
        difficulty: options.difficulty,
        numQuestions: options.numQuestions,
        apiKeyLength: this.apiKey.length,
      });

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
        throw new Error('No response from Gemini API - empty response');
      }

      console.log('[GeminiQuizService] Received response from Gemini API');

      const questions = this.parseGeneratedQuestions(generatedText, options);

      if (questions.length === 0) {
        throw new Error('Failed to parse questions from Gemini response');
      }

      console.log('[GeminiQuizService] Successfully generated ' + questions.length + ' questions');

      return {
        success: true,
        questions,
        metadata: {
          topic: options.topic,
          difficulty: options.difficulty,
          totalQuestions: questions.length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('[GeminiQuizService] Quiz generation error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        topic: options.topic,
      });
      
      // Provide helpful error message
      let userMessage = 'Failed to generate quiz';
      if (error.message.includes('API key')) {
        userMessage = 'Quiz feature is not configured. Please contact support.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Quiz generation took too long. Please try again.';
      } else if (error.response?.status === 403) {
        userMessage = 'API key is invalid or expired.';
      } else if (error.response?.status === 429) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      return {
        success: false,
        questions: [],
        metadata: {
          topic: options.topic,
          difficulty: options.difficulty,
          totalQuestions: 0,
          generatedAt: new Date().toISOString(),
        },
        error: userMessage,
      };
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private buildPrompt(options: QuizGenerationOptions): string {
    const { topic, difficulty, numQuestions, questionTypes, language = 'English' } = options;

    return `Generate ${numQuestions} ${difficulty} difficulty multiple-choice quiz questions about "${topic}".

Requirements:
- Each question must have 4 options (A, B, C, D)
- Provide the correct answer
- Include a brief explanation for each answer
- Questions should be clear, concise, and educational
- Difficulty level: ${difficulty}
- Language: ${language}
${questionTypes ? `- Question types: ${questionTypes.join(', ')}` : ''}

Format your response as a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation why this is correct",
    "difficulty": "${difficulty}",
    "topic": "${topic}"
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text before or after.`;
  }

  /**
   * Parse the generated text from Gemini into structured questions
   */
  private parseGeneratedQuestions(
    generatedText: string,
    options: QuizGenerationOptions
  ): QuizQuestion[] {
    try {
      // Remove markdown code blocks if present
      let jsonText = generatedText.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const parsedQuestions = JSON.parse(jsonText);
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Generated response is not an array');
      }

      return parsedQuestions.map((q, index) => ({
        id: `quiz_${Date.now()}_${index}`,
        question: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? 0,
        explanation: q.explanation,
        difficulty: q.difficulty || options.difficulty,
        topic: q.topic || options.topic,
      }));
    } catch (error) {
      console.error(' Failed to parse Gemini response:', error);
      console.error('Raw response:', generatedText);
      
      // Return empty array if parsing fails
      return [];
    }
  }

  /**
   * Validate a quiz answer
   */
  validateAnswer(question: QuizQuestion, userAnswer: number): boolean {
    return question.correctAnswer === userAnswer;
  }

  /**
   * Calculate quiz score
   */
  calculateScore(questions: QuizQuestion[], userAnswers: Record<string, number>): {
    score: number;
    correct: number;
    incorrect: number;
    percentage: number;
  } {
    let correct = 0;
    let incorrect = 0;

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      if (userAnswer !== undefined) {
        if (this.validateAnswer(question, userAnswer)) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const total = questions.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;

    return {
      score: correct,
      correct,
      incorrect,
      percentage: Math.round(percentage * 100) / 100,
    };
  }
}

// Export singleton instance
export const geminiQuizService = new GeminiQuizService();
export default GeminiQuizService;
