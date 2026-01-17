import axios, { AxiosError } from 'axios';

// Gemini API Configuration
const GEMINI_API_KEY = typeof process !== 'undefined' && process.env ? (process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '') : '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 120000; // 120 seconds
const MAX_TOKENS = 2048;

// Debug: Log if key is available
if (GEMINI_API_KEY) {
  console.log('✅ [GeminiSolutionService] Gemini API Key loaded successfully');
} else {
  console.warn('⚠️ [GeminiSolutionService] Gemini API Key NOT found in environment');
}

export interface SolutionResponse {
  success: boolean;
  solution: string;
  explanation?: string;
  steps?: string[];
  source: 'text' | 'image';
  error?: string;
  retries?: number;
  processingTime?: number;
}

class GeminiSolutionService {
  private apiKey: string;
  private requestCount = 0;
  private errorLog: Array<{ timestamp: number; error: string; context: string }> = [];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
  }

  /**
   * Get health status of the service
   */
  getStatus() {
    return {
      apiKeyConfigured: !!this.apiKey,
      requestCount: this.requestCount,
      recentErrors: this.errorLog.slice(-5),
    };
  }

  /**
   * Log error for debugging
   */
  private logError(error: string, context: string) {
    this.errorLog.push({
      timestamp: Date.now(),
      error,
      context,
    });
    // Keep only last 50 errors
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === maxRetries - 1) {
          throw error;
        }

        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[GeminiSolutionService] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`,
          error instanceof Error ? error.message : error
        );
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // Retry on server errors and timeout
      return status === 408 || status === 429 || (status && status >= 500);
    }
    return false;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Solve a question using text input
   */
  async solveByText(questionText: string, retries: number = 0): Promise<SolutionResponse> {
    const startTime = Date.now();

    try {
      if (!this.apiKey) {
        const error = 'Gemini API key is not configured';
        this.logError(error, 'solveByText-setup');
        throw new Error(error);
      }

      if (!questionText || questionText.trim().length === 0) {
        const error = 'Question text cannot be empty';
        this.logError(error, 'solveByText-validation');
        throw new Error(error);
      }

      // Sanitize and validate input
      const sanitizedQuestion = this.sanitizeInput(questionText.trim());
      if (sanitizedQuestion.length < 3) {
        const error = 'Question is too short (minimum 3 characters)';
        this.logError(error, 'solveByText-length');
        throw new Error(error);
      }

      if (sanitizedQuestion.length > 5000) {
        const error = 'Question is too long (maximum 5000 characters)';
        this.logError(error, 'solveByText-max-length');
        throw new Error(error);
      }

      this.requestCount++;
      const prompt = this.buildTextPrompt(sanitizedQuestion);

      const response = await this.retryWithBackoff(async () => {
        return await axios.post(
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
              maxOutputTokens: MAX_TOKENS,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
          }
        );
      });

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        const error = 'No response from Gemini API';
        this.logError(error, 'solveByText-empty-response');
        throw new Error(error);
      }

      const parsed = this.parseSolution(generatedText);
      const processingTime = Date.now() - startTime;

      console.log(`[GeminiSolutionService] ✅ Text question solved successfully in ${processingTime}ms`);

      return {
        success: true,
        solution: parsed.solution,
        explanation: parsed.explanation,
        steps: parsed.steps,
        source: 'text',
        retries,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to solve question';

      console.error(
        `[GeminiSolutionService] ❌ Text question solving failed after ${processingTime}ms:`,
        errorMessage
      );

      this.logError(errorMessage, 'solveByText-error');

      return {
        success: false,
        solution: '',
        source: 'text',
        error: errorMessage,
        retries,
        processingTime,
      };
    }
  }

  /**
   * Solve a question using image input (with vision capability)
   */
  async solveByImage(imageBase64: string, mimeType: string = 'image/jpeg', retries: number = 0): Promise<SolutionResponse> {
    const startTime = Date.now();

    try {
      if (!this.apiKey) {
        const error = 'Gemini API key is not configured';
        this.logError(error, 'solveByImage-setup');
        throw new Error(error);
      }

      if (!imageBase64 || imageBase64.trim().length === 0) {
        const error = 'Image data cannot be empty';
        this.logError(error, 'solveByImage-validation');
        throw new Error(error);
      }

      // Validate image size (max 20MB in base64)
      if (imageBase64.length > 20 * 1024 * 1024) {
        const error = 'Image is too large (maximum 20MB)';
        this.logError(error, 'solveByImage-size');
        throw new Error(error);
      }

      // Validate MIME type
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(mimeType)) {
        const error = `Invalid MIME type: ${mimeType}. Must be one of: ${validMimeTypes.join(', ')}`;
        this.logError(error, 'solveByImage-mime');
        throw new Error(error);
      }

      this.requestCount++;
      const prompt = this.buildImagePrompt();

      const response = await this.retryWithBackoff(async () => {
        return await axios.post(
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
              maxOutputTokens: MAX_TOKENS,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
          }
        );
      });

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        const error = 'No response from Gemini API';
        this.logError(error, 'solveByImage-empty-response');
        throw new Error(error);
      }

      const parsed = this.parseSolution(generatedText);
      const processingTime = Date.now() - startTime;

      console.log(`[GeminiSolutionService] ✅ Image question solved successfully in ${processingTime}ms`);

      return {
        success: true,
        solution: parsed.solution,
        explanation: parsed.explanation,
        steps: parsed.steps,
        source: 'image',
        retries,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to solve image question';

      console.error(
        `[GeminiSolutionService] ❌ Image question solving failed after ${processingTime}ms:`,
        errorMessage
      );

      this.logError(errorMessage, 'solveByImage-error');

      return {
        success: false,
        solution: '',
        source: 'image',
        error: errorMessage,
        retries,
        processingTime,
      };
    }
  }

  /**
   * Sanitize user input
   */
  private sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 5000); // Max 5000 chars
  }

  /**
   * Build prompt for text question - optimized for clarity
   */
  private buildTextPrompt(questionText: string): string {
    return `You are an expert tutor and problem solver. A student has asked the following question:

"${questionText}"

Please provide a comprehensive response with:
1. A clear, step-by-step solution
2. An explanation of the key concepts
3. The final answer
4. Helpful tips or tricks (if applicable)

IMPORTANT: Format your response EXACTLY as follows:
SOLUTION:
[Detailed solution with numbered steps if applicable]

EXPLANATION:
[Conceptual explanation of why this approach works]

ANSWER:
[The final answer or result]

TIPS:
[Helpful tips, common mistakes to avoid, or alternative approaches]

Be clear, concise, and educational in your explanations.`;
  }

  /**
   * Build prompt for image question - optimized for clarity
   */
  private buildImagePrompt(): string {
    return `You are an expert tutor and problem solver. The student has provided a question/problem as an image.

Please analyze the image and provide:
1. A clear, step-by-step solution
2. An explanation of the key concepts
3. The final answer
4. Helpful tips or tricks (if applicable)

IMPORTANT: Format your response EXACTLY as follows:
SOLUTION:
[Detailed solution with numbered steps if applicable]

EXPLANATION:
[Conceptual explanation of why this approach works]

ANSWER:
[The final answer or result]

TIPS:
[Helpful tips, common mistakes to avoid, or alternative approaches]

Be clear, concise, and educational in your explanations.`;
  }

  /**
   * Parse the solution response with robust error handling
   */
  private parseSolution(generatedText: string): {
    solution: string;
    explanation?: string;
    steps?: string[];
  } {
    try {
      if (!generatedText || generatedText.trim().length === 0) {
        console.warn('[GeminiSolutionService] Generated text is empty');
        return { solution: 'Unable to generate solution' };
      }

      // Extract sections using case-insensitive regex
      const solutionMatch = generatedText.match(/SOLUTION:\s*([\s\S]*?)(?=EXPLANATION:|$)/i);
      const explanationMatch = generatedText.match(/EXPLANATION:\s*([\s\S]*?)(?=ANSWER:|$)/i);
      const answerMatch = generatedText.match(/ANSWER:\s*([\s\S]*?)(?=TIPS:|$)/i);
      const tipsMatch = generatedText.match(/TIPS:\s*([\s\S]*?)$/i);

      // Extract and clean text
      const solution = this.cleanText((solutionMatch?.[1] || generatedText).trim());
      const explanation = this.cleanText((explanationMatch?.[1] || '').trim());
      const answer = this.cleanText((answerMatch?.[1] || '').trim());
      const tips = this.cleanText((tipsMatch?.[1] || '').trim());

      // Build comprehensive solution
      const parts = [
        solution,
        answer ? `\n\n📌 **Final Answer:**\n${answer}` : '',
        explanation ? `\n\n💡 **Explanation:**\n${explanation}` : '',
        tips ? `\n\n💡 **Tips & Tricks:**\n${tips}` : ''
      ];

      const fullSolution = parts.filter(Boolean).join('');

      // Extract steps if available
      const steps = this.extractSteps(solution);

      console.log('[GeminiSolutionService] Solution parsed successfully with', steps.length, 'steps');

      return {
        solution: fullSolution || generatedText,
        explanation: explanation || undefined,
        steps: steps.length > 0 ? steps : undefined,
      };
    } catch (error) {
      console.error('[GeminiSolutionService] Failed to parse solution:', error);
      return {
        solution: generatedText || 'Solution generated but parsing failed',
      };
    }
  }

  /**
   * Extract numbered or bulleted steps from text
   */
  private extractSteps(text: string): string[] {
    if (!text || text.length === 0) return [];

    const steps: string[] = [];

    // Match numbered steps (1., 2., etc.)
    const numberedRegex = /^\s*(\d+)\.\s+(.+)$/gm;
    let match;

    while ((match = numberedRegex.exec(text)) !== null) {
      steps.push(match[2].trim());
    }

    // If no numbered steps, try bullet points
    if (steps.length === 0) {
      const bulletRegex = /^\s*[-•*]\s+(.+)$/gm;
      while ((match = bulletRegex.exec(text)) !== null) {
        steps.push(match[1].trim());
      }
    }

    return steps;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .replace(/\s+/g, ' ') // Normalize spaces within lines
      .replace(/^[\s*•-]+/, '') // Remove leading bullets
      .trim();
  }

  /**
   * Extract text from image using Gemini Vision - PRODUCTION READY
   * Used for OCR before search API calls
   * 
   * @param imageBase64 - Base64 encoded image data
   * @param mimeType - MIME type of the image (default: image/jpeg)
   * @returns Extracted text from the image
   */
  async extractTextFromImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{ success: boolean; text: string; error?: string }> {
    const startTime = Date.now();

    try {
      if (!this.apiKey) {
        const error = 'Gemini API key is not configured';
        this.logError(error, 'extractTextFromImage-setup');
        throw new Error(error);
      }

      if (!imageBase64 || imageBase64.trim().length === 0) {
        const error = 'Image data cannot be empty';
        this.logError(error, 'extractTextFromImage-validation');
        throw new Error(error);
      }

      // Validate image size (max 20MB in base64)
      if (imageBase64.length > 20 * 1024 * 1024) {
        const error = 'Image is too large (maximum 20MB)';
        this.logError(error, 'extractTextFromImage-size');
        throw new Error(error);
      }

      // Validate MIME type
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(mimeType)) {
        const error = `Invalid MIME type: ${mimeType}. Must be one of: ${validMimeTypes.join(', ')}`;
        this.logError(error, 'extractTextFromImage-mime');
        throw new Error(error);
      }

      this.requestCount++;

      // Prompt for text extraction (OCR)
      const prompt = `Extract all text visible in this image. Return ONLY the text content, nothing else. If there are multiple text elements, combine them logically. If there is no text, return "NO_TEXT_FOUND".`;

      console.log('[GeminiSolutionService] 📸 Extracting text from image using Gemini Vision...');

      const response = await this.retryWithBackoff(async () => {
        return await axios.post(
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
              temperature: 0.2, // Lower temperature for more accurate text extraction
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 2048,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
          }
        );
      });

      const extractedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!extractedText) {
        const error = 'No text extracted from image';
        this.logError(error, 'extractTextFromImage-empty-response');
        return {
          success: false,
          text: '',
          error
        };
      }

      // Clean up the extracted text
      const cleanedText = extractedText.trim();

      // Check if no text was found
      if (cleanedText === 'NO_TEXT_FOUND' || cleanedText.length === 0) {
        console.log('[GeminiSolutionService] ⚠️ No text found in image');
        return {
          success: false,
          text: '',
          error: 'No text found in image'
        };
      }

      const processingTime = Date.now() - startTime;
      console.log(`[GeminiSolutionService] ✅ Text extracted successfully in ${processingTime}ms`);
      console.log('[GeminiSolutionService] Extracted text:', cleanedText.substring(0, 100), '...');

      return {
        success: true,
        text: cleanedText
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to extract text from image';

      console.error(
        `[GeminiSolutionService] ❌ Text extraction failed after ${processingTime}ms:`,
        errorMessage
      );

      this.logError(errorMessage, 'extractTextFromImage-error');

      return {
        success: false,
        text: '',
        error: errorMessage
      };
    }
  }
}

// Export singleton instance
export const geminiSolutionService = new GeminiSolutionService();
export default GeminiSolutionService;
