import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import AnimatedLoader from './AnimatedLoader';
import LoadingWebm from './LoadingWebm';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'conceptual' | 'numerical' | 'practical';
}

interface QuizData {
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
}

interface QuizProps {
  quizData: QuizData | null;
  loading: boolean;
}

interface UserAnswer {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

export const Quiz: React.FC<QuizProps> = ({ quizData, loading }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, number>>(new Map());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  const { width, height } = Dimensions.get('window');
  const isSmallDevice = width < 360 || height < 700;

  // Initialize timer when quiz data is loaded
  useEffect(() => {
    if (quizData && !timerStarted) {
      const timeLimit = quizData.timeLimit || 30; // Default 30 minutes
      setTimeRemaining(timeLimit * 60); // Convert to seconds
      setTimerStarted(true);
    }
  }, [quizData]);

  // Timer countdown
  useEffect(() => {
    if (timerStarted && timeRemaining > 0 && !quizCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerStarted, timeRemaining, quizCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingWebm visible={true} />
      </View>
    );
  }

  // Responsive wrappers to avoid overlap on small screens
  const questionContainerStyle = [styles.questionContainer, isSmallDevice && styles.questionContainerSmall];
  const optionsContainerStyle = [styles.optionsContainer, isSmallDevice && styles.optionsContainerSmall];

  if (!quizData) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="quiz" size={64} color={colors.textMuted} />
        <Text style={styles.emptyText}>Select quiz options and start test</Text>
      </View>
    );
  }

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={styles.emptyText}>No questions available</Text>
      </View>
    );
  }

  const question = quizData.questions[currentQuestion];
  const selectedAnswer = userAnswers.get(currentQuestion);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion, optionIndex);
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizCompleted(true);
  };

  const calculateResults = () => {
    let correct = 0;
    let easyCorrect = 0, easyTotal = 0;
    let mediumCorrect = 0, mediumTotal = 0;
    let hardCorrect = 0, hardTotal = 0;
    let conceptualCorrect = 0, conceptualTotal = 0;
    let numericalCorrect = 0, numericalTotal = 0;

    quizData.questions.forEach((q, index) => {
      const userAnswer = userAnswers.get(index);
      const isCorrect = userAnswer === q.correctAnswer;
      
      if (isCorrect) correct++;

      // Track by difficulty
      const difficulty = q.difficulty || 'medium';
      if (difficulty === 'easy') {
        easyTotal++;
        if (isCorrect) easyCorrect++;
      } else if (difficulty === 'medium') {
        mediumTotal++;
        if (isCorrect) mediumCorrect++;
      } else if (difficulty === 'hard') {
        hardTotal++;
        if (isCorrect) hardCorrect++;
      }

      // Track by type
      const type = q.type || 'conceptual';
      if (type === 'conceptual') {
        conceptualTotal++;
        if (isCorrect) conceptualCorrect++;
      } else if (type === 'numerical') {
        numericalTotal++;
        if (isCorrect) numericalCorrect++;
      }
    });

    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
      easyCorrect,
      easyTotal,
      easyPercentage: easyTotal > 0 ? Math.round((easyCorrect / easyTotal) * 100) : 0,
      mediumCorrect,
      mediumTotal,
      mediumPercentage: mediumTotal > 0 ? Math.round((mediumCorrect / mediumTotal) * 100) : 0,
      hardCorrect,
      hardTotal,
      hardPercentage: hardTotal > 0 ? Math.round((hardCorrect / hardTotal) * 100) : 0,
      conceptualCorrect,
      conceptualTotal,
      conceptualPercentage: conceptualTotal > 0 ? Math.round((conceptualCorrect / conceptualTotal) * 100) : 0,
      numericalCorrect,
      numericalTotal,
      numericalPercentage: numericalTotal > 0 ? Math.round((numericalCorrect / numericalTotal) * 100) : 0,
    };
  };

  const getRecommendations = (results: ReturnType<typeof calculateResults>) => {
    const recommendations: string[] = [];

    if (results.percentage >= 90) {
      recommendations.push("Outstanding performance! You've mastered this topic.");
      recommendations.push("Consider taking advanced level quizzes to challenge yourself.");
    } else if (results.percentage >= 70) {
      recommendations.push("Great job! You have a solid understanding of the concepts.");
    } else if (results.percentage >= 50) {
      recommendations.push("Good effort! Review the concepts to strengthen your understanding.");
    } else {
      recommendations.push("Keep practicing! Focus on understanding the fundamentals.");
    }

    // Difficulty-specific recommendations
    if (results.easyTotal > 0 && results.easyPercentage < 70) {
      recommendations.push("Focus on mastering basic concepts - review easy-level questions.");
    }
    if (results.mediumTotal > 0 && results.mediumPercentage < 60) {
      recommendations.push("Practice medium-difficulty problems to build problem-solving skills.");
    }
    if (results.hardTotal > 0 && results.hardPercentage < 50) {
      recommendations.push("Challenge yourself with hard questions, but ensure basics are strong first.");
    }

    // Type-specific recommendations
    if (results.conceptualTotal > 0 && results.conceptualPercentage < 60) {
      recommendations.push("Strengthen conceptual understanding through detailed study of theory.");
    }
    if (results.numericalTotal > 0 && results.numericalPercentage < 60) {
      recommendations.push("Practice more numerical problems to improve calculation speed and accuracy.");
    }

    return recommendations;
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers(new Map());
    setQuizCompleted(false);
    const timeLimit = quizData.timeLimit || 30;
    setTimeRemaining(timeLimit * 60);
    setTimerStarted(true);
  };

  if (quizCompleted) {
    const results = calculateResults();
    const recommendations = getRecommendations(results);
    
    return (
      <ScrollView style={styles.container}>
        <View style={styles.completedContainer}>
          <MaterialIcons 
            name={results.percentage >= 70 ? "emoji-events" : "info"} 
            size={80} 
            color={results.percentage >= 70 ? colors.success : colors.warning} 
          />
          <Text style={styles.completedTitle}>Mock Test Completed!</Text>
          <Text style={styles.scoreText}>Your Score</Text>
          <Text style={styles.scoreValue}>{results.correct} / {results.total}</Text>
          <Text style={styles.percentageText}>{results.percentage}%</Text>
          
          {/* Performance Chart */}
          <View style={styles.performanceChart}>
            <Text style={styles.chartTitle}>Performance Overview</Text>
            <View style={styles.chartContainer}>
              <View style={styles.barChart}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, styles.correctBar, { height: `${(results.correct / results.total) * 100}%` }]} />
                  <Text style={styles.barLabel}>Correct</Text>
                  <Text style={styles.barValue}>{results.correct}</Text>
                </View>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, styles.incorrectBar, { height: `${((results.total - results.correct) / results.total) * 100}%` }]} />
                  <Text style={styles.barLabel}>Incorrect</Text>
                  <Text style={styles.barValue}>{results.total - results.correct}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Difficulty-wise Analysis */}
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Difficulty-wise Performance</Text>
            
            {results.easyTotal > 0 && (
              <View style={styles.difficultyRow}>
                <View style={styles.difficultyHeader}>
                  <MaterialIcons name="sentiment-satisfied" size={24} color={colors.success} />
                  <Text style={styles.difficultyLabel}>Easy Questions</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${results.easyPercentage}%`,
                          backgroundColor: results.easyPercentage >= 70 ? colors.success : colors.warning
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.difficultyProgressText}>
                    {results.easyCorrect}/{results.easyTotal} ({results.easyPercentage}%)
                  </Text>
                </View>
              </View>
            )}

            {results.mediumTotal > 0 && (
              <View style={styles.difficultyRow}>
                <View style={styles.difficultyHeader}>
                  <MaterialIcons name="adjust" size={24} color={colors.warning} />
                  <Text style={styles.difficultyLabel}>Medium Questions</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${results.mediumPercentage}%`,
                          backgroundColor: results.mediumPercentage >= 60 ? colors.success : colors.warning
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.difficultyProgressText}>
                    {results.mediumCorrect}/{results.mediumTotal} ({results.mediumPercentage}%)
                  </Text>
                </View>
              </View>
            )}

            {results.hardTotal > 0 && (
              <View style={styles.difficultyRow}>
                <View style={styles.difficultyHeader}>
                  <MaterialIcons name="warning" size={24} color={colors.error} />
                  <Text style={styles.difficultyLabel}>Hard Questions</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${results.hardPercentage}%`,
                          backgroundColor: results.hardPercentage >= 50 ? colors.success : colors.error
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.difficultyProgressText}>
                    {results.hardCorrect}/{results.hardTotal} ({results.hardPercentage}%)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Question Type Analysis */}
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Question Type Performance</Text>
            
            {results.conceptualTotal > 0 && (
              <View style={styles.difficultyRow}>
                <View style={styles.difficultyHeader}>
                  <MaterialIcons name="psychology" size={24} color={colors.primary} />
                  <Text style={styles.difficultyLabel}>Conceptual Questions</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${results.conceptualPercentage}%`,
                          backgroundColor: results.conceptualPercentage >= 60 ? colors.success : colors.warning
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.difficultyProgressText}>
                    {results.conceptualCorrect}/{results.conceptualTotal} ({results.conceptualPercentage}%)
                  </Text>
                </View>
              </View>
            )}

            {results.numericalTotal > 0 && (
              <View style={styles.difficultyRow}>
                <View style={styles.difficultyHeader}>
                  <MaterialIcons name="calculate" size={24} color={colors.primary} />
                  <Text style={styles.difficultyLabel}>Numerical Questions</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${results.numericalPercentage}%`,
                          backgroundColor: results.numericalPercentage >= 60 ? colors.success : colors.warning
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.difficultyProgressText}>
                    {results.numericalCorrect}/{results.numericalTotal} ({results.numericalPercentage}%)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Accuracy Trend */}
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <MaterialIcons name="trending-up" size={24} color={colors.primary} />
              <Text style={styles.trendTitle}>Accuracy Rate</Text>
            </View>
            <View style={styles.accuracyMeter}>
              <View style={styles.accuracyTrack}>
                <View 
                  style={[
                    styles.accuracyFill, 
                    { 
                      width: `${results.percentage}%`,
                      backgroundColor: results.percentage >= 70 ? colors.success : results.percentage >= 50 ? colors.warning : colors.error
                    }
                  ]} 
                />
              </View>
              <Text style={styles.accuracyText}>{results.percentage}% Accuracy</Text>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Performance Breakdown</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <MaterialIcons name="check-circle" size={32} color={colors.success} />
                <Text style={styles.breakdownLabel}>Correct Answers</Text>
                <Text style={styles.breakdownValue}>{results.correct}</Text>
                <Text style={styles.breakdownPercent}>{Math.round((results.correct / results.total) * 100)}%</Text>
              </View>
              <View style={styles.breakdownItem}>
                <MaterialIcons name="cancel" size={32} color={colors.error} />
                <Text style={styles.breakdownLabel}>Incorrect Answers</Text>
                <Text style={styles.breakdownValue}>{results.total - results.correct}</Text>
                <Text style={styles.breakdownPercent}>{Math.round(((results.total - results.correct) / results.total) * 100)}%</Text>
              </View>
              <View style={styles.breakdownItem}>
                <MaterialIcons name="assessment" size={32} color={colors.primary} />
                <Text style={styles.breakdownLabel}>Total Questions</Text>
                <Text style={styles.breakdownValue}>{results.total}</Text>
                <Text style={styles.breakdownPercent}>100%</Text>
              </View>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <MaterialIcons name="lightbulb" size={24} color={colors.warning} />
              <Text style={styles.recommendationsTitle}>Recommendations</Text>
            </View>
            {recommendations.map((recommendation, index) => (
              <View style={styles.recommendationItem}>
                <MaterialIcons name="arrow-right" size={20} color={colors.primary} />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
            <MaterialIcons name="refresh" size={20} color={colors.white} />
            <Text style={styles.retryButtonText}>Retry Mock Test</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.quizHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.quizTitle}>{quizData.title}</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{quizData.difficulty.toUpperCase()}</Text>
            </View>
          </View>
          <View style={[
            styles.timerDisplay,
            timeRemaining <= 60 && styles.timerWarning
          ]}>
            <MaterialIcons 
              name="timer" 
              size={24} 
              color={timeRemaining <= 60 ? colors.error : colors.primary} 
            />
            <Text style={[
              styles.timerText,
              timeRemaining <= 60 && styles.timerTextWarning
            ]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {quizData.questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <View style={questionContainerStyle}>
        <Text style={styles.questionText}>{question.question}</Text>
        {question.difficulty && (
          <View style={styles.questionMetadata}>
            <View style={[
              styles.metadataBadge,
              question.difficulty === 'easy' && styles.metadataBadgeEasy,
              question.difficulty === 'medium' && styles.metadataBadgeMedium,
              question.difficulty === 'hard' && styles.metadataBadgeHard,
            ]}>
              <Text style={styles.metadataText}>{question.difficulty}</Text>
            </View>
            {question.type && (
              <View style={styles.metadataBadge}>
                <Text style={styles.metadataText}>{question.type}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={optionsContainerStyle}>
        {question.options.map((option, index) => {
          const isSelected = userAnswers.get(currentQuestion) === index;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionSelected,
                isSmallDevice && styles.optionButtonSmall,
              ]}
              onPress={() => handleAnswerSelect(index)}
            >
              <View style={[styles.optionContent, isSmallDevice && styles.optionContentSmall]}>
                <Text style={[
                  styles.optionLetter,
                  isSelected && styles.optionLetterSelected
                ]}>
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {isSelected && (
                  <MaterialIcons name="check" size={24} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.navigationContainer, isSmallDevice && styles.navigationContainerSmall]}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled, isSmallDevice && styles.navButtonSmall]}
          onPress={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <MaterialIcons name="arrow-back" size={20} color={currentQuestion === 0 ? colors.textMuted : colors.primary} />
          <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestion === quizData.questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.submitButton, isSmallDevice && styles.navButtonSmall]}
            onPress={handleSubmitQuiz}
          >
            <Text style={[styles.navButtonText, styles.submitButtonText]}>
              Submit Test
            </Text>
            <MaterialIcons name="check-circle" size={20} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton, isSmallDevice && styles.navButtonSmall]}
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, styles.nextButtonText]}>
              Next
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.scorePreview}>
        <Text style={styles.scorePreviewText}>
          Answered: {userAnswers.size} / {quizData.questions.length}
        </Text>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'transparent',
    minHeight: 400,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
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
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  difficultyText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  questionContainer: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  questionText: {
    ...typography.h3,
    lineHeight: 28,
  },
  optionsContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  optionButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  optionLetterSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.text,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  optionContentSmall: {
    padding: spacing.sm,
  },
  optionButtonSmall: {
    paddingVertical: spacing.xs,
  },
  optionLetter: {
    ...typography.h4,
    color: colors.textMuted,
    fontWeight: '700',
    minWidth: 28,
  },
  optionLetterActive: {
    color: colors.text,
  },
  optionText: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    flexShrink: 1,
  },
  navButtonSmall: {
    minWidth: 120,
    marginTop: spacing.sm,
  },
  navigationContainerSmall: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  questionContainerSmall: {
    padding: spacing.md,
  },
  optionsContainerSmall: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  optionTextActive: {
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  navButtonDisabled: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.h4,
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    color: colors.white,
  },
  
  // Performance Chart Styles
  performanceChart: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  chartTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xl * 2,
    height: 200,
    width: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    maxWidth: 120,
    height: '100%',
  },
  bar: {
    width: '100%',
    maxWidth: 80,
    borderRadius: borderRadius.md,
    minHeight: 30,
    alignSelf: 'center',
    ...shadows.sm,
  },
  correctBar: {
    backgroundColor: colors.success,
  },
  incorrectBar: {
    backgroundColor: colors.error,
  },
  barLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  barValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  
  // Trend Card Styles
  trendCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trendTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
  },
  accuracyMeter: {
    gap: spacing.sm,
  },
  accuracyTrack: {
    height: 24,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  accuracyText: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  
  // Breakdown Card Styles
  breakdownCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  breakdownTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  breakdownLabel: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  breakdownValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  breakdownPercent: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Insights Card Styles
  insightsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightsTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
  },
  insightsList: {
    gap: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
  },
  insightText: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    lineHeight: 22,
  },
  scorePreview: {
    padding: spacing.md,
    alignItems: 'center',
  },
  scorePreviewText: {
    ...typography.body,
    color: colors.textMuted,
  },
  completedContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  completedTitle: {
    ...typography.h1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  scoreText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  scoreValue: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 48,
    fontWeight: '700',
    marginVertical: spacing.sm,
  },
  percentageText: {
    ...typography.h2,
    color: colors.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  retryButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  
  // Timer Styles
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  timerWarning: {
    backgroundColor: '#ffebee',
  },
  timerText: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  timerTextWarning: {
    color: colors.error,
  },
  
  // Question Metadata Styles
  questionMetadata: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metadataBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue50,
  },
  metadataBadgeEasy: {
    backgroundColor: '#e8f5e9',
  },
  metadataBadgeMedium: {
    backgroundColor: '#fff3e0',
  },
  metadataBadgeHard: {
    backgroundColor: '#ffebee',
  },
  metadataText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  // Submit Button Styles
  submitButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  submitButtonText: {
    color: colors.white,
  },
  
  // Analysis Card Styles
  analysisCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  analysisTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  difficultyRow: {
    marginBottom: spacing.lg,
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  difficultyLabel: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  progressBarContainer: {
    gap: spacing.sm,
  },
  progressBarBg: {
    width: '100%',
    height: 24,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.md,
  },
  difficultyProgressText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  
  // Recommendations Card Styles
  recommendationsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recommendationsTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  recommendationText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
});
