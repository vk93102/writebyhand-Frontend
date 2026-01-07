/**
 * Socket.IO client for real-time pair quiz synchronization
 */
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../config/api';

// Socket.IO connection URL
const SOCKET_URL = API_BASE_URL.replace('/api', ''); // Remove /api suffix

export interface PairQuizState {
  sessionId: string;
  sessionCode: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  hostUserId: string;
  partnerUserId?: string;
  quizConfig: any;
  questions: any[];
  currentQuestionIndex: number;
  hostAnswers: Record<number, string>;
  partnerAnswers: Record<number, string>;
  timerSeconds: number;
  hostScore?: number;
  partnerScore?: number;
  hostTimeTaken?: number;
  partnerTimeTaken?: number;
}

export interface StateUpdateEvent {
  type: 'ANSWER_SELECTED' | 'NEXT_QUESTION' | 'QUIZ_COMPLETE' | 'TIMER_UPDATE' | 'SESSION_CANCELLED' | 'PARTNER_JOINED';
  userId?: string;
  questionIndex?: number;
  selectedOption?: string;
  score?: number;
  bothCompleted?: boolean;
  timerSeconds?: number;
  reason?: string;
  session?: PairQuizState;
}

class PairQuizSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to Socket.IO server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('[PairQuizSocket] Connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[PairQuizSocket] Connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to server'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('[PairQuizSocket] Disconnected:', reason);
        this.emit('connection_lost', { reason });
      });

      this.socket.on('error', (error) => {
        console.error('[PairQuizSocket] Socket error:', error);
        this.emit('socket_error', error);
      });

      // Handle server events
      this.socket.on('connected', (data) => {
        console.log('[PairQuizSocket] Server acknowledged connection:', data);
      });

      this.socket.on('session_joined', (data) => {
        this.emit('session_joined', data);
      });

      this.socket.on('partner_joined', (data) => {
        this.emit('partner_joined', data);
      });

      this.socket.on('partner_disconnected', (data) => {
        this.emit('partner_disconnected', data);
      });

      this.socket.on('state_update', (data: StateUpdateEvent) => {
        this.emit('state_update', data);
      });
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('[PairQuizSocket] Disconnected');
    }
  }

  /**
   * Join a pair quiz session
   */
  joinSession(sessionId: string, userId: string) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('join_session', { sessionId, userId });
  }

  /**
   * Submit an answer
   */
  selectAnswer(sessionId: string, userId: string, questionIndex: number, selectedOption: string) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('answer_selected', {
      sessionId,
      userId,
      questionIndex,
      selectedOption,
    });
  }

  /**
   * Navigate to next question
   */
  nextQuestion(sessionId: string, questionIndex: number) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('next_question', {
      sessionId,
      questionIndex,
    });
  }

  /**
   * Complete quiz
   */
  completeQuiz(sessionId: string, userId: string, score: number, timeTaken: number) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('quiz_complete', {
      sessionId,
      userId,
      score,
      timeTaken,
    });
  }

  /**
   * Update timer
   */
  updateTimer(sessionId: string, timerSeconds: number) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('update_timer', {
      sessionId,
      timerSeconds,
    });
  }

  /**
   * Cancel session
   */
  cancelSession(sessionId: string, reason: string = 'User cancelled') {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('cancel_session', {
      sessionId,
      reason,
    });
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const pairQuizSocket = new PairQuizSocketService();
