import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView, 
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TextInputComponent } from './src/components/TextInput';
import { ImageUpload } from './src/components/ImageUpload';
import { FileUpload } from './src/components/FileUpload';
import { Results } from './src/components/Results';
import { Questions } from './src/components/Questions';
import { Solutions } from './src/components/Solutions';
import { Quiz } from './src/components/Quiz';
import { QuizSelector } from './src/components/QuizSelector';
import { Flashcard } from './src/components/Flashcard';
import { StudyMaterial } from './src/components/StudyMaterial';
import { PredictedQuestions } from './src/components/PredictedQuestions';
import YouTubeSummarizer from './src/components/YouTubeSummarizerNew';
import AnimatedLoader from './src/components/AnimatedLoader';
import { Pricing } from './src/components/Pricing';
import { SubscriptionPricing } from './src/components/SubscriptionPricing';
import { UsageDashboard } from './src/components/UsageDashboard';
import { AuthScreen } from './src/components/AuthScreen';
import { AuthScreenNew } from './src/components/AuthScreenNew';
import { LandingPageDashboard } from './src/components/LandingPageDashboard';
import { LandingPage } from './src/components/LandingPage';
import { MainDashboard } from './src/components/MainDashboard';
import { TrendAnalysis } from './src/components/TrendAnalysis';
import { PreviousYearPapers } from './src/components/PreviousYearPapers';
import { getUserCoins, getSubscriptionStatus } from './src/services/api';
import { DailyQuizScreen } from './src/components/DailyQuizScreen';
import { PairQuizContainer } from './src/components/pair-quiz';
import { WithdrawalScreen } from './src/components/WithdrawalScreen';
import { solveQuestionByText, solveQuestionByImage, checkHealth, generateQuiz, generateFlashcards, generateStudyMaterial, summarizeYouTubeVideo, generatePredictedQuestions } from './src/services/api';
import { generateMockTest } from './src/services/mockTestService';
import { colors, spacing, borderRadius, typography, shadows } from './src/styles/theme';

type TabType = 'text' | 'image';
type PageType = 'dashboard' | 'mock-test' | 'quiz' | 'flashcards' | 'ask' | 'predicted-questions' | 'youtube-summarizer' | 'pricing' | 'usage' | 'profile' | 'trends' | 'daily-quiz' | 'pair-quiz' | 'previous-papers' | 'withdrawal';
type DashboardSection = 'overview' | 'quiz' | 'flashcards' | 'study-material';
type AppScreenType = 'auth' | 'landing' | 'main';

interface User {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'email';
  avatar?: string | null;
}

const { width: initialWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// We'll use reactive screen width so web-resizes respond correctly
// and compute layout breakpoints from that value.

  const navItems = [
  { id: 'mock-test' as PageType, label: 'Mock Test', icon: 'quiz' },
  { id: 'quiz' as PageType, label: 'Quiz', icon: 'school' },
  { id: 'pair-quiz' as PageType, label: 'Pair Quiz', icon: 'people' },
  { id: 'flashcards' as PageType, label: 'Flashcards', icon: 'style' },
  { id: 'ask' as PageType, label: 'Ask Question', icon: 'help' },
  { id: 'predicted-questions' as PageType, label: 'Predicted Questions', icon: 'psychology' },
  { id: 'previous-papers' as PageType, label: 'Previous Papers', icon: 'description' },
  { id: 'trends' as PageType, label: 'PYQ Features', icon: 'analytics' },
  { id: 'daily-quiz' as PageType, label: 'Daily Quiz', icon: 'emoji-events' },
  { id: 'youtube-summarizer' as PageType, label: 'YouTube Summarizer', icon: 'ondemand-video' },
  { id: 'withdrawal' as PageType, label: 'Withdraw Coins', icon: 'account-balance-wallet' },
  { id: 'usage' as PageType, label: 'Usage Dashboard', icon: 'dashboard' },
  { id: 'pricing' as PageType, label: 'Pricing', icon: 'local-offer' },
];

export default function App() {
  // Authentication State
  const [appScreen, setAppScreen] = useState<AppScreenType>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(false);

  const [screenWidth, setScreenWidth] = useState(initialWidth);
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('ask');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>('overview');
  const [quizData, setQuizData] = useState<any>(null);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [flashcardData, setFlashcardData] = useState<any>(null);
  const [studyMaterialData, setStudyMaterialData] = useState<any>(null);
  const [predictedQuestionsData, setPredictedQuestionsData] = useState<any>(null);
  const [youtubeSummaryData, setYoutubeSummaryData] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [studyMaterialLoading, setStudyMaterialLoading] = useState(false);
  const [predictedQuestionsLoading, setPredictedQuestionsLoading] = useState(false);
  const [youtubeSummaryLoading, setYoutubeSummaryLoading] = useState(false);
  const [dailyQuizCount, setDailyQuizCount] = useState(0);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Authentication Handlers
  const handleAuthSuccess = (userInfo: User) => {
    setUser(userInfo);
    setAppScreen('main');
    setShowLanding(false);
    setCurrentPage('ask');
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: 'guest_' + Date.now(),
      name: 'Guest User',
      email: 'guest@example.com',
      provider: 'email',
    };
    handleAuthSuccess(guestUser);
  };

  const handleLogout = () => {
    setUser(null);
    setAppScreen('landing');
    setShowLanding(true);
    setResults(null);
    setQuizData(null);
    setFlashcardData(null);
    setStudyMaterialData(null);
    setPredictedQuestionsData(null);
    setYoutubeSummaryData(null);
  };

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 15000);
    loadUserCoins();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Refresh coins when user changes (login/logout)
    if (user?.id) {
      loadUserCoins();
      loadSubscriptionStatus();
    }
  }, [user]);

  const loadUserCoins = async () => {
    try {
      if (user?.id) {
        console.log('=== LOADING USER COINS ===');
        console.log('User ID:', user.id);
        const data = await getUserCoins(user.id);
        console.log('API Response:', data);
        console.log('Total coins from API:', data.total_coins);
        setUserCoins(data.total_coins || 0);
        console.log('Updated userCoins state to:', data.total_coins || 0);
      }
    } catch (e) {
      console.error('Failed to load user coins:', e);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      if (user?.id) {
        const data = await getSubscriptionStatus(user.id);
        setSubscriptionData(data);
      }
    } catch (e) {
      console.error('Failed to load subscription status:', e);
    }
  };

  useEffect(() => {
    const sub = Dimensions.addEventListener?.('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove?.();
  }, []);

  const checkApiHealth = async () => {
    try {
      await checkHealth();
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const handleTextSubmit = async (question: string) => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await solveQuestionByText(question);
      setResults(response);
      setLoading(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to solve question');
      setLoading(false);
    }
  };

  const handleImageSubmit = async (imageUri: string) => {
    setLoading(true);
    setResults(null);

    try {
      const response = await solveQuestionByImage(imageUri, 5);
      setResults(response);
      setLoading(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process image');
      setLoading(false);
    }
  };

  const toggleDrawer = (open?: boolean) => {
    setDrawerOpen((prev) => (open === undefined ? !prev : open));
  };

  const handleGenerateQuiz = async (topic: string, numQuestions: number = 5, difficulty: string = 'medium') => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    setQuizLoading(true);
    setQuizData(null);

    try {
      const response = await generateQuiz(topic, numQuestions, difficulty);
      setQuizData(response);
      setQuizLoading(false);
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', error.message || 'Failed to generate quiz');
      }
      setQuizLoading(false);
    }
  };

  const handleGenerateQuizFromFile = async (files: any[], numQuestions: number = 5, difficulty: string = 'medium') => {
    if (!files || files.length === 0) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    
    setQuizLoading(true);
    setQuizData(null);

    try {
      // Use first file for now (backend supports single file)
      const response = await generateQuiz('', numQuestions, difficulty, files[0]);
      setQuizData(response);
      setQuizLoading(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate quiz from file');
      setQuizLoading(false);
    }
  };

  const handleGenerateFlashcards = async (topic: string, numCards: number = 10) => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    setFlashcardLoading(true);
    setFlashcardData(null);

    try {
      const response = await generateFlashcards(topic, numCards);
      setFlashcardData(response);
      setFlashcardLoading(false);
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', error.message || 'Failed to generate flashcards');
      }
      setFlashcardLoading(false);
    }
  };

  const handleGenerateFlashcardsFromImage = async (imageUri: string) => {
    setFlashcardLoading(true);
    setFlashcardData(null);

    try {
      const document = {
        uri: imageUri,
        mimeType: 'image/jpeg',
        name: 'image_upload.jpg',
      } as any;

      const response = await generateFlashcards('', 10, document);
      setFlashcardData(response);
      setFlashcardLoading(false);
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', error.message || 'Failed to generate flashcards from image');
      }
      setFlashcardLoading(false);
    }
  };

  const handleGenerateFlashcardsFromFile = async (files: any[], numCards: number = 10) => {
    if (!files || files.length === 0) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    
    setFlashcardLoading(true);
    setFlashcardData(null);

    try {
      // Use first file for now (backend supports single file)
      const response = await generateFlashcards('', numCards, files[0]);
      setFlashcardData(response);
      setFlashcardLoading(false);
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', error.message || 'Failed to generate flashcards from file');
      }
      setFlashcardLoading(false);
    }
  };

  const handleGenerateStudyMaterial = async (text: string) => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter text or upload a document');
      return;
    }

    setStudyMaterialLoading(true);
    setStudyMaterialData(null);

    try {
      const response = await generateStudyMaterial(text);
      setStudyMaterialData(response);
      setStudyMaterialLoading(false);
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', error.message || 'Failed to generate study material');
      }
      setStudyMaterialLoading(false);
    }
  };

  const handleGenerateStudyMaterialFromFile = async (files: any[]) => {
    if (!files || files.length === 0) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    
    setStudyMaterialLoading(true);
    setStudyMaterialData(null);

    try {
      const response = await generateStudyMaterial(undefined, files[0]);
      setStudyMaterialData(response);
      setStudyMaterialLoading(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate study material from file');
      setStudyMaterialLoading(false);
    }
  };

  const handleGeneratePredictedQuestions = async (topic: string, examType: string = 'General') => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic or subject');
      return;
    }

    setPredictedQuestionsLoading(true);
    setPredictedQuestionsData(null);

    try {
      const response = await generatePredictedQuestions(topic, examType, 5);
      setPredictedQuestionsData(response);
      setPredictedQuestionsLoading(false);
    } catch (error: any) {
      // Show backend details if available
      const message = error.response?.data?.error || error.message || 'Failed to generate predicted questions';
      const details = error.response?.data?.details;
      Alert.alert('Error', message, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      setPredictedQuestionsLoading(false);
    }
  };

  const handleGeneratePredictedQuestionsFromImage = async (imageUri: string) => {
    // Send image as document to the backend which will use OCR to extract text
    setPredictedQuestionsLoading(true);
    setPredictedQuestionsData(null);

    try {
      const document = {
        uri: imageUri,
        mimeType: 'image/jpeg',
        name: 'image_upload.jpg',
      } as any;

      const response = await generatePredictedQuestions(undefined, 'General', 5, document);
      setPredictedQuestionsData(response);
      setPredictedQuestionsLoading(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate predicted questions from image');
      setPredictedQuestionsLoading(false);
    }
  };

  const handleGeneratePredictedQuestionsFromFile = async (files: any[], examType: string = 'General') => {
    if (!files || files.length === 0) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    
    setPredictedQuestionsLoading(true);
    setPredictedQuestionsData(null);

    try {
      const response = await generatePredictedQuestions(undefined, examType, 5, files[0]);
      setPredictedQuestionsData(response);
      setPredictedQuestionsLoading(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate predicted questions from file');
      setPredictedQuestionsLoading(false);
    }
  };

  const handleSummarizeYouTubeVideo = async (videoUrl: string) => {
    if (!videoUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
      return;
    }

    setYoutubeSummaryLoading(true);
    setYoutubeSummaryData(null);

    try {
      const response = await summarizeYouTubeVideo(videoUrl, false);
      setYoutubeSummaryData(response);
      setYoutubeSummaryLoading(false);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to summarize YouTube video';
      const details = error.response?.data?.details;
      Alert.alert('Error', message, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      setYoutubeSummaryLoading(false);
    }
  };

  const handleStartQuiz = (config: any) => {
    try {
      setQuizLoading(true);
      setQuizData(null);

      // Generate mock test from local JSON files with random question selection
      const mockTestData = generateMockTest({
        subject: config.subject,
        topics: config.topics || [],
        difficulty: config.difficulty || 'medium',
        examLevel: config.examLevel || 'jee-mains',
        timeLimit: config.timeLimit || 0,
        numQuestions: config.numQuestions || 20,
      });

      setQuizData(mockTestData);
      setQuizLoading(false);
      
      // Increment Daily Quiz count for free users
      setDailyQuizCount(prev => prev + 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate mock test');
      setQuizLoading(false);
    }
  };

  const renderSidebar = () => {
    // This function is no longer used - replaced by renderSidebarWithLogout
    return null;
  };

  const renderMainContent = () => {
    return (
      <View style={styles.mainContent}>
      {/* Top navbar for smaller screens, search + notifications + avatar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {screenWidth <= 767 && (
            <TouchableOpacity onPress={() => toggleDrawer(true)} style={styles.hamburger}>
              <MaterialIcons name="menu" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Always show compact right-side: coins + avatar (removes search and notifications) */}
        <View style={styles.topRightCompact}>
          <TouchableOpacity 
            onPress={() => setCurrentPage('withdrawal')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'transparent', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border }}
          >
            <Image source={require('./assets/coins.png')} style={{ width: 20, height: 20 }} />
            <Text style={{ color: colors.text, fontWeight: '700' }}>{userCoins}</Text>
          </TouchableOpacity>
          <View style={styles.avatarSmall}>
            <MaterialIcons name="account-circle" size={28} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.pageHeader}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={28} color={colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle}>ED Tech Solver</Text>
            <Text style={styles.pageSubtitle}>AI-powered solving</Text>
          </View>
        </View>
        
        <View style={[styles.statusPill, apiStatus === 'online' ? styles.statusOnline : styles.statusOffline]}>
          <MaterialIcons 
            name={apiStatus === 'online' ? 'check-circle' : apiStatus === 'checking' ? 'sync' : 'error'} 
            size={16} 
            color={colors.white} 
          />
          <Text style={styles.statusText}>
            {apiStatus === 'online' ? 'Online' : apiStatus === 'checking' ? 'Checking...' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* If the app page is Questions or Solutions, show that view instead of the ask input */}
      {currentPage === 'dashboard' ? (
        <View style={{ flex: 1, padding: spacing.lg }}>
          {/* Dashboard Sections Tabs */}
          <View style={styles.dashboardTabsContainer}>
            <TouchableOpacity
              style={[styles.dashboardTab, dashboardSection === 'overview' && styles.dashboardTabActive]}
              onPress={() => setDashboardSection('overview')}
            >
              <MaterialIcons 
                name="dashboard" 
                size={20} 
                color={dashboardSection === 'overview' ? colors.primary : colors.textMuted} 
              />
              <Text style={[styles.dashboardTabText, dashboardSection === 'overview' && styles.dashboardTabTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dashboardTab, dashboardSection === 'quiz' && styles.dashboardTabActive]}
              onPress={() => setDashboardSection('quiz')}
            >
              <MaterialIcons 
                name="quiz" 
                size={20} 
                color={dashboardSection === 'quiz' ? colors.primary : colors.textMuted} 
              />
              <Text style={[styles.dashboardTabText, dashboardSection === 'quiz' && styles.dashboardTabTextActive]}>
                Mock Test
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dashboardTab, dashboardSection === 'flashcards' && styles.dashboardTabActive]}
              onPress={() => setDashboardSection('flashcards')}
            >
              <MaterialIcons 
                name="style" 
                size={20} 
                color={dashboardSection === 'flashcards' ? colors.primary : colors.textMuted} 
              />
              <Text style={[styles.dashboardTabText, dashboardSection === 'flashcards' && styles.dashboardTabTextActive]}>
                Flashcards
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dashboardTab, dashboardSection === 'study-material' && styles.dashboardTabActive]}
              onPress={() => setDashboardSection('study-material')}
            >
              <MaterialIcons 
                name="school" 
                size={20} 
                color={dashboardSection === 'study-material' ? colors.primary : colors.textMuted} 
              />
              <Text style={[styles.dashboardTabText, dashboardSection === 'study-material' && styles.dashboardTabTextActive]}>
                Study Material
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dashboard Content */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {dashboardSection === 'overview' && (
              <View style={styles.overviewContainer}>
                <View style={styles.featureCard}>
                  <MaterialIcons name="quiz" size={48} color={colors.primary} />
                  <Text style={styles.featureTitle}>Generate Mock Test</Text>
                  <Text style={styles.featureDescription}>
                    Create targeted practice tests from any topic or document
                  </Text>
                  <TouchableOpacity 
                    style={styles.featureButton}
                    onPress={() => setDashboardSection('quiz')}
                  >
                    <Text style={styles.featureButtonText}>Start Mock Test</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>

                <View style={styles.featureCard}>
                  <MaterialIcons name="style" size={48} color={colors.success} />
                  <Text style={styles.featureTitle}>Study Flashcards</Text>
                  <Text style={styles.featureDescription}>
                    Master concepts with AI-generated flashcards
                  </Text>
                  <TouchableOpacity 
                    style={[styles.featureButton, { backgroundColor: colors.success }]}
                    onPress={() => setDashboardSection('flashcards')}
                  >
                    <Text style={styles.featureButtonText}>Create Flashcards</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>

                <View style={styles.featureCard}>
                  <MaterialIcons name="school" size={48} color={colors.error} />
                  <Text style={styles.featureTitle}>Study Material</Text>
                  <Text style={styles.featureDescription}>
                    Extract topics, concepts, notes, and questions from sample papers
                  </Text>
                  <TouchableOpacity 
                    style={[styles.featureButton, { backgroundColor: colors.error }]}
                    onPress={() => setDashboardSection('study-material')}
                  >
                    <Text style={styles.featureButtonText}>Generate Material</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>

                <View style={styles.featureCard}>
                  <MaterialIcons name="search" size={48} color={colors.warning} />
                  <Text style={styles.featureTitle}>Ask Questions</Text>
                  <Text style={styles.featureDescription}>
                    Get instant answers to any question with AI
                  </Text>
                  <TouchableOpacity 
                    style={[styles.featureButton, { backgroundColor: colors.warning }]}
                    onPress={() => setCurrentPage('ask')}
                  >
                    <Text style={styles.featureButtonText}>Ask Now</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {dashboardSection === 'quiz' && (
              <View style={styles.sectionContainer}>
                {!quizData && !quizLoading && (
                  <QuizSelector 
                    onStartQuiz={handleStartQuiz} 
                    onClose={() => {}} 
                    userCoins={0}
                    isPremium={false}
                    dailyQuizCount={dailyQuizCount}
                  />
                )}
                <Quiz quizData={quizData} loading={quizLoading} />
                {quizData && (
                  <TouchableOpacity 
                    style={styles.newContentButton}
                    onPress={() => setQuizData(null)}
                  >
                    <MaterialIcons name="add" size={20} color={colors.white} />
                    <Text style={styles.newContentButtonText}>Generate New Quiz</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {dashboardSection === 'flashcards' && (
              <View style={styles.sectionContainer}>
                {!flashcardData && !flashcardLoading && (
                  <View style={styles.inputSection}>
                    <Text style={styles.sectionTitle}>Generate Flashcards</Text>
                    <TextInputComponent 
                      onSubmit={(topic) => handleGenerateFlashcards(topic, 10)} 
                      loading={flashcardLoading}
                      placeholder="Enter a topic (e.g., Spanish vocabulary, Chemistry formulas, History dates)"
                    />

                    <Text style={styles.orText}>— or —</Text>

                    <FileUpload
                      onSubmit={(file) => handleGenerateFlashcardsFromFile(file, 10)}
                      loading={flashcardLoading}
                      placeholder="Upload a PDF/TXT/Image to generate flashcards"
                    />
                  </View>
                )}
                <Flashcard 
                  flashcardData={flashcardData} 
                  loading={flashcardLoading}
                  onTextSubmit={(text) => handleGenerateFlashcards(text, 10)}
                  onImageSubmit={handleGenerateFlashcardsFromImage}
                />
                {flashcardData && (
                  <TouchableOpacity 
                    style={styles.newContentButton}
                    onPress={() => setFlashcardData(null)}
                  >
                    <MaterialIcons name="add" size={20} color={colors.white} />
                    <Text style={styles.newContentButtonText}>Generate New Flashcards</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {dashboardSection === 'study-material' && (
              <View style={styles.sectionContainer}>
                {!studyMaterialData && !studyMaterialLoading && (
                  <View style={styles.inputSection}>
                    <Text style={styles.sectionTitle}>Generate Study Material</Text>
                    <Text style={styles.sectionSubtitle}>
                      Upload a sample paper or paste text to extract important topics, concepts, study notes, and practice questions
                    </Text>
                    <TextInputComponent 
                      onSubmit={handleGenerateStudyMaterial} 
                      loading={studyMaterialLoading}
                      placeholder="Paste sample paper text or upload a document"
                    />

                    <Text style={styles.orText}>— or —</Text>

                    <FileUpload
                      onSubmit={(file) => handleGenerateStudyMaterialFromFile(file)}
                      loading={studyMaterialLoading}
                      placeholder="Upload PDF/TXT/Image to extract study material"
                    />
                  </View>
                )}
                <StudyMaterial studyMaterialData={studyMaterialData} loading={studyMaterialLoading} />
                {studyMaterialData && (
                  <TouchableOpacity 
                    style={styles.newContentButton}
                    onPress={() => setStudyMaterialData(null)}
                  >
                    <MaterialIcons name="add" size={20} color={colors.white} />
                    <Text style={styles.newContentButtonText}>Generate New Study Material</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      ) : currentPage === 'mock-test' ? (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionContainer}>
              {!quizData && !quizLoading && (
                <QuizSelector 
                  onStartQuiz={handleStartQuiz} 
                  onClose={() => setCurrentPage('ask')} 
                  userCoins={0}
                  isPremium={false}
                  dailyQuizCount={dailyQuizCount}
                  quizType="mock-test"
                />
              )}
              {(quizData || quizLoading) && (
                <Quiz quizData={quizData} loading={quizLoading} />
              )}
              {quizData && (
                <TouchableOpacity 
                  style={styles.newContentButton}
                  onPress={() => setQuizData(null)}
                >
                  <MaterialIcons name="add" size={20} color={colors.white} />
                  <Text style={styles.newContentButtonText}>Generate New Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      ) : currentPage === 'quiz' ? (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.featurePageContainer}>
              {!quizData && !quizLoading && (
                <View style={styles.featureHeader}>
                  <Image 
                    source={require('./assets/Quiz.png')} 
                    style={styles.featureHeaderImage} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.featureTitle}>Generate Quiz from Document or Text</Text>
                  <Text style={styles.featureSubtitle}>
                    Upload a document or paste text to generate custom quiz questions
                  </Text>
                </View>
              )}

              {!quizData && !quizLoading && (
                <View style={styles.horizontalTabsContainer}>
                  <View style={styles.horizontalTabs}>
                    <TouchableOpacity
                      style={[styles.horizontalTab, activeTab === 'text' && styles.horizontalTabActive]}
                      onPress={() => setActiveTab('text')}
                    >
                      <MaterialIcons 
                        name="text-fields" 
                        size={20} 
                        color={activeTab === 'text' ? colors.white : colors.textMuted} 
                      />
                      <Text style={[styles.horizontalTabText, activeTab === 'text' && styles.horizontalTabTextActive]}>
                        Text Input
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.horizontalTab, activeTab === 'image' && styles.horizontalTabActive]}
                      onPress={() => setActiveTab('image')}
                    >
                      <MaterialIcons 
                        name="upload-file" 
                        size={20} 
                        color={activeTab === 'image' ? colors.white : colors.textMuted} 
                      />
                      <Text style={[styles.horizontalTabText, activeTab === 'image' && styles.horizontalTabTextActive]}>
                        Document Upload
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.horizontalTabContent}>
                    {activeTab === 'text' ? (
                      <TextInputComponent 
                        onSubmit={(text) => handleGenerateQuiz(text, 10, 'medium')} 
                        loading={quizLoading}
                        placeholder="Paste your study material, notes, or topic content here..."
                      />
                    ) : (
                      <FileUpload
                        onSubmit={(file) => handleGenerateQuizFromFile(file, 10, 'medium')}
                        loading={quizLoading}
                        placeholder="Upload PDF, TXT, or Image document to generate quiz"
                      />
                    )}
                  </View>
                </View>
              )}

              {(quizData || quizLoading) && (
                <View style={styles.contentSection}>
                  <Quiz quizData={quizData} loading={quizLoading} />
                </View>
              )}

              {quizData && (
                <TouchableOpacity 
                  style={styles.newContentButton}
                  onPress={() => setQuizData(null)}
                >
                  <MaterialIcons name="add" size={20} color={colors.white} />
                  <Text style={styles.newContentButtonText}>Generate New Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      ) : currentPage === 'flashcards' ? (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.featurePageContainer}>
              {/* Header Section */}
              {!flashcardData && !flashcardLoading && (
                <View style={styles.featureHeader}>
                  <Image 
                    source={require('./assets/Books.png')} 
                    style={styles.featureHeaderImage} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.featureTitle}>Generate Flashcards</Text>
                  <Text style={styles.featureSubtitle}>
                    Create interactive study cards with questions and answers from any topic or document
                  </Text>
                </View>
              )}

              {!flashcardData && !flashcardLoading && (
                <View style={styles.inputSection}>
                  <Flashcard
                    flashcardData={null}
                    loading={flashcardLoading}
                    onTextSubmit={(topic) => handleGenerateFlashcards(topic, 10)}
                    onImageSubmit={handleGenerateFlashcardsFromImage}
                  />
                </View>
              )}
              
              {(flashcardData || flashcardLoading) && (
                <View style={styles.contentSection}>
                  <Flashcard 
                    flashcardData={flashcardData} 
                    loading={flashcardLoading}
                    onTextSubmit={(text) => handleGenerateFlashcards(text, 10)}
                    onImageSubmit={handleGenerateFlashcardsFromImage}
                  />
                </View>
              )}
              
              {flashcardData && (
                <TouchableOpacity 
                  style={styles.newContentButton}
                  onPress={() => setFlashcardData(null)}
                >
                  <MaterialIcons name="add" size={20} color={colors.white} />
                  <Text style={styles.newContentButtonText}>Generate New Flashcards</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      ) : currentPage === 'predicted-questions' ? (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.featurePageContainer}>


              {!predictedQuestionsData && !predictedQuestionsLoading && (
                <View style={styles.inputSection}>
                  <PredictedQuestions
                    predictedQuestionsData={null}
                    loading={predictedQuestionsLoading}
                    onTextSubmit={(topic) => handleGeneratePredictedQuestions(topic, 'General')}
                    onFileSubmit={(files) => handleGeneratePredictedQuestionsFromFile(files, 'General')}
                  />
                </View>
              )}
              
              {(predictedQuestionsData || predictedQuestionsLoading) && (
                <View style={styles.contentSection}>
                  <PredictedQuestions 
                    predictedQuestionsData={predictedQuestionsData} 
                    loading={predictedQuestionsLoading}
                    onTextSubmit={(text) => handleGeneratePredictedQuestions(text, 'General')}
                    onImageSubmit={handleGeneratePredictedQuestionsFromImage}
                    onFileSubmit={(files) => handleGeneratePredictedQuestionsFromFile(files, 'General')}
                  />
                </View>
              )}
              
              {predictedQuestionsData && (
                <TouchableOpacity 
                  style={styles.newContentButton}
                  onPress={() => setPredictedQuestionsData(null)}
                >
                  <MaterialIcons name="add" size={20} color={colors.white} />
                  <Text style={styles.newContentButtonText}>Generate New Predictions</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      ) : currentPage === 'youtube-summarizer' ? (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <View style={[styles.sectionContainer, { width: '100%', maxWidth: 900, alignItems: 'center' }]}>
              <YouTubeSummarizer 
                summaryData={youtubeSummaryData} 
                loading={youtubeSummaryLoading}
                onSubmit={handleSummarizeYouTubeVideo}
                userId={user?.id}
                onUpgrade={() => setCurrentPage('pricing')}
              />
              {youtubeSummaryData && (
                <TouchableOpacity 
                  style={styles.newContentButton}
                  onPress={() => setYoutubeSummaryData(null)}
                >
                  <MaterialIcons name="add" size={20} color={colors.white} />
                  <Text style={styles.newContentButtonText}>Summarize Another Video</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      ) : currentPage === 'ask' ? (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.askQuestionContainer}>
              {/* Header Section */}
              <View style={styles.askQuestionHeader}>
                <MaterialIcons name="help-outline" size={48} color={colors.primary} />
                <Text style={styles.askQuestionTitle}>Ask Any Question</Text>
                <Text style={styles.askQuestionSubtitle}>
                  Get instant AI-powered answers with step-by-step explanations
                </Text>
              </View>

              {/* Tab Selector */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'text' && styles.activeTab]}
                  onPress={() => setActiveTab('text')}
                >
                  <MaterialIcons 
                    name="text-fields" 
                    size={20} 
                    color={activeTab === 'text' ? colors.primary : colors.textMuted} 
                  />
                  <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>
                    Text Input
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, activeTab === 'image' && styles.activeTab]}
                  onPress={() => setActiveTab('image')}
                >
                  <MaterialIcons 
                    name="photo-camera" 
                    size={20} 
                    color={activeTab === 'image' ? colors.primary : colors.textMuted} 
                  />
                  <Text style={[styles.tabText, activeTab === 'image' && styles.activeTabText]}>
                    Image Upload
                  </Text>
                </TouchableOpacity>
              </View>

              {loading && (
                <View style={styles.loadingContainer}>
                  <AnimatedLoader visible={true} size="large" />
                </View>
              )}

              {!loading && !results && (
                <View style={styles.inputSection}>
                  {activeTab === 'text' ? (
                    <TextInputComponent onSubmit={handleTextSubmit} loading={loading} />
                  ) : (
                    <ImageUpload onSubmit={handleImageSubmit} loading={loading} />
                  )}
                </View>
              )}

              {!loading && results && (
                <View style={styles.resultsSection}>
                  <Results data={results} />
                  <TouchableOpacity
                    style={styles.newContentButton}
                    onPress={() => setResults(null)}
                  >
                    <MaterialIcons name="add" size={20} color={colors.white} />
                    <Text style={styles.newContentButtonText}>Ask New Question</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      ) : currentPage === 'pricing' ? (
        <View style={{ flex: 1 }}>
          <SubscriptionPricing 
            userId={user?.id || 'guest'}
            onBack={() => setCurrentPage('ask')}
            usage={subscriptionData?.usage}
            limits={subscriptionData?.limits}
          />
        </View>
      ) : currentPage === 'usage' ? (
        <View style={{ flex: 1 }}>
          <UsageDashboard 
            userId={user?.id || 'guest'}
            onBack={() => setCurrentPage('ask')}
            onUpgrade={() => setCurrentPage('pricing')}
          />
        </View>
      ) : currentPage === 'pair-quiz' ? (
        <View style={{ flex: 1 }}>
          <PairQuizContainer onExit={() => setCurrentPage('ask')} />
        </View>
      ) : currentPage === 'daily-quiz' ? (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.featurePageContainer}>
              <DailyQuizScreen
                userId={user?.id || 'guest'}
                onComplete={(totalCoins) => { 
                  console.log('=== APP.TSX onComplete CALLED ===');
                  console.log('Received totalCoins:', totalCoins);
                  console.log('Current userCoins state:', userCoins);
                  
                  setCurrentPage('ask'); 
                  setDailyQuizCount(prev => prev + 1); 
                  
                  // Always refresh coins from server to ensure accuracy
                  loadUserCoins();
                  
                  if (totalCoins !== undefined) {
                    console.log('Setting userCoins to:', totalCoins);
                    setUserCoins(totalCoins);
                  } else {
                    console.warn('totalCoins is undefined, only calling loadUserCoins');
                  }
                }}
                onClose={() => {
                  setCurrentPage('ask');
                  // Refresh coins when closing quiz
                  loadUserCoins();
                }}
              />
            </View>
          </ScrollView>
        </View>
      ) : currentPage === 'withdrawal' ? (
        <View style={{ flex: 1 }}>
          <WithdrawalScreen
            userId={user?.id || 'guest'}
            onClose={() => setCurrentPage('ask')}
            onWithdrawalSuccess={() => {
              loadUserCoins();
            }}
          />
        </View>
      ) : currentPage === 'trends' ? (
        <View style={{ flex: 1, padding: spacing.lg }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <TrendAnalysis onClose={() => setCurrentPage('ask')} />
          </ScrollView>
        </View>
      ) : currentPage === 'previous-papers' ? (
        <View style={{ flex: 1 }}>
          <PreviousYearPapers />
        </View>
      ) : null}
      </View>
    );
  };

  const showSidebar = isWeb && screenWidth >= 768;

  // Render Auth Screen
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        {showLanding ? (
          <LandingPage 
            onGetStarted={() => setShowLanding(false)}
            onLogin={() => setShowLanding(false)}
            onGuestLogin={handleGuestLogin}
          />
        ) : (
          <AuthScreenNew 
            onAuthSuccess={handleAuthSuccess}
            onGuestLogin={handleGuestLogin}
          />
        )}
      </SafeAreaView>
    );
  }

  // Render Main App with user logged in
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <>
        {/* Drawer overlay for mobile */}
        {!showSidebar && drawerOpen && (
          <TouchableOpacity style={styles.drawerOverlay} activeOpacity={0.9} onPress={() => toggleDrawer(false)} />
        )}

        {/* Mobile drawer (slides in) */}
        {!showSidebar && drawerOpen && (
          <View style={[styles.sidebar, styles.sidebarDrawer]}>
            {renderSidebarWithLogout()}
          </View>
        )}

        {showSidebar ? (
          <View style={styles.layoutWithSidebar}>
            {renderSidebarWithLogout()}
            {renderMainContent()}
          </View>
        ) : (
          renderMainContent()
        )}
      </>
    </SafeAreaView>
  );

  function renderSidebarWithLogout() {
    // compute sidebar width for different breakpoints
    const sidebarWidth = screenWidth >= 1280 ? 240 : screenWidth >= 768 ? 200 : 240;
    return (
      <View style={[styles.sidebar, { width: sidebarWidth, minWidth: sidebarWidth }]}>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <MaterialIcons name="account-circle" size={64} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>{user?.provider === 'google' ? 'Google User' : 'Learner'}</Text>
        </View>

        <ScrollView style={styles.navMenu} showsVerticalScrollIndicator={false}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, currentPage === item.id && styles.navItemActive]}
              onPress={() => setCurrentPage(item.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={item.icon as any} 
                size={20} 
                color={currentPage === item.id ? colors.primary : colors.textMuted} 
              />
              <Text style={[
                styles.navText,
                currentPage === item.id && styles.navTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <MaterialIcons name="logout" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  layoutWithSidebar: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: spacing.xl,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userProfile: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: spacing.lg,
  },
  avatar: {
    marginBottom: spacing.md,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    ...typography.h3,
    marginBottom: spacing.xs,
    fontWeight: '700',
    color: '#111827',
  },
  userRole: {
    ...typography.small,
    color: '#6B7280',
    fontWeight: '500',
  },
  navMenu: {
    flex: 1,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    transition: 'background-color 200ms ease' as any,
  },
  navItemActive: {
    backgroundColor: '#EEF2FF',
  },
  navText: {
    ...typography.body,
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sidebarFooter: {
    gap: spacing.md,
    marginTop: 'auto',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.error + '15',
  },
  logoutText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.error,
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
  },
  pageHeader: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  pageTitle: {
    ...typography.h2,
    marginBottom: 2,
  },
  pageSubtitle: {
    ...typography.small,
    color: colors.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  statusOnline: {
    backgroundColor: colors.success,
  },
  statusOffline: {
    backgroundColor: colors.error,
  },
  statusText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },
  heroStatsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroStatsContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  statCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 220,
    minHeight: 140,
    ...shadows.sm,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
    marginVertical: 2,
  },
  statHint: {
    fontSize: 11,
    color: colors.textLight,
  },
  /* drawer overlay */
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 50,
  },
  sidebarDrawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 60,
    boxShadow: '6px 0 24px rgba(0, 0, 0, 0.18)',
    elevation: 12,
    backgroundColor: colors.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  topRightCompact: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hamburger: { padding: spacing.xs },
  pageHeadingText: { ...typography.h3, marginLeft: spacing.sm },
  searchShell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  iconButton: { padding: spacing.xs },
  avatarSmall: { width: 36, height: 36, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },

  /* hero grid layouts */
  heroGridRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', marginVertical: spacing.md },
  heroGridRowTwo: { flexDirection: 'row', gap: spacing.md },
  heroGridRowMobile: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  statCardLarge: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, borderRadius: borderRadius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, ...shadows.md },
  statCardMedium: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, borderRadius: borderRadius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  statCardMediumFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, borderRadius: borderRadius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  statCardMobile: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  statContentCenter: { alignItems: 'center', justifyContent: 'center' },
  statValueLarge: { ...typography.h2, color: colors.primary },
  statValueMobile: { ...typography.h4, color: colors.primary, fontWeight: '700' },
  statLabelMobile: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
    fontWeight: '600',
  },
  askQuestionContainer: {
    padding: spacing.xl,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  askQuestionHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  askQuestionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  askQuestionSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  resultsSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  featurePageContainer: {
    padding: spacing.xl,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  featureHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  featureHeaderImage: {
    width: 120,
    height: 120,
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 24,
  },
  contentSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: 'transparent',
    minHeight: 400,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  resultsContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  newQuestionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  newQuestionText: {
    ...typography.h4,
    color: colors.white,
  },
  dashboardTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  dashboardTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dashboardTabActive: {
    borderBottomColor: colors.primary,
  },
  dashboardTabText: {
    ...typography.body,
    color: colors.textMuted,
  },
  dashboardTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  overviewContainer: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  featureCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  featureDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  featureButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  sectionContainer: {
    flex: 1,
  },
  inputSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  // Horizontal inputs used on wide screens
  horizontalInputsApp: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  leftColApp: {
    flex: 1.2,
  },
  rightColApp: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  orText: {
    textAlign: 'center',
    marginVertical: spacing.md,
    ...typography.body,
    color: colors.textMuted,
  },
  newContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  newContentButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  profileContainer: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: colors.white,
    padding: spacing.xl * 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  profileName: {
    ...typography.h1,
    marginTop: spacing.md,
  },
  profileRole: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  profileStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  profileStatValue: {
    ...typography.h1,
    color: colors.primary,
  },
  profileStatLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Horizontal tab styles for Quiz page
  horizontalTabsContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  horizontalTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  horizontalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
  },
  horizontalTabActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  horizontalTabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  horizontalTabTextActive: {
    color: colors.white,
  },
  horizontalTabContent: {
    padding: spacing.lg,
  },
});
