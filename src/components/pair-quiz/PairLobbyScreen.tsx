/**
 * Pair Quiz Lobby Screen
 * Allows users to create or join pair quiz sessions
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePairQuiz } from '../../services/pair-quiz/pairQuizContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface PairLobbyScreenProps {
  onQuizStart: () => void;
  onBack: () => void;
}

export const PairLobbyScreen: React.FC<PairLobbyScreenProps> = ({ onQuizStart, onBack }) => {
  const { session, isConnected, createSession, joinSession, error: contextError } = usePairQuiz();
  
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [loading, setLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  
  // Quiz configuration for creating session
  const [quizConfig, setQuizConfig] = useState({
    subject: 'General Knowledge',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    numQuestions: 10,
  });

  useEffect(() => {
    // Generate unique user ID per session/tab
    const generateUserId = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const tabId = Math.random().toString(36).substr(2, 5);
      return `user_${timestamp}_${random}_${tabId}`;
    };
    
    AsyncStorage.getItem('userId').then(id => {
      if (id) {
        // Add tab-specific suffix to prevent same-user issue
        const uniqueId = `${id}_tab_${Math.random().toString(36).substr(2, 5)}`;
        setUserId(uniqueId);
      } else {
        const newId = generateUserId();
        AsyncStorage.setItem('userId', newId);
        setUserId(newId);
      }
    });
  }, []);

  useEffect(() => {
    console.log('[PairLobby] Session update:', {
      status: session?.status,
      partnerUserId: session?.partnerUserId,
      questionsCount: session?.questions?.length,
      sessionCode: session?.sessionCode
    });
    
    if (session?.status === 'active' && session.partnerUserId && session.questions && session.questions.length > 0) {
      // Both users joined and questions are loaded, start quiz immediately
      console.log('[PairLobby] Starting quiz with questions:', session.questions.length);
      onQuizStart();
    }
  }, [session?.status, session?.partnerUserId, session?.questions]);

  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);

  const handleCreateSession = async () => {
    if (!userId) {
      setError('User ID not initialized');
      return;
    }

    if (loading) {
      // Prevent duplicate requests
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createSession(userId, quizConfig);
      setMode('create');
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!userId) {
      setError('User ID not initialized');
      return;
    }

    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    if (loading) {
      // Prevent duplicate requests
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinSession(userId, sessionCode.toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const copySessionCode = () => {
    if (session?.sessionCode && Platform.OS === 'web') {
      navigator.clipboard.writeText(session.sessionCode);
      Alert.alert('Copied!', 'Session code copied to clipboard');
    }
  };

  const renderModeSelection = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Pair Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroSection}>
          <MaterialIcons name="people" size={80} color={colors.success} />
          <Text style={styles.heroTitle}>Quiz Together</Text>
          <Text style={styles.heroSubtitle}>
            Challenge a friend in real-time! Answer questions together and see who scores higher.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, styles.createCard]}
            onPress={() => setMode('create')}
          >
            <MaterialIcons name="add-circle" size={48} color="#fff" />
            <Text style={styles.optionTitle}>Create Session</Text>
            <Text style={styles.optionSubtitle}>Start a new pair quiz and invite a friend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.joinCard]}
            onPress={() => setMode('join')}
          >
            <MaterialIcons name="login" size={48} color="#fff" />
            <Text style={styles.optionTitle}>Join Session</Text>
            <Text style={styles.optionSubtitle}>Enter a code to join an existing quiz</Text>
          </TouchableOpacity>
        </View>

        {!isConnected && (
          <View style={styles.warningBanner}>
            <MaterialIcons name="warning" size={20} color={colors.warning} />
            <Text style={styles.warningText}>Connecting to server...</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCreateSession = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Pair Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {!session ? (
          <>
            <Text style={styles.sectionTitle}>Quiz Configuration</Text>
            
            <View style={styles.configSection}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                value={quizConfig.subject}
                onChangeText={(text) => setQuizConfig(prev => ({ ...prev, subject: text }))}
                placeholder="e.g., Mathematics, Science"
              />
            </View>

            <View style={styles.configSection}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.difficultyButtons}>
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.difficultyButton,
                      quizConfig.difficulty === diff && styles.difficultyButtonActive
                    ]}
                    onPress={() => setQuizConfig(prev => ({ ...prev, difficulty: diff }))}
                  >
                    <Text style={[
                      styles.difficultyText,
                      quizConfig.difficulty === diff && styles.difficultyTextActive
                    ]}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.configSection}>
              <Text style={styles.label}>Number of Questions</Text>
              <View style={styles.questionButtons}>
                {[5, 10, 15, 20].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.questionButton,
                      quizConfig.numQuestions === num && styles.questionButtonActive
                    ]}
                    onPress={() => setQuizConfig(prev => ({ ...prev, numQuestions: num }))}
                  >
                    <Text style={[
                      styles.questionText,
                      quizConfig.numQuestions === num && styles.questionTextActive
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error" size={20} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleCreateSession}
              disabled={loading || !isConnected}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.primaryButtonText}>Create Session</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.waitingContainer}>
            <MaterialIcons name="hourglass-empty" size={64} color={colors.success} />
            <Text style={styles.waitingTitle}>Session Created!</Text>
            
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Share this code with your partner:</Text>
              <TouchableOpacity onPress={copySessionCode} style={styles.codeBox}>
                <Text style={styles.codeText}>{session.sessionCode}</Text>
                <MaterialIcons name="content-copy" size={24} color={colors.success} />
              </TouchableOpacity>
            </View>

            <View style={styles.statusIndicator}>
              <ActivityIndicator size="small" color={colors.success} />
              <Text style={styles.statusText}>Waiting for partner to join...</Text>
            </View>
            
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Status: {session.status}</Text>
              <Text style={styles.debugText}>Questions: {session.questions?.length || 0}</Text>
              <Text style={styles.debugText}>Connected: {isConnected ? 'Yes' : 'No'}</Text>
              <Text style={styles.debugText}>Host: {session.hostUserId?.substring(0, 20)}...</Text>
              <Text style={styles.debugText}>Partner: {session.partnerUserId ? session.partnerUserId.substring(0, 20) + '...' : 'Waiting'}</Text>
              <Text style={styles.debugText}>Your ID: {userId?.substring(0, 20)}...</Text>
            </View>

            <Text style={styles.expiryText}>
              Session expires in 30 minutes
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderJoinSession = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Join Pair Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.joinContainer}>
          <MaterialIcons name="vpn-key" size={64} color={colors.primary} />
          <Text style={styles.joinTitle}>Enter Session Code</Text>
          <Text style={styles.joinSubtitle}>
            Ask your partner for the session code to join their quiz
          </Text>

          <TextInput
            style={styles.codeInput}
            value={sessionCode}
            onChangeText={(text) => setSessionCode(text.toUpperCase())}
            placeholder="QZ-XXXX"
            autoCapitalize="characters"
            maxLength={7}
          />

          {error && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error" size={20} color="#f44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, (loading || !sessionCode.trim() || !isConnected) && styles.buttonDisabled]}
            onPress={handleJoinSession}
            disabled={loading || !sessionCode.trim() || !isConnected}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="login" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Join Session</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (mode === 'create') {
    return renderCreateSession();
  } else if (mode === 'join') {
    return renderJoinSession();
  } else {
    return renderModeSelection();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 400,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  createCard: {
    backgroundColor: colors.success,
  },
  joinCard: {
    backgroundColor: colors.primary,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  warningText: {
    color: colors.warning,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  configSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  difficultyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  difficultyTextActive: {
    color: colors.success,
  },
  questionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  questionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  questionButtonActive: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  questionText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  questionTextActive: {
    color: colors.success,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  codeContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.success,
    gap: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success,
    letterSpacing: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  statusText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  debugInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  expiryText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 16,
  },
  joinContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  joinSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 400,
    marginBottom: 32,
  },
  codeInput: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
  },
});
