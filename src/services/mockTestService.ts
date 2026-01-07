/**
 * Mock Test Service
 * Loads questions from local JSON files and provides random selection
 */

// Import Mock Test JSON files
import physicsData from '../../assets/Mock Tests/physics.json';
import chemistryData from '../../assets/Mock Tests/Chemistry.json';
import mathsData from '../../assets/Mock Tests/maths.json';
import biologyData from '../../assets/Mock Tests/Biology.json';
import dailyQuizData from '../../assets/Mock Tests/DailyQuiz.json';
import hindiDailyQuizData from '../../assets/Mock Tests/Hindi_Daily.json';
import { API_BASE_URL } from '../config/api';

export interface MockTestQuestion {
  id: number;
  question: string;
  options: string[] | { [key: string]: string };
  correctAnswer?: number | string;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  marks?: number;
  year?: number;
  shift?: string;
  date?: string;
  session?: string;
  correct_answer?: string;
  solution?: string;
  correctAnswerIndex?: number;
}

export interface QuizConfig {
  subject: string;
  topics: string[];
  difficulty: string;
  examLevel: string;
  timeLimit: number;
  numQuestions: number;
}

/**
 * Get questions data by subject
 */
const getQuestionsBySubject = (subject: string): MockTestQuestion[] => {
  const normalizedSubject = subject.toLowerCase();
  
  switch (normalizedSubject) {
    case 'physics':
      return physicsData as MockTestQuestion[];
    case 'chemistry':
      return chemistryData as MockTestQuestion[];
    case 'mathematics':
    case 'maths':
      return mathsData as MockTestQuestion[];
    case 'biology':
      return biologyData as MockTestQuestion[];
    default:
      return [];
  }
};

/**
 * Normalize question format for consistent rendering
 */
const normalizeQuestion = (q: MockTestQuestion): any => {
  // Handle options - convert object format to array if needed
  let optionsArray: string[] = [];
  
  if (Array.isArray(q.options)) {
    optionsArray = q.options;
  } else if (typeof q.options === 'object') {
    // Convert {A: "...", B: "...", C: "...", D: "..."} to ["...", "...", "...", "..."]
    const keys = Object.keys(q.options).sort();
    optionsArray = keys.map(key => {
      const optionsObj = q.options as { [key: string]: string };
      return optionsObj[key];
    });
  }

  // Determine correct answer index
  let correctAnswerIndex = 0;
  if (typeof q.correctAnswer === 'number') {
    correctAnswerIndex = q.correctAnswer;
  } else if (typeof q.correctAnswerIndex === 'number') {
    correctAnswerIndex = q.correctAnswerIndex;
  } else if (typeof q.correctAnswer === 'string') {
    // If correctAnswer is "A", "B", "C", "D", convert to index
    const answerMap: { [key: string]: number } = { A: 0, B: 1, C: 2, D: 3 };
    correctAnswerIndex = answerMap[q.correctAnswer] ?? 0;
  } else if (typeof q.correct_answer === 'string') {
    const answerMap: { [key: string]: number } = { A: 0, B: 1, C: 2, D: 3 };
    correctAnswerIndex = answerMap[q.correct_answer] ?? 0;
  }

  return {
    id: q.id,
    question: q.question,
    options: optionsArray,
    correctAnswer: correctAnswerIndex,
    explanation: q.explanation || q.solution || 'No explanation available',
    difficulty: q.difficulty || 'medium',
    type: 'conceptual',
  };
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Filter questions by difficulty if specified
 */
const filterByDifficulty = (
  questions: MockTestQuestion[], 
  difficulty: string
): MockTestQuestion[] => {
  if (difficulty === 'all' || !difficulty) {
    return questions;
  }
  
  const normalizedDifficulty = difficulty.toLowerCase();
  return questions.filter(q => {
    const qDifficulty = (q.difficulty || '').toLowerCase();
    return qDifficulty === normalizedDifficulty || 
           qDifficulty.includes(normalizedDifficulty);
  });
};

/**
 * Filter questions by topics if specified
 */
const filterByTopics = (
  questions: MockTestQuestion[], 
  topics: string[]
): MockTestQuestion[] => {
  if (!topics || topics.length === 0) {
    return questions;
  }
  
  return questions.filter(q => {
    const qTopic = (q.topic || '').toLowerCase();
    return topics.some(topic => 
      qTopic.includes(topic.toLowerCase()) ||
      topic.toLowerCase().includes(qTopic)
    );
  });
};

/**
 * Generate mock test from local JSON files
 */
export const generateMockTest = (config: QuizConfig): any => {
  try {
    // Get all questions for the subject
    let questions = getQuestionsBySubject(config.subject);
    
    if (questions.length === 0) {
      throw new Error(`No questions available for ${config.subject}`);
    }

    // Filter by topics if specified
    if (config.topics && config.topics.length > 0) {
      questions = filterByTopics(questions, config.topics);
    }

    // Filter by difficulty if specified
    if (config.difficulty && config.difficulty !== 'all') {
      const filtered = filterByDifficulty(questions, config.difficulty);
      // If filtering results in no questions, use all questions
      if (filtered.length > 0) {
        questions = filtered;
      }
    }

    // Shuffle questions for randomization
    questions = shuffleArray(questions);

    // Select the requested number of questions
    const numQuestions = Math.min(config.numQuestions, questions.length);
    const selectedQuestions = questions.slice(0, numQuestions);

    // Normalize questions to consistent format
    const normalizedQuestions = selectedQuestions.map(normalizeQuestion);

    // Return in the expected format for Quiz component
    return {
      title: `${config.subject} Mock Test`,
      topic: config.topics.join(', ') || config.subject,
      difficulty: config.difficulty,
      examLevel: config.examLevel,
      questions: normalizedQuestions,
      timeLimit: config.timeLimit || Math.round(numQuestions * 1.5), // 1.5 minutes per question
    };
  } catch (error: any) {
    throw new Error(`Failed to generate mock test: ${error.message}`);
  }
};

/**
 * Get random questions from Daily Quiz JSON
 */
export const getDailyQuizQuestions = (numQuestions: number = 20, language: 'english' | 'hindi' = 'english'): any => {
  try {
    const allQuestions = (language === 'hindi' ? hindiDailyQuizData : dailyQuizData) as MockTestQuestion[];
    
    if (allQuestions.length === 0) {
      throw new Error('No daily quiz questions available');
    }

    // Shuffle and select random questions
    const shuffled = shuffleArray(allQuestions);
    const selected = shuffled.slice(0, Math.min(numQuestions, allQuestions.length));

    // Normalize questions
    const normalizedQuestions = selected.map(normalizeQuestion);

    return {
      title: language === 'hindi' ? 'दैनिक प्रश्नोत्तरी' : 'Daily Quiz',
      topic: language === 'hindi' ? 'सामान्य ज्ञान' : 'General Knowledge',
      difficulty: 'mixed',
      questions: normalizedQuestions,
      timeLimit: numQuestions * 1, // 1 minute per question for daily quiz
    };
  } catch (error: any) {
    throw new Error(`Failed to get daily quiz questions: ${error.message}`);
  }
};

/**
 * Fetch quiz settings from backend (rewards, coin amounts, etc.)
 */
export const getQuizSettings = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/settings/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch quiz settings');
    }
    
    return data.settings;
  } catch (error: any) {
    console.error('Error fetching quiz settings:', error);
    // Return default values as fallback
    return {
      daily_quiz: {
        attempt_bonus: 5,
        coins_per_correct: 5,
        perfect_score_bonus: 10,
      },
      pair_quiz: {
        enabled: true,
        session_timeout: 30,
        max_questions: 20,
      },
      coin_system: {
        coin_to_currency_rate: 0.10,
        min_coins_for_redemption: 100,
      }
    };
  }
};

export default {
  generateMockTest,
  getDailyQuizQuestions,
  getQuizSettings,
};
