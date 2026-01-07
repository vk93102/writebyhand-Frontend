/**
 * Pair Quiz Screen - Real-time synchronized quiz interface
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePairQuiz } from '../../services/pair-quiz/pairQuizContext';

interface PairQuizScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const PairQuizScreen: React.FC<PairQuizScreenProps> = ({ onComplete, onCancel }) => {
  const {
    session,
    isHost,
    partnerId,
    currentUserId,
    selectAnswer,
    nextQuestion,
    completeQuiz,
    cancelSession,
  } = usePairQuiz();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const currentQuestion = session?.questions[session.currentQuestionIndex];
  const myAnswers = isHost ? session?.hostAnswers : session?.partnerAnswers;
  const partnerAnswers = isHost ? session?.partnerAnswers : session?.hostAnswers;
  const myAnswer = myAnswers?.[session?.currentQuestionIndex || 0];
  const partnerAnswer = partnerAnswers?.[session?.currentQuestionIndex || 0];

  useEffect(() => {
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Update selected option when answer changes
    if (myAnswer) {
      setSelectedOption(myAnswer);
    } else {
      setSelectedOption(null);
    }
  }, [myAnswer, session?.currentQuestionIndex]);

  useEffect(() => {
    // Check if quiz is complete
    if (session?.currentQuestionIndex === session?.questions.length) {
      handleQuizComplete();
    }
  }, [session?.currentQuestionIndex, session?.questions.length]);

  const handleSelectOption = (option: string) => {
    if (!session) return;
    
    setSelectedOption(option);
    selectAnswer(session.currentQuestionIndex, option);
  };

  const handleNext = () => {
    if (!session) return;

    if (!myAnswer) {
      Alert.alert('No Answer', 'Please select an answer before continuing');
      return;
    }

    if (session.currentQuestionIndex < session.questions.length - 1) {
      nextQuestion();
    } else {
      // Last question
      handleQuizComplete();
    }
  };

  const handleQuizComplete = () => {
    if (!session || !myAnswers) return;

    // Calculate score
    let correct = 0;
    session.questions.forEach((q, index) => {
      const userAnswer = myAnswers[index];
      if (userAnswer === q.correct_answer) {
        correct++;
      }
    });

    const scorePercentage = (correct / session.questions.length) * 100;
    completeQuiz(scorePercentage, timeElapsed);
    
    // Navigate to results after a short delay
    setTimeout(() => onComplete(), 1000);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Quiz',
      'Are you sure you want to cancel this pair quiz? Your partner will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelSession('User cancelled quiz');
            onCancel();
          },
        },
      ]
    );
  };

  if (!session || !currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.sessionCode}>{session.sessionCode}</Text>
        </View>
        
        <View style={styles.timerContainer}>
          <MaterialIcons name="timer" size={20} color="#666" />
          <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {session.currentQuestionIndex + 1} of {session.questions.length}
        </Text>
      </View>

      {/* Partner Status */}
      <View style={styles.partnerStatus}>
        <View style={styles.statusRow}>
          <View style={styles.userBadge}>
            <MaterialIcons name="person" size={16} color="#4CAF50" />
            <Text style={styles.userBadgeText}>You</Text>
          </View>
          {myAnswer && (
            <View style={styles.answeredBadge}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.answeredText}>Answered</Text>
            </View>
          )}
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.userBadge, styles.partnerBadge]}>
            <MaterialIcons name="people" size={16} color="#2196F3" />
            <Text style={[styles.userBadgeText, styles.partnerBadgeText]}>Partner</Text>
          </View>
          {partnerAnswer ? (
            <View style={[styles.answeredBadge, styles.partnerAnsweredBadge]}>
              <MaterialIcons name="check-circle" size={16} color="#2196F3" />
              <Text style={[styles.answeredText, styles.partnerAnsweredText]}>Answered</Text>
            </View>
          ) : (
            <View style={styles.waitingBadge}>
              <ActivityIndicator size="small" color="#999" />
              <Text style={styles.waitingText}>Waiting...</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option: any, index: number) => {
            const optionKey = option.text || option;
            const isSelected = selectedOption === optionKey;
            const isPartnerSelected = partnerAnswer === optionKey;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                  isPartnerSelected && !isSelected && styles.optionButtonPartner,
                ]}
                onPress={() => handleSelectOption(optionKey)}
                disabled={!!myAnswer}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionRadio,
                    isSelected && styles.optionRadioSelected,
                  ]}>
                    {isSelected && <View style={styles.optionRadioInner} />}
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}>
                    {optionKey}
                  </Text>
                </View>
                
                {isPartnerSelected && !isSelected && (
                  <View style={styles.partnerIndicator}>
                    <MaterialIcons name="people" size={16} color="#2196F3" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Partner Activity Indicator */}
        {partnerAnswer && partnerAnswer !== myAnswer && (
          <View style={styles.activityIndicator}>
            <MaterialIcons name="info" size={20} color="#2196F3" />
            <Text style={styles.activityText}>
              Your partner selected a different answer
            </Text>
          </View>
        )}

        {partnerAnswer === myAnswer && myAnswer && (
          <View style={[styles.activityIndicator, styles.activityIndicatorSuccess]}>
            <MaterialIcons name="thumb-up" size={20} color="#4CAF50" />
            <Text style={[styles.activityText, styles.activityTextSuccess]}>
              You both selected the same answer!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !myAnswer && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!myAnswer}
        >
          <Text style={styles.nextButtonText}>
            {session.currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Text>
          <MaterialIcons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    padding: 4,
  },
  sessionCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  partnerStatus: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  partnerBadge: {
    backgroundColor: '#E3F2FD',
  },
  partnerBadgeText: {
    color: '#2196F3',
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  answeredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  partnerAnsweredBadge: {},
  partnerAnsweredText: {
    color: '#2196F3',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waitingText: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
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
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionButtonPartner: {
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#4CAF50',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  partnerIndicator: {
    marginLeft: 8,
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  activityIndicatorSuccess: {
    backgroundColor: '#E8F5E9',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#2196F3',
  },
  activityTextSuccess: {
    color: '#4CAF50',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
