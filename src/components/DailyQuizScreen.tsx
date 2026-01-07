import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { getDailyQuiz, submitDailyQuiz, startDailyQuiz, getUserCoins } from '../services/api';
import { getDailyQuizQuestions, getQuizSettings } from '../services/mockTestService';
import LoadingWebm from './LoadingWebm';
import { DailyQuizResults } from './DailyQuizResults';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

interface DailyQuizScreenProps {
  userId: string;
  onComplete: (totalCoins?: number) => void;
  onClose: () => void;
  visible?: boolean;
}

export const DailyQuizScreen: React.FC<DailyQuizScreenProps> = ({
  userId,
  onComplete,
  onClose,
  visible = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizState, setQuizState] = useState<'not-started' | 'started' | 'completed'>('not-started');
  const [results, setResults] = useState<any>(null);
  const [showDetailedResults, setShowDetailedResults] = useState<boolean>(false);
  const [startTime] = useState(Date.now());
  const [fadeAnim] = useState(new Animated.Value(0));
  const [coinAnim] = useState(new Animated.Value(0));
  const [attemptCoinsAwarded, setAttemptCoinsAwarded] = useState<number>(0);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [quizSettings, setQuizSettings] = useState<any>(null);

  const formatResultText = (value: any): string => {
    if (!value && value !== 0) return '';
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      if (typeof value.text === 'string') return value.text;
      if (typeof value.label === 'string') return value.label;
      if (typeof value.value === 'string') return value.value;
    }
    return String(value);
  };

  // helper for closing results modal from results component
  useEffect(() => {
    if (!showDetailedResults) return;
  }, [showDetailedResults]);

  const loadQuizSettings = async () => {
    try {
      const settings = await getQuizSettings();
      setQuizSettings(settings);
      console.log('Loaded quiz settings:', settings);
    } catch (error) {
      console.error('Failed to load quiz settings:', error);
      // Use default fallback values
      setQuizSettings({
        daily_quiz: {
          attempt_bonus: 5,
          coins_per_correct: 5,
          perfect_score_bonus: 10,
        }
      });
    }
  };

  useEffect(() => {
    // initial load
    loadQuizSettings();
    loadQuiz();
    loadUserCoins();
  }, []);

  // Reload quiz data when modal becomes visible to ensure questions render immediately
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setQuizData(null);
      setQuizState('not-started');
      setResults(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      loadQuiz();
    }
  }, [visible]);

  // Reload quiz when language changes
  useEffect(() => {
    if (quizState === 'not-started') {
      loadQuiz();
    }
  }, [language]);

  const loadUserCoins = async () => {
    try {
      const data = await getUserCoins(userId || 'anonymous');
      setUserCoins(data.total_coins || 0);
    } catch (e) {
      // silently ignore for now; UI will just show 0
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      console.log('Loading quiz for user:', userId);
      
      // Use local DailyQuiz.json file with 20 random questions
      const localQuizData = getDailyQuizQuestions(20, language);
      
      // Format the data to match expected structure
      const questions = localQuizData.questions.map((q: any, idx: number) => ({
        id: q.id ?? idx + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: q.category || 'general',
        difficulty: q.difficulty || 'medium',
      }));

      // Use dynamic quiz settings from backend
      const attemptBonus = quizSettings?.daily_quiz?.attempt_bonus ?? 5;
      const coinsPerCorrect = quizSettings?.daily_quiz?.coins_per_correct ?? 5;
      const perfectScoreBonus = quizSettings?.daily_quiz?.perfect_score_bonus ?? 10;

      const coins = { 
        attempt_bonus: attemptBonus, 
        per_correct_answer: coinsPerCorrect, 
        max_possible: attemptBonus + (questions.length * coinsPerCorrect) 
      };

      // Set quiz data with local questions
      const quizData = {
        quiz_id: 'daily-quiz-' + Date.now(),
        questions,
        coins,
        quiz_metadata: {
          quiz_type: 'daily_coin_quiz',
          total_questions: questions.length,
          difficulty: 'mixed',
          date: new Date().toISOString().split('T')[0],
          title: localQuizData.title,
          description: 'Test your knowledge with today\'s quiz!',
        },
      };

      console.log('Loaded', questions.length, 'random questions from DailyQuiz.json');
      setQuizData(quizData);
      setQuizState('not-started');
      
    } catch (error: any) {
      console.error('Failed to load quiz:', error);
      // Show fallback UI with settings or defaults
      const attemptBonus = quizSettings?.daily_quiz?.attempt_bonus ?? 5;
      const coinsPerCorrect = quizSettings?.daily_quiz?.coins_per_correct ?? 5;
      setQuizData({ questions: [], coins: { attempt_bonus: attemptBonus, per_correct_answer: coinsPerCorrect, max_possible: attemptBonus } });
      setQuizState('not-started');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    try {
      console.log('Starting quiz with ID:', quizData.quiz_id);
      console.log('Quiz has questions:', quizData.questions?.length);
      
      // Award attempt bonus coins locally
      const coinsAwarded = quizData?.coins?.attempt_bonus ?? 5;
      setAttemptCoinsAwarded(coinsAwarded);
      animateCoins();
      setCurrentQuestionIndex(0);
      setAnswers({});
      console.log('Setting quiz state to started');
      setQuizState('started');
    } catch (error: any) {
      console.error('Failed to start quiz:', error);
      Alert.alert('Error', error.message || 'Failed to start quiz');
    }
  };

  const selectAnswer = (optionIndex: number) => {
    const questionId = String(currentQuestionIndex + 1);
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const nextQuestion = () => {
    const questionId = String(currentQuestionIndex + 1);
    if (answers[questionId] === undefined) {
      Alert.alert('Please select an answer', 'Choose an option before moving to the next question.');
      return;
    }

    if (currentQuestionIndex < quizData.questions.length - 1) {
      fadeAnim.setValue(0);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      fadeAnim.setValue(0);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const animateCoins = () => {
    Animated.sequence([
      Animated.timing(coinAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.spring(coinAnim, {
        toValue: 1.2,
        friction: 3,
        useNativeDriver: false,
      }),
      Animated.timing(coinAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const submitQuiz = async () => {
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      Alert.alert('Error', 'No questions to submit');
      return;
    }

    console.log('Submitting quiz - answers:', answers);
    console.log('Total questions:', quizData.questions.length);
    console.log('Answered questions:', Object.keys(answers).length);
    
    if (Object.keys(answers).length < quizData.questions.length) {
      Alert.alert(
        'Incomplete Quiz',
        `Please answer all questions before submitting. (${Object.keys(answers).length}/${quizData.questions.length} answered)`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      console.log('Time taken:', timeTaken, 'seconds');
      console.log('Submitting to backend API...');
      
      // Submit to backend and get total_coins from server
      const backendResponse = await submitDailyQuiz(
        userId || 'anonymous',
        quizData.quiz_id,
        answers,
        timeTaken
      );
      
      console.log('Backend response received:', backendResponse);
      console.log('total_coins from backend:', backendResponse.total_coins);
      
      // Use backend response which has total_coins
      setAttemptCoinsAwarded(backendResponse.result?.coins_earned || backendResponse.coins_earned || 0);
      setResults(backendResponse);
      setQuizState('completed');
      animateCoins();
    } catch (error: any) {
      console.error('Submit quiz error:', error);
      Alert.alert('Error', error.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  // If loading and we don't have quiz data yet, show full-screen loader.
  if (loading && !quizData) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingWebm visible={true} />
        <Text style={styles.loadingText}>Loading Daily Quiz...</Text>
      </View>
    );
  }

  // Already completed state
  if (quizState === 'completed' && results) {
    const coinScale = coinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    return (
      <View style={styles.container}>
        {loading && quizData && <LoadingWebm visible={true} />}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quiz Results</Text>
            <Text style={styles.headerSubtitle}>Great job keeping your streak!</Text>
          </View>
          <View style={styles.headerRightProfile}>
            <View style={styles.profileAvatar}>
              <MaterialIcons name="account-circle" size={32} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.profileCoinsLabel}>Total Coins</Text>
              <View style={styles.profileCoinsRow}>
                <Image source={require('../../assets/coins.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                <Text style={styles.profileCoinsText}>{userCoins + (results.result?.coins_earned || results.coins_earned || 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.coinCelebrationCard,
              {
                transform: [
                  { scale: coinScale },
                  {
                    translateY: coinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.coinHeroRow}>
              <Image
                source={require('../../assets/coins.png')}
                style={styles.coinHeroImage}
                resizeMode="contain"
              />
              <View style={styles.coinHeroTextCol}>
                <Text style={styles.coinCelebrationTitle}>🎉 Quiz Completed!</Text>
                <Text style={styles.coinsEarnedText}>
                  {results.result?.coins_earned || results.coins_earned || 0} Coins Earned!
                </Text>
              </View>
            </View>
            
            {results.coin_breakdown && (
              <View style={styles.coinBreakdown}>
                <View style={styles.coinBreakdownRow}>
                  <View style={styles.coinBreakdownLabelWithIcon}>
                    <MaterialIcons name="stars" size={20} color="#F59E0B" />
                    <Text style={styles.coinBreakdownLabel}>Attempt Bonus:</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Text style={styles.coinBreakdownValue}>+{results.coin_breakdown.attempt_bonus}</Text>
                    <Image source={require('../../assets/coins.png')} style={{ width: 18, height: 18, marginLeft: spacing.xs }} />
                  </View>
                </View>
                <View style={styles.coinBreakdownRow}>
                  <View style={styles.coinBreakdownLabelWithIcon}>
                    <MaterialIcons name="verified" size={20} color="#10B981" />
                    <Text style={styles.coinBreakdownLabel}>
                      Correct Answers ({results.coin_breakdown.correct_answers}):
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Text style={styles.coinBreakdownValue}>+{results.coin_breakdown.correct_answer_coins}</Text>
                    <Image source={require('../../assets/coins.png')} style={{ width: 18, height: 18, marginLeft: spacing.xs }} />
                  </View>
                </View>
                <View style={[styles.coinBreakdownRow, styles.coinBreakdownTotal]}>
                  <View style={styles.coinBreakdownLabelWithIcon}>
                    <MaterialIcons name="emoji-events" size={20} color="#8B5CF6" />
                    <Text style={styles.coinBreakdownTotalLabel}>Total:</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Text style={styles.coinBreakdownTotalValue}>{results.coin_breakdown.total_earned}</Text>
                    <Image source={require('../../assets/coins.png')} style={{ width: 18, height: 18, marginLeft: spacing.xs }} />
                  </View>
                </View>
              </View>
            )}
          </Animated.View>

          <View style={styles.performanceCard}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statIconCircle}>
                  <MaterialIcons name="verified" size={28} color={colors.success} />
                </View>
                <Text style={styles.statNumber}>{results.result?.correct_count || results.correct_count}</Text>
                <Text style={styles.statText}>Correct</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <MaterialIcons name="quiz" size={28} color={colors.primary} />
                </View>
                <Text style={styles.statNumber}>{results.result?.total_questions || results.total_questions}</Text>
                <Text style={styles.statText}>Total</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: colors.warningLight }]}>
                  <MaterialIcons name="grade" size={28} color={colors.warning} />
                </View>
                <Text style={styles.statNumber}>
                  {Math.round(results.result?.score_percentage || results.score_percentage || 0)}%
                </Text>
                <Text style={styles.statText}>Score</Text>
              </View>
            </View>
          </View>

          {results.results && results.results.length > 0 && (
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>Review Answers</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.breakdownCarousel}
              >
              {results.results.map((r: any, idx: number) => (
                <Animated.View key={idx} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownQ}>Q{r.question_id}</Text>
                    <View style={[styles.breakdownBadge, r.is_correct ? styles.correctBadge : styles.incorrectBadge]}>
                      <MaterialIcons 
                        name={r.is_correct ? 'check-circle' : 'cancel'} 
                        size={16} 
                        color={colors.white} 
                      />
                      <Text style={styles.badgeText}>
                        {r.is_correct ? 'Correct' : 'Incorrect'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.breakdownQuestion}>{formatResultText(r.question)}</Text>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Your answer:</Text>
                    <Text style={[styles.answerValue, !r.is_correct && { color: colors.error }]}>
                      {formatResultText(r.user_answer)}
                    </Text>
                  </View>
                  {!r.is_correct && (
                    <View style={styles.answerRow}>
                      <Text style={styles.answerLabel}>Correct answer:</Text>
                      <Text style={[styles.answerValue, { color: colors.success }]}>
                        {formatResultText(r.correct_answer)}
                      </Text>
                    </View>
                  )}
                  {r.explanation && (
                    <View style={styles.explanationBox}>
                      <MaterialIcons name="lightbulb" size={16} color={colors.warning} />
                      <Text style={styles.explanationText}>{formatResultText(r.explanation)}</Text>
                    </View>
                  )}
                  {r.fun_fact && (
                    <View style={styles.funFactBox}>
                      <MaterialIcons name="info" size={16} color={colors.primary} />
                      <Text style={styles.funFactText}>{formatResultText(r.fun_fact)}</Text>
                    </View>
                  )}
                </Animated.View>
              ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.viewDetailedButton}
            onPress={() => setShowDetailedResults(true)}
          >
            <MaterialIcons name="article" size={18} color={colors.primary} />
            <Text style={styles.viewDetailedButtonText}>View Detailed Results</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              // Use total_coins from server response instead of local calculation
              const serverTotalCoins = results.result?.total_coins || results.total_coins;
              console.log('=== DAILY QUIZ COMPLETE ===');
              console.log('Results object:', JSON.stringify(results, null, 2));
              console.log('Server total_coins:', serverTotalCoins);
              console.log('Calling onComplete with:', serverTotalCoins);
              
              if (serverTotalCoins !== undefined) {
                onComplete(serverTotalCoins);
              } else {
                console.warn('WARNING: total_coins is undefined in response!');
                console.warn('Result structure:', Object.keys(results));
                if (results.result) {
                  console.warn('Result.result structure:', Object.keys(results.result));
                }
              }
              onClose();
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>

        {showDetailedResults && (
          <View style={styles.resultsModal}>
            <View style={styles.resultsModalContent}>
              <DailyQuizResults
                userId={userId || 'anonymous'}
                quizId={quizData?.quiz_id || quizData?.quiz_id}
                initialResults={results}
                onClose={() => setShowDetailedResults(false)}
              />
            </View>
          </View>
        )}
      </View>
    );
  }

  // Not started state
  if (quizState === 'not-started' && quizData) {
    return (
      <View style={styles.container}>
        {loading && quizData && <LoadingWebm visible={true} />}
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.startCard}>
            <Image source={require('../../assets/Quiz.png')} style={styles.quizImage} resizeMode="contain" />
            
            {/* Language Toggle */}
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[styles.languageButton, language === 'english' && styles.languageButtonActive]}
                onPress={() => setLanguage('english')}
              >
                <Text style={[styles.languageButtonText, language === 'english' && styles.languageButtonTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageButton, language === 'hindi' && styles.languageButtonActive]}
                onPress={() => setLanguage('hindi')}
              >
                <Text style={[styles.languageButtonText, language === 'hindi' && styles.languageButtonTextActive]}>
                  हिंदी
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.quizTitle}>{language === 'hindi' ? 'दैनिक प्रश्नोत्तरी' : 'Daily Quiz'}</Text>
            <Text style={styles.quizDescription}>
              {language === 'hindi' 
                ? 'आज की प्रश्नोत्तरी के साथ अपने ज्ञान का परीक्षण करें!'
                : (quizData.quiz_metadata?.description || 'Test your knowledge with today\'s quiz!')}
            </Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <MaterialIcons name="quiz" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  {quizData.questions?.length ?? 5} {language === 'hindi' ? 'प्रश्न' : 'Questions'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="timer" size={20} color={colors.primary} />
                <Text style={styles.infoText}>{language === 'hindi' ? 'कोई समय सीमा नहीं' : 'No time limit'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="emoji-events" size={20} color={colors.warning} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.infoText}>
                    {language === 'hindi' 
                      ? `${quizData.coins?.max_possible || 30} सिक्के तक कमाएं!`
                      : `Earn up to ${quizData.coins?.max_possible || 30} coins!`}
                  </Text>
                  <Image source={require('../../assets/coins.png')} style={{ width: 18, height: 18, marginLeft: spacing.xs }} />
                </View>
              </View>
            </View>

            <View style={styles.rewardCard}>
              <Text style={styles.rewardTitle}>{language === 'hindi' ? 'सिक्का पुरस्कार' : 'Coin Rewards'}</Text>
              <View style={styles.rewardRow}>
                <MaterialIcons name="play-circle" size={24} color={colors.success} />
                <Text style={styles.rewardText}>
                  {language === 'hindi' 
                    ? `शुरू करने के लिए +${quizData.coins?.attempt_bonus || 5} सिक्के`
                    : `+${quizData.coins?.attempt_bonus || 5} coins for starting`}
                </Text>
              </View>
              <View style={styles.rewardRow}>
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
                <Text style={styles.rewardText}>
                  {language === 'hindi'
                    ? `प्रति सही उत्तर +${quizData.coins?.per_correct_answer || 5} सिक्के`
                    : `+${quizData.coins?.per_correct_answer || 5} coins per correct answer`}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.startButton, !(quizData?.questions?.length > 0) && styles.startButtonDisabled]} onPress={handleStartQuiz} disabled={!(quizData?.questions?.length > 0)}>
              <MaterialIcons name="play-arrow" size={24} color={colors.white} />
              <Text style={styles.startButtonText}>
                {language === 'hindi' ? 'दैनिक प्रश्नोत्तरी शुरू करें' : 'Start Daily Quiz'}
              </Text>
            </TouchableOpacity>

            {(!quizData?.questions || quizData.questions.length === 0) && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={{ ...typography.small, color: colors.textMuted }}>
                  {language === 'hindi' 
                    ? 'अभी कोई प्रश्न उपलब्ध नहीं हैं। कृपया पुनः प्रयास करें।'
                    : 'No questions available right now. Please try again.'}
                </Text>
                <TouchableOpacity style={[styles.doneButton, { marginTop: spacing.sm }]} onPress={loadQuiz}>
                  <Text style={styles.doneButtonText}>{language === 'hindi' ? 'पुनः प्रयास करें' : 'Retry'}</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{language === 'hindi' ? 'बाद में' : 'Maybe Later'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Quiz in progress
  if (quizState === 'started' && quizData && quizData.questions && quizData.questions.length > 0) {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
    const questionId = String(currentQuestionIndex + 1);
    const selectedAnswer = answers[questionId];
    
    console.log('Rendering question', currentQuestionIndex + 1, '/', quizData.questions.length);
    console.log('Current question:', currentQuestion);

    return (
      <View style={styles.container}>
        {loading && quizData && <LoadingWebm visible={true} />}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Quiz</Text>
          <View style={styles.headerCoinsRight}>
            <Image
              source={require('../../assets/coins.png')}
              style={styles.headerCoinsIcon}
              resizeMode="contain"
            />
            <Text style={styles.headerCoinsText}>{attemptCoinsAwarded} / {quizData?.coins?.max_possible ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </Text>
          <View style={styles.coinInfo}>
            <MaterialIcons name="monetization-on" size={16} color={colors.primary} />
            <Text style={styles.coinInfoText}>
              Potential: {(quizData?.coins?.attempt_bonus ?? 5) + (Object.keys(answers).length * (quizData?.coins?.per_correct_answer ?? 5))} coins • Answered: {Object.keys(answers).length}/{quizData.questions.length}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.questionCard,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {currentQuestion.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{currentQuestion.category}</Text>
              </View>
            )}

            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option: string, index: number) => {
                const isSelected = selectedAnswer === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                    onPress={() => selectAnswer(index)}
                  >
                    <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                      {isSelected && <View style={styles.optionCircleInner} />}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
              onPress={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.white} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>

            {currentQuestionIndex < quizData.questions.length - 1 ? (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrimary]}
                onPress={nextQuestion}
              >
                <Text style={styles.navButtonText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonSuccess]}
                onPress={submitQuiz}
              >
                <MaterialIcons name="check" size={20} color={colors.white} />
                <Text style={styles.navButtonText}>Submit Quiz</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <MaterialIcons name="error-outline" size={60} color={colors.error} />
      <Text style={styles.errorTitle}>Unable to Load Quiz</Text>
      <Text style={styles.loadingText}>
        {!quizData ? 'Failed to load quiz data' : (quizState === 'started' ? 'No questions available for today.' : 'Quiz state error')}
      </Text>
      <Text style={styles.errorDetail}>
        State: {quizState} | Has Data: {quizData ? 'Yes' : 'No'}
      </Text>
      <TouchableOpacity style={styles.doneButton} onPress={loadQuiz}>
        <MaterialIcons name="refresh" size={20} color={colors.white} />
        <Text style={styles.doneButtonText}>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.textMuted, marginTop: spacing.sm }]} onPress={onClose}>
        <Text style={styles.doneButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
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
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorDetail: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  headerCoinsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerCoinsIcon: {
    width: 24,
    height: 24,
  },
  headerCoinsText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  headerRightProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCoinsLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  profileCoinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  profileCoinsText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  startCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
    alignItems: 'center',
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  languageButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  languageButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  quizImage: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  quizTitle: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '800',
  },
  quizDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  infoBox: {
    width: '100%',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
  },
  rewardCard: {
    width: '100%',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  rewardTitle: {
    ...typography.h4,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  rewardText: {
    ...typography.body,
    color: colors.text,
  },
  startButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
    gap: spacing.sm,
  },
  startButtonDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    opacity: 0.9,
  },
  startButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textMuted,
  },
  progressContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  categoryText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questionText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleSelected: {
    borderColor: colors.primary,
  },
  optionCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textMuted,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: colors.primary,
  },
  navButtonSuccess: {
    backgroundColor: colors.success,
  },
  navButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  coinCelebrationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  coinHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  coinHeroImage: {
    width: 80,
    height: 80,
  },
  coinHeroTextCol: {
    flex: 1,
  },
  coinCelebrationTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  coinsEarnedText: {
    ...typography.h1,
    color: colors.warning,
    fontWeight: '700',
  },
  coinBreakdown: {
    width: '100%',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
  },
  coinBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  coinBreakdownLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  coinBreakdownLabel: {
    ...typography.body,
    color: colors.text,
  },
  coinBreakdownValue: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '600',
  },
  coinBreakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  coinBreakdownTotalLabel: {
    ...typography.h4,
    color: colors.text,
  },
  coinBreakdownTotalValue: {
    ...typography.h4,
    color: colors.warning,
    fontWeight: '700',
  },
  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statNumber: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  statText: {
    ...typography.small,
    color: colors.textMuted,
  },
  breakdownCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  breakdownCarousel: {
    paddingVertical: spacing.sm,
  },
  breakdownItem: {
    width: 280,
    marginRight: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  breakdownQ: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  breakdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  correctBadge: {
    backgroundColor: colors.success,
  },
  incorrectBadge: {
    backgroundColor: colors.error,
  },
  badgeText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },
  breakdownQuestion: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  answerLabel: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  answerValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  explanationBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  explanationText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
  },
  funFactBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  funFactText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
    fontStyle: 'italic',
  },
  viewDetailedButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  viewDetailedButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.sm,
    marginTop: spacing.lg,
  },
  doneButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  resultsModal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  resultsModalContent: {
    width: isWeb && width > 900 ? 900 : '95%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  coinInfoText: {
    ...typography.small,
    color: colors.textMuted,
    marginLeft: spacing.xs / 2,
  },
});

export default DailyQuizScreen;
