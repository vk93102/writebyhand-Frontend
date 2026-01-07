import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { generateQuizFromYouTube, submitQuiz } from '../services/quiz';

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'essay' | 'matching';
  question: string;
  options?: Array<{ text: string; is_correct: boolean }>;
  hint?: string;
}

interface QuizData {
  quiz_id: string;
  title: string;
  summary: string;
  total_questions: number;
  difficulty: string;
  estimated_time: number;
  keywords: string[];
  questions: QuizQuestion[];
}

interface QuizResultsData {
  score: number;
  correct_answers: number;
  total_questions: number;
  analysis: {
    overall_feedback: string;
    strengths: string[];
    areas_for_improvement: string[];
    study_recommendations: string[];
    next_steps: string[];
    motivational_message: string;
  };
  results: Array<{
    question_id: string;
    question: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }>;
}

interface QuizManagerProps {
  videoUrl?: string;
  onClose?: () => void;
}

export const QuizManager: React.FC<QuizManagerProps> = ({ videoUrl, onClose }) => {
  // State management
  const [stage, setStage] = useState<'config' | 'loading' | 'quiz' | 'results'>('config');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [results, setResults] = useState<QuizResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quiz configuration
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'intermediate'
  );

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Load quiz from YouTube
  const handleLoadQuiz = useCallback(async () => {
    if (!videoUrl) {
      setError('No video URL provided');
      return;
    }

    setStage('loading');
    setError(null);

    const result = await generateQuizFromYouTube(videoUrl, numQuestions, difficulty);

    if (result.success && result.quiz) {
      setQuizData(result.quiz as QuizData);
      setTimeStarted(Date.now());
      setStage('quiz');
    } else {
      setError(result.error || 'Failed to generate quiz');
      setStage('config');
    }
  }, [videoUrl, numQuestions, difficulty]);

  // Handle answer selection
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  // Submit quiz
  const handleSubmitQuiz = useCallback(async () => {
    if (!quizData) return;

    const unanswered = quizData.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert('Incomplete', `Please answer all ${unanswered.length} remaining question(s)`);
      return;
    }

    setStage('loading');
    const result = await submitQuiz(quizData.quiz_id, answers);

    if (result.success && result.data) {
      setResults(result.data as QuizResultsData);
      setStage('results');
    } else {
      setError(result.error || 'Failed to submit quiz');
      setStage('quiz');
    }
  }, [quizData, answers]);

  // Config screen
  if (stage === 'config') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.configContainer}>
          <MaterialIcons name="quiz" size={64} color={colors.primary} />
          <Text style={styles.configTitle}>Quiz Configuration</Text>

          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.configSection}>
            <Text style={styles.configLabel}>Number of Questions: {numQuestions}</Text>
            <View style={styles.buttonGroup}>
              {[5, 10, 15].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.buttonSmall,
                    numQuestions === num && styles.buttonSmallActive,
                  ]}
                  onPress={() => setNumQuestions(num)}
                >
                  <Text
                    style={[
                      styles.buttonSmallText,
                      numQuestions === num && styles.buttonSmallTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.configSection}>
            <Text style={styles.configLabel}>Difficulty Level</Text>
            <View style={styles.difficultyGroup}>
              {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      difficulty === level && styles.difficultyButtonTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleLoadQuiz}>
            <MaterialIcons name="play-arrow" size={24} color={colors.white} />
            <Text style={styles.startButtonText}>Start Quiz</Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // Loading screen
  if (stage === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {results ? 'Evaluating your answers...' : 'Generating quiz from video...'}
        </Text>
      </View>
    );
  }

  // Quiz screen
  if (stage === 'quiz' && quizData) {
    const question = quizData.questions[currentQuestion];
    const answered = Object.keys(answers).length;
    const total = quizData.total_questions;

    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.quizHeader}>
          <Text style={styles.quizTitle}>{quizData.title}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{quizData.difficulty.toUpperCase()}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{quizData.estimated_time} min</Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {total}
            </Text>
            <Text style={styles.answeredText}>
              {answered}/{total} answered
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestion + 1) / total) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionText}>{question.question}</Text>

          {question.hint && (
            <View style={styles.hintBox}>
              <MaterialIcons name="lightbulb" size={20} color={colors.warning} />
              <Text style={styles.hintText}>{question.hint}</Text>
            </View>
          )}

          {/* Answer options */}
          {question.type === 'mcq' && question.options && (
            <View style={styles.optionsContainer}>
              {question.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    answers[question.id] === option.text && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleAnswerChange(question.id, option.text)}
                >
                  <View style={styles.radioButton}>
                    {answers[question.id] === option.text && (
                      <View style={styles.radioButtonFilled} />
                    )}
                  </View>
                  <Text style={styles.optionText}>{option.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {question.type === 'true_false' && (
            <View style={styles.trueFalseContainer}>
              <TouchableOpacity
                style={[
                  styles.tfButton,
                  answers[question.id] === 'true' && styles.tfButtonTrue,
                ]}
                onPress={() => handleAnswerChange(question.id, 'true')}
              >
                <MaterialIcons
                  name={answers[question.id] === 'true' ? 'check-circle' : 'circle-outline'}
                  size={24}
                  color={answers[question.id] === 'true' ? colors.success : colors.textMuted}
                />
                <Text style={styles.tfButtonText}>True</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tfButton,
                  answers[question.id] === 'false' && styles.tfButtonFalse,
                ]}
                onPress={() => handleAnswerChange(question.id, 'false')}
              >
                <MaterialIcons
                  name={answers[question.id] === 'false' ? 'cancel' : 'circle-outline'}
                  size={24}
                  color={answers[question.id] === 'false' ? colors.error : colors.textMuted}
                />
                <Text style={styles.tfButtonText}>False</Text>
              </TouchableOpacity>
            </View>
          )}

          {question.type === 'short_answer' && (
            <View style={styles.shortAnswerContainer}>
              <Text style={styles.shortAnswerHint}>
                Type your answer (10-50 words)
              </Text>
              <Text style={styles.shortAnswerValue}>{answers[question.id] || ''}</Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {currentQuestion === total - 1 ? (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitQuiz}>
              <MaterialIcons name="check" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>Submit Quiz</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrentQuestion(currentQuestion + 1)}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // Results screen
  if (stage === 'results' && results) {
    const percentage = Math.round(results.score);
    const passed = percentage >= 70;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultsContainer}>
          {/* Score card */}
          <View style={styles.scoreCard}>
            <MaterialIcons
              name={passed ? 'emoji-events' : 'info'}
              size={80}
              color={passed ? colors.success : colors.warning}
            />
            <Text style={styles.scoreTitle}>Quiz Completed!</Text>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{percentage}%</Text>
            <Text style={styles.scoreSubtext}>
              {results.correct_answers} out of {results.total_questions} correct
            </Text>
          </View>

          {/* Feedback */}
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Feedback</Text>
            <Text style={styles.feedbackText}>{results.analysis.overall_feedback}</Text>

            {results.analysis.strengths.length > 0 && (
              <View style={styles.feedbackItem}>
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackItemTitle}>Your Strengths</Text>
                  {results.analysis.strengths.map((strength, i) => (
                    <Text key={i} style={styles.feedbackItemText}>
                      • {strength}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {results.analysis.areas_for_improvement.length > 0 && (
              <View style={styles.feedbackItem}>
                <MaterialIcons name="lightbulb" size={20} color={colors.warning} />
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackItemTitle}>Areas to Improve</Text>
                  {results.analysis.areas_for_improvement.map((area, i) => (
                    <Text key={i} style={styles.feedbackItemText}>
                      • {area}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {results.analysis.study_recommendations.length > 0 && (
              <View style={styles.feedbackItem}>
                <MaterialIcons name="school" size={20} color={colors.primary} />
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackItemTitle}>Recommendations</Text>
                  {results.analysis.study_recommendations.slice(0, 3).map((rec, i) => (
                    <Text key={i} style={styles.feedbackItemText}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={() => setStage('config')}>
              <MaterialIcons name="refresh" size={20} color={colors.white} />
              <Text style={styles.retryButtonText}>Retry Quiz</Text>
            </TouchableOpacity>

            {onClose && (
              <TouchableOpacity style={styles.closeButtonSmall} onPress={onClose}>
                <MaterialIcons name="close" size={20} color={colors.primary} />
                <Text style={styles.closeButtonSmallText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  configContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  configTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    flex: 1,
  },
  configSection: {
    marginBottom: spacing.xl,
  },
  configLabel: {
    ...typography.h4,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  buttonSmall: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    flex: 1,
    alignItems: 'center',
  },
  buttonSmallActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonSmallText: {
    ...typography.h4,
    color: colors.text,
  },
  buttonSmallTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  difficultyGroup: {
    gap: spacing.md,
  },
  difficultyButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyButtonText: {
    ...typography.h4,
    color: colors.text,
  },
  difficultyButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    ...shadows.md,
  },
  startButtonText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  closeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.body,
    color: colors.textMuted,
  },
  quizHeader: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quizTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.blue50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  progressSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.body,
    color: colors.textMuted,
  },
  answeredText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  questionSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  questionText: {
    ...typography.h3,
    marginBottom: spacing.lg,
    lineHeight: 28,
  },
  hintBox: {
    backgroundColor: colors.warning25,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  hintText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tfButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tfButtonTrue: {
    borderColor: colors.success,
    backgroundColor: '#e8f5e9',
  },
  tfButtonFalse: {
    borderColor: colors.error,
    backgroundColor: '#ffebee',
  },
  tfButtonText: {
    ...typography.h4,
    fontWeight: '700',
  },
  shortAnswerContainer: {
    gap: spacing.md,
  },
  shortAnswerHint: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  shortAnswerValue: {
    ...typography.body,
    color: colors.text,
    minHeight: 60,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  navButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  navButtonText: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success,
    ...shadows.sm,
  },
  submitButtonText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  resultsContainer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  scoreCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  scoreTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  scoreLabel: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  scoreValue: {
    ...typography.h1,
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: spacing.sm,
  },
  scoreSubtext: {
    ...typography.body,
    color: colors.textMuted,
  },
  feedbackSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  feedbackTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  feedbackText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  feedbackItem: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackItemTitle: {
    ...typography.h4,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  feedbackItemText: {
    ...typography.small,
    color: colors.text,
    marginTop: spacing.xs,
  },
  actionButtons: {
    gap: spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  retryButtonText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  closeButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  closeButtonSmallText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default QuizManager;
