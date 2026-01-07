import axios from 'axios';

// Gemini API Configuration
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in .env');
    }
  }

  /**
   * Generate quiz questions using Gemini API
   */
  async generateQuiz(options: QuizGenerationOptions): Promise<QuizResponse> {
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
          timeout: 30000, // 30 seconds
        }
      );

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No response from Gemini API');
      }

      const questions = this.parseGeneratedQuestions(generatedText, options);

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
      console.error('❌ Gemini Quiz Generation Error:', error);
      
      return {
        success: false,
        questions: [],
        metadata: {
          topic: options.topic,
          difficulty: options.difficulty,
          totalQuestions: 0,
          generatedAt: new Date().toISOString(),
        },
        error: error.response?.data?.error?.message || error.message || 'Failed to generate quiz',
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
      console.error('❌ Failed to parse Gemini response:', error);
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
