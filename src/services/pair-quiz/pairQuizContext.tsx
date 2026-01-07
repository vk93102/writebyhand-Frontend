/**
 * Pair Quiz State Management using React Context
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { pairQuizSocket, PairQuizState, StateUpdateEvent } from './pairQuizSocket';
import { pairQuizApi } from './pairQuizApi';

interface PairQuizContextType {
  // State
  session: PairQuizState | null;
  isConnected: boolean;
  isHost: boolean;
  partnerId: string | null;
  currentUserId: string | null;
  error: string | null;
  
  // Actions
  createSession: (userId: string, quizConfig: any) => Promise<void>;
  joinSession: (userId: string, sessionCode: string) => Promise<void>;
  selectAnswer: (questionIndex: number, selectedOption: string) => void;
  nextQuestion: () => void;
  completeQuiz: (score: number, timeTaken: number) => void;
  cancelSession: (reason?: string) => void;
  resetState: () => void;
}

const PairQuizContext = createContext<PairQuizContextType | undefined>(undefined);

export const usePairQuiz = () => {
  const context = useContext(PairQuizContext);
  if (!context) {
    throw new Error('usePairQuiz must be used within PairQuizProvider');
  }
  return context;
};

interface PairQuizProviderProps {
  children: ReactNode;
}

export const PairQuizProvider: React.FC<PairQuizProviderProps> = ({ children }) => {
  const [session, setSession] = useState<PairQuizState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isHost = session?.hostUserId === currentUserId;
  const partnerId = isHost ? session?.partnerUserId || null : session?.hostUserId || null;

  /**
   * Initialize socket connection
   */
  useEffect(() => {
    const initSocket = async () => {
      try {
        await pairQuizSocket.connect();
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to connect to socket:', err);
        setError('Failed to connect to server');
        setIsConnected(false);
      }
    };

    initSocket();

    return () => {
      pairQuizSocket.disconnect();
      setIsConnected(false);
    };
  }, []);

  /**
   * Set up socket event listeners
   */
  useEffect(() => {
    const handleSessionJoined = (data: any) => {
      console.log('[PairQuiz] Session joined:', data);
      setSession(data.session);
    };

    const handlePartnerJoined = (data: any) => {
      console.log('[PairQuiz] Partner joined event received:', {
        hasSession: !!data.session,
        sessionStatus: data.session?.status,
        questionsCount: data.session?.questions?.length,
        partnerUserId: data.session?.partnerUserId
      });
      
      // Update session with partner data if provided
      if (data.session) {
        console.log('[PairQuiz] Updating session from partner_joined event');
        setSession(data.session);
      } else if (session?.sessionId) {
        // Fallback: refresh session data from API
        console.log('[PairQuiz] No session in event, fetching from API');
        pairQuizApi.getSession(session.sessionId).then(updatedSession => {
          console.log('[PairQuiz] Fetched session:', {
            status: updatedSession.status,
            questionsCount: updatedSession.questions?.length
          });
          setSession(updatedSession);
        }).catch(console.error);
      }
    };

    const handlePartnerDisconnected = (data: any) => {
      console.warn('[PairQuiz] Partner disconnected:', data);
      setError('Your partner has disconnected');
    };

    const handleStateUpdate = (data: StateUpdateEvent) => {
      console.log('[PairQuiz] State update:', data);
      
      setSession(prev => {
        if (!prev) return null;

        const updated = { ...prev };

        switch (data.type) {
          case 'PARTNER_JOINED':
            // Update entire session when partner joins
            if (data.session) {
              console.log('[PairQuiz] Partner joined - updating session state');
              return data.session;
            }
            break;

          case 'ANSWER_SELECTED':
            if (data.userId && data.questionIndex !== undefined && data.selectedOption) {
              const isHostAnswer = data.userId === updated.hostUserId;
              const answersKey = isHostAnswer ? 'hostAnswers' : 'partnerAnswers';
              updated[answersKey] = {
                ...updated[answersKey],
                [data.questionIndex]: data.selectedOption,
              };
            }
            break;

          case 'NEXT_QUESTION':
            if (data.questionIndex !== undefined) {
              updated.currentQuestionIndex = data.questionIndex;
            }
            break;

          case 'QUIZ_COMPLETE':
            if (data.userId && data.score !== undefined) {
              const isHost = data.userId === updated.hostUserId;
              if (isHost) {
                updated.hostScore = data.score;
              } else {
                updated.partnerScore = data.score;
              }

              if (data.bothCompleted && data.session) {
                updated.status = 'completed';
                updated.hostScore = data.session.hostScore;
                updated.partnerScore = data.session.partnerScore;
              }
            }
            break;

          case 'TIMER_UPDATE':
            if (data.timerSeconds !== undefined) {
              updated.timerSeconds = data.timerSeconds;
            }
            break;

          case 'SESSION_CANCELLED':
            updated.status = 'cancelled';
            setError(data.reason || 'Session was cancelled');
            break;
        }

        return updated;
      });
    };

    const handleConnectionLost = () => {
      setIsConnected(false);
      setError('Connection lost. Attempting to reconnect...');
    };

    const handleSocketError = (err: any) => {
      console.error('[PairQuiz] Socket error:', err);
      setError('Communication error occurred');
    };

    // Subscribe to events
    pairQuizSocket.on('session_joined', handleSessionJoined);
    pairQuizSocket.on('partner_joined', handlePartnerJoined);
    pairQuizSocket.on('partner_disconnected', handlePartnerDisconnected);
    pairQuizSocket.on('state_update', handleStateUpdate);
    pairQuizSocket.on('connection_lost', handleConnectionLost);
    pairQuizSocket.on('socket_error', handleSocketError);

    return () => {
      pairQuizSocket.off('session_joined', handleSessionJoined);
      pairQuizSocket.off('partner_joined', handlePartnerJoined);
      pairQuizSocket.off('partner_disconnected', handlePartnerDisconnected);
      pairQuizSocket.off('state_update', handleStateUpdate);
      pairQuizSocket.off('connection_lost', handleConnectionLost);
      pairQuizSocket.off('socket_error', handleSocketError);
    };
  }, [session?.sessionId]);

  /**
   * Create a new pair quiz session
   */
  const createSession = useCallback(async (userId: string, quizConfig: any) => {
    try {
      setError(null);
      setCurrentUserId(userId);
      
      const sessionData = await pairQuizApi.createSession({ userId, quizConfig });
      console.log('[PairQuiz] Created session with questions:', sessionData.questions?.length);
      setSession(sessionData as PairQuizState);
      
      // Join socket room
      pairQuizSocket.joinSession(sessionData.sessionId, userId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Join an existing session
   */
  const joinSession = useCallback(async (userId: string, sessionCode: string) => {
    try {
      setError(null);
      setCurrentUserId(userId);
      
      const sessionData = await pairQuizApi.joinSession({ userId, sessionCode });
      console.log('[PairQuiz] Joined session with questions:', sessionData.questions?.length);
      console.log('[PairQuiz] Session status:', sessionData.status);
      setSession(sessionData as PairQuizState);
      
      // Join socket room - this will trigger partner_joined event for host
      pairQuizSocket.joinSession(sessionData.sessionId, userId);
      
      // Small delay to ensure Socket.IO event is processed
      setTimeout(() => {
        console.log('[PairQuiz] Verifying session after join');
      }, 500);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Select an answer
   */
  const selectAnswer = useCallback((questionIndex: number, selectedOption: string) => {
    if (!session || !currentUserId) return;
    
    pairQuizSocket.selectAnswer(session.sessionId, currentUserId, questionIndex, selectedOption);
    
    // Optimistic update
    setSession(prev => {
      if (!prev) return null;
      const isHostAnswer = currentUserId === prev.hostUserId;
      const answersKey = isHostAnswer ? 'hostAnswers' : 'partnerAnswers';
      return {
        ...prev,
        [answersKey]: {
          ...prev[answersKey],
          [questionIndex]: selectedOption,
        },
      };
    });
  }, [session, currentUserId]);

  /**
   * Navigate to next question
   */
  const nextQuestion = useCallback(() => {
    if (!session) return;
    
    const nextIndex = session.currentQuestionIndex + 1;
    pairQuizSocket.nextQuestion(session.sessionId, nextIndex);
    
    // Optimistic update
    setSession(prev => prev ? { ...prev, currentQuestionIndex: nextIndex } : null);
  }, [session]);

  /**
   * Complete quiz
   */
  const completeQuiz = useCallback((score: number, timeTaken: number) => {
    if (!session || !currentUserId) return;
    
    pairQuizSocket.completeQuiz(session.sessionId, currentUserId, score, timeTaken);
  }, [session, currentUserId]);

  /**
   * Cancel session
   */
  const cancelSession = useCallback((reason: string = 'User cancelled') => {
    if (!session || !currentUserId) return;
    
    pairQuizSocket.cancelSession(session.sessionId, reason);
    pairQuizApi.cancelSession(session.sessionId, currentUserId, reason).catch(console.error);
  }, [session, currentUserId]);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    setSession(null);
    setCurrentUserId(null);
    setError(null);
  }, []);

  const value: PairQuizContextType = {
    session,
    isConnected,
    isHost,
    partnerId,
    currentUserId,
    error,
    createSession,
    joinSession,
    selectAnswer,
    nextQuestion,
    completeQuiz,
    cancelSession,
    resetState,
  };

  return <PairQuizContext.Provider value={value}>{children}</PairQuizContext.Provider>;
};
