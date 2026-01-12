import axios from 'axios';

const GEMINI_API_KEY = typeof process !== 'undefined' && process.env ? (process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '') : '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';

if (GEMINI_API_KEY) {
  console.log('✅ Gemini API Key loaded successfully');
} else {
  console.warn('⚠️ Gemini API Key NOT found in environment');
}

export interface PredictedQuestion {
  id: string | number;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: 'high' | 'medium' | 'low';
  question_type?: string;
  depth_level?: string;
  expected_answer_length?: string;
  key_concepts?: string[];
  hint?: string;
  sample_answer?: string;
  why_important?: string;
  related_topics?: string[];
  tags?: string[];
}

export interface PredictedQuestionsGenerationOptions {
  topic: string;
  examType: string;
  numQuestions: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
}

export interface PredictedQuestionsResponse {
  success: boolean;
  questions: PredictedQuestion[];
  metadata: {
    topic: string;
    examType: string;
    totalQuestions: number;
    generatedAt: string;
  };
  error?: string;
}

class GeminiPredictedQuestionsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
  }

  /**
   * Generate predicted questions using Gemini API
   */
  async generatePredictedQuestions(options: PredictedQuestionsGenerationOptions): Promise<PredictedQuestionsResponse> {
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

      const questions = this.parseGeneratedQuestions(generatedText, options);

      return {
        success: true,
        questions,
        metadata: {
          topic: options.topic,
          examType: options.examType,
          totalQuestions: questions.length,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('❌ Gemini Predicted Questions Generation Error:', error);
      
      return {
        success: false,
        questions: [],
        metadata: {
          topic: options.topic,
          examType: options.examType,
          totalQuestions: 0,
          generatedAt: new Date().toISOString(),
        },
        error: error.response?.data?.error?.message || error.message || 'Failed to generate predicted questions',
      };
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private buildPrompt(options: PredictedQuestionsGenerationOptions): string {
    const { topic, numQuestions, difficulty = 'medium', examType, language = 'English' } = options;

    return `Generate ${numQuestions} predicted exam questions for "${examType}" based on "${topic}".

Requirements:
- These should be questions that are likely to appear in the ${examType} exam
- Focus on important concepts and frequently tested topics
- Each question should have detailed information
- Difficulty level: ${difficulty}
- Language: ${language}
- Include sample answers and study tips

Format your response as a valid JSON array with this exact structure:
[
  {
    "id": 1,
    "question": "Question text here?",
    "difficulty": "${difficulty}",
    "importance": "high/medium/low",
    "question_type": "multiple choice/short answer/essay",
    "sample_answer": "A comprehensive sample answer to the question",
    "hint": "A helpful hint to guide students",
    "why_important": "Why this question is important to know for the exam",
    "key_concepts": ["concept1", "concept2", "concept3"],
    "related_topics": ["related topic 1", "related topic 2"],
    "expected_answer_length": "2-3 paragraphs"
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text before or after.`;
  }

  /**
   * Parse the generated text from Gemini into structured questions
   */
  private parseGeneratedQuestions(
    generatedText: string,
    options: PredictedQuestionsGenerationOptions
  ): PredictedQuestion[] {
    try {
      // Remove markdown code blocks if present
      let jsonText = generatedText.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const parsedQuestions = JSON.parse(jsonText);
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Generated response is not an array');
      }

      return parsedQuestions.map((q, index) => ({
        id: q.id ?? `predicted_${Date.now()}_${index}`,
        question: q.question || '',
        difficulty: q.difficulty || options.difficulty || 'medium',
        importance: q.importance || 'medium',
        question_type: q.question_type || 'multiple choice',
        depth_level: q.depth_level,
        expected_answer_length: q.expected_answer_length,
        key_concepts: q.key_concepts || [],
        hint: q.hint,
        sample_answer: q.sample_answer,
        why_important: q.why_important,
        related_topics: q.related_topics || [],
        tags: q.tags || [],
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
export const geminiPredictedQuestionsService = new GeminiPredictedQuestionsService();
export default GeminiPredictedQuestionsService;
