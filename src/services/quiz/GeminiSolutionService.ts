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

export interface SolutionResponse {
  success: boolean;
  solution: string;
  explanation?: string;
  steps?: string[];
  source: 'text' | 'image';
  error?: string;
}

class GeminiSolutionService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
  }

  /**
   * Solve a question using text input
   */
  async solveByText(questionText: string): Promise<SolutionResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      if (!questionText || questionText.trim().length === 0) {
        throw new Error('Question text cannot be empty');
      }

      const prompt = this.buildTextPrompt(questionText);
      
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

      const parsed = this.parseSolution(generatedText);

      return {
        success: true,
        solution: parsed.solution,
        explanation: parsed.explanation,
        steps: parsed.steps,
        source: 'text',
      };
    } catch (error: any) {
      console.error('❌ Gemini Solution Generation Error (Text):', error);
      
      return {
        success: false,
        solution: '',
        source: 'text',
        error: error.response?.data?.error?.message || error.message || 'Failed to solve question',
      };
    }
  }

  /**
   * Solve a question using image input (with vision capability)
   */
  async solveByImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<SolutionResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      if (!imageBase64 || imageBase64.trim().length === 0) {
        throw new Error('Image data cannot be empty');
      }

      const prompt = this.buildImagePrompt();
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64
                }
              }
            ]
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

      const parsed = this.parseSolution(generatedText);

      return {
        success: true,
        solution: parsed.solution,
        explanation: parsed.explanation,
        steps: parsed.steps,
        source: 'image',
      };
    } catch (error: any) {
      console.error('❌ Gemini Solution Generation Error (Image):', error);
      
      return {
        success: false,
        solution: '',
        source: 'image',
        error: error.response?.data?.error?.message || error.message || 'Failed to solve image question',
      };
    }
  }

  /**
   * Build prompt for text question
   */
  private buildTextPrompt(questionText: string): string {
    return `You are an expert tutor and problem solver. A student has asked the following question:

"${questionText}"

Please provide:
1. A clear, step-by-step solution
2. An explanation of the key concepts
3. The final answer
4. Any helpful tips or tricks

Format your response as:
SOLUTION:
[Detailed solution with steps]

EXPLANATION:
[Conceptual explanation]

ANSWER:
[Final answer/result]

TIPS:
[Helpful tips if applicable]`;
  }

  /**
   * Build prompt for image question
   */
  private buildImagePrompt(): string {
    return `You are an expert tutor and problem solver. The student has provided a question/problem as an image.

Please analyze the image and provide:
1. A clear, step-by-step solution
2. An explanation of the key concepts
3. The final answer
4. Any helpful tips or tricks

Format your response as:
SOLUTION:
[Detailed solution with steps]

EXPLANATION:
[Conceptual explanation]

ANSWER:
[Final answer/result]

TIPS:
[Helpful tips if applicable]`;
  }

  /**
   * Parse the solution response
   */
  private parseSolution(generatedText: string): {
    solution: string;
    explanation?: string;
    steps?: string[];
  } {
    try {
      const solutionMatch = generatedText.match(/SOLUTION:\s*([\s\S]*?)(?=EXPLANATION:|$)/i);
      const explanationMatch = generatedText.match(/EXPLANATION:\s*([\s\S]*?)(?=ANSWER:|$)/i);
      const answerMatch = generatedText.match(/ANSWER:\s*([\s\S]*?)(?=TIPS:|$)/i);
      const tipsMatch = generatedText.match(/TIPS:\s*([\s\S]*?)$/i);

      const solution = (solutionMatch?.[1] || generatedText).trim();
      const explanation = (explanationMatch?.[1] || '').trim();
      const answer = (answerMatch?.[1] || '').trim();
      const tips = (tipsMatch?.[1] || '').trim();

      // Combine all parts for comprehensive solution
      const fullSolution = [
        solution,
        answer ? `\n\nFinal Answer: ${answer}` : '',
        explanation ? `\n\nExplanation: ${explanation}` : '',
        tips ? `\n\nTips: ${tips}` : ''
      ].filter(Boolean).join('');

      // Extract steps if available (numbered or bulleted)
      const stepsRegex = /^\s*(\d+\.|[-*•])\s+(.+)$/gm;
      const steps: string[] = [];
      let match;
      while ((match = stepsRegex.exec(solution)) !== null) {
        steps.push(match[2]);
      }

      return {
        solution: fullSolution || generatedText,
        explanation,
        steps: steps.length > 0 ? steps : undefined,
      };
    } catch (error) {
      console.error('❌ Failed to parse solution:', error);
      return {
        solution: generatedText,
      };
    }
  }
}

// Export singleton instance
export const geminiSolutionService = new GeminiSolutionService();
export default GeminiSolutionService;
