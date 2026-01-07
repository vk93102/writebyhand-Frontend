import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface MockTestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  marks: number;
  subject?: string;
}

export interface MockTest {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration: number; // in minutes
  totalMarks: number;
  questions: MockTestQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface MockTestResult {
  testId: string;
  userId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number; // in seconds
  answers: Record<string, number>;
  completedAt: string;
}

const STORAGE_KEY_PREFIX = 'mock_test_';
const RESULTS_STORAGE_KEY = 'mock_test_results';

class MockTestLoader {
  /**
   * Load mock test from JSON file
   */
  async loadFromFile(filePath: string): Promise<MockTest | null> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const mockTest = JSON.parse(fileContent);
      
      // Validate structure
      if (!this.validateMockTest(mockTest)) {
        throw new Error('Invalid mock test format');
      }

      // Save to local storage for offline access
      await this.saveMockTest(mockTest);

      return mockTest;
    } catch (error) {
      console.error('❌ Failed to load mock test from file:', error);
      return null;
    }
  }

  /**
   * Load mock test from downloaded JSON assets
   */
  async loadFromAsset(assetPath: string): Promise<MockTest | null> {
    try {
      // For assets bundled with the app
      const mockTest = require(`../../../assets/Mock Tests/${assetPath}`);
      
      if (!this.validateMockTest(mockTest)) {
        throw new Error('Invalid mock test format');
      }

      return mockTest;
    } catch (error) {
      console.error('❌ Failed to load mock test from asset:', error);
      return null;
    }
  }

  /**
   * Save mock test to local storage
   */
  async saveMockTest(mockTest: MockTest): Promise<void> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${mockTest.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(mockTest));
    } catch (error) {
      console.error('❌ Failed to save mock test:', error);
    }
  }

  /**
   * Get all saved mock tests
   */
  async getAllMockTests(): Promise<MockTest[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const mockTestKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      
      const mockTests: MockTest[] = [];
      
      for (const key of mockTestKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          mockTests.push(JSON.parse(data));
        }
      }

      return mockTests.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('❌ Failed to get all mock tests:', error);
      return [];
    }
  }

  /**
   * Get mock test by ID
   */
  async getMockTestById(testId: string): Promise<MockTest | null> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${testId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to get mock test:', error);
      return null;
    }
  }

  /**
   * Delete mock test
   */
  async deleteMockTest(testId: string): Promise<boolean> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${testId}`;
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete mock test:', error);
      return false;
    }
  }

  /**
   * Save test result
   */
  async saveResult(result: MockTestResult): Promise<void> {
    try {
      const existingResults = await this.getResults();
      existingResults.push(result);
      
      await AsyncStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(existingResults));
    } catch (error) {
      console.error('❌ Failed to save test result:', error);
    }
  }

  /**
   * Get all test results
   */
  async getResults(): Promise<MockTestResult[]> {
    try {
      const data = await AsyncStorage.getItem(RESULTS_STORAGE_KEY);
      
      if (!data) {
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to get test results:', error);
      return [];
    }
  }

  /**
   * Get results for a specific test
   */
  async getResultsByTestId(testId: string): Promise<MockTestResult[]> {
    try {
      const allResults = await this.getResults();
      return allResults.filter(result => result.testId === testId);
    } catch (error) {
      console.error('❌ Failed to get results by test ID:', error);
      return [];
    }
  }

  /**
   * Validate mock test structure
   */
  private validateMockTest(mockTest: any): boolean {
    if (!mockTest || typeof mockTest !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'title', 'questions'];
    for (const field of requiredFields) {
      if (!(field in mockTest)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    if (!Array.isArray(mockTest.questions) || mockTest.questions.length === 0) {
      console.error('Questions must be a non-empty array');
      return false;
    }

    // Validate each question
    for (const question of mockTest.questions) {
      if (!question.question || !Array.isArray(question.options) || question.options.length < 2) {
        console.error('Invalid question structure');
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate test score
   */
  calculateScore(
    mockTest: MockTest,
    userAnswers: Record<string, number>
  ): {
    score: number;
    totalMarks: number;
    percentage: number;
    correct: number;
    incorrect: number;
    unanswered: number;
  } {
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    mockTest.questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      
      if (userAnswer === undefined) {
        unanswered++;
      } else if (userAnswer === question.correctAnswer) {
        correct++;
        score += question.marks;
      } else {
        incorrect++;
      }
    });

    const percentage = mockTest.totalMarks > 0 
      ? (score / mockTest.totalMarks) * 100 
      : 0;

    return {
      score,
      totalMarks: mockTest.totalMarks,
      percentage: Math.round(percentage * 100) / 100,
      correct,
      incorrect,
      unanswered,
    };
  }

  /**
   * Load predefined mock tests (Biology, Chemistry, Physics, Maths)
   */
  async loadPredefinedTests(): Promise<MockTest[]> {
    const testFiles = ['Biology.json', 'Chemistry.json', 'maths.json', 'physics.json'];
    const tests: MockTest[] = [];

    for (const file of testFiles) {
      const test = await this.loadFromAsset(file);
      if (test) {
        tests.push(test);
      }
    }

    return tests;
  }
}

// Export singleton instance
export const mockTestLoader = new MockTestLoader();
export default MockTestLoader;
