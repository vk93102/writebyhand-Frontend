/**
 * API service for Pair Quiz REST endpoints
 */
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export interface CreatePairQuizRequest {
  userId: string;
  quizConfig: {
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    numQuestions: number;
    topic?: string;
  };
}

export interface JoinPairQuizRequest {
  userId: string;
  sessionCode: string;
}

export interface PairQuizSessionResponse {
  sessionId: string;
  sessionCode: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  hostUserId: string;
  partnerUserId?: string;
  quizConfig: any;
  questions?: any[];
  currentQuestionIndex?: number;
  hostAnswers?: Record<number, string>;
  partnerAnswers?: Record<number, string>;
  hostScore?: number;
  partnerScore?: number;
  expiresAt?: string;
  startedAt?: string;
  completedAt?: string;
}

class PairQuizApiService {
  private baseUrl = `${API_BASE_URL}/pair-quiz`;

  /**
   * Create a new pair quiz session
   */
  async createSession(request: CreatePairQuizRequest): Promise<PairQuizSessionResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/create/`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('[PairQuizAPI] Create session error:', error);
      throw new Error(error.response?.data?.error || 'Failed to create pair quiz session');
    }
  }

  /**
   * Join an existing pair quiz session
   */
  async joinSession(request: JoinPairQuizRequest): Promise<PairQuizSessionResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/join/`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('[PairQuizAPI] Join session error:', error);
      
      // Provide user-friendly error messages
      const errorMessage = error.response?.data?.error;
      if (errorMessage?.includes('Invalid session code')) {
        throw new Error('Invalid session code. Please check and try again.');
      } else if (errorMessage?.includes('expired')) {
        throw new Error('This session has expired.');
      } else if (errorMessage?.includes('full')) {
        throw new Error('This session is already full.');
      } else {
        throw new Error(errorMessage || 'Failed to join pair quiz session');
      }
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<PairQuizSessionResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/${sessionId}/`);
      return response.data;
    } catch (error: any) {
      console.error('[PairQuizAPI] Get session error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch session details');
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, userId: string, reason: string = 'User cancelled'): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/${sessionId}/cancel/`, {
        userId,
        reason,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      console.error('[PairQuizAPI] Cancel session error:', error);
      throw new Error(error.response?.data?.error || 'Failed to cancel session');
    }
  }
}

export const pairQuizApi = new PairQuizApiService();
