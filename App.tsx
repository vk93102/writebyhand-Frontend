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
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import PremiumGate from './src/components/PremiumGate';
import { AuthScreen } from './src/components/AuthScreen';
import { MainDashboard } from './src/components/MainDashboard';
import { TrendAnalysis } from './src/components/TrendAnalysis';
import { PreviousYearPapers } from './src/components/PreviousYearPapers';
import { ResetPasswordScreen } from './src/components/ResetPasswordScreen';
import { getUserCoins, getSubscriptionStatus } from './src/services/api';
import { isPremiumFeature, PREMIUM_FEATURES } from './src/config/premiumFeatures';
import { DailyQuizScreen } from './src/components/DailyQuizScreen';
import { PairQuizContainer } from './src/components/pair-quiz';
import { WithdrawalScreen } from './src/components/WithdrawalScreen';
import { WithdrawalSuccessScreen } from './src/components/WithdrawalSuccessScreen';
import { solveQuestionByText, solveQuestionByImage, checkHealth, generateFlashcards, generateStudyMaterial, summarizeYouTubeVideo, generatePredictedQuestions, setUserId, checkFeatureUsage, recordFeatureUsage, getUsageDashboard, generateFlashcardsFromImage, generateFlashcardsFromFile, generatePredictedQuestionsFromImage, generatePredictedQuestionsFromFile } from './src/services/api';
import { canAccessPremiumFeature, checkSubscriptionStatus, clearSubscriptionCache } from './src/services/subscriptionService';
import { generateMockTest } from './src/services/mockTestService';
import { generateQuiz, generateQuizFromImage, generateQuizFromYouTube } from './src/services/quiz';
import { colors, spacing, borderRadius, typography, shadows } from './src/styles/theme';
import { adsManager } from './src/services/ads/AdsManager';
import { PremiumProvider } from './src/context/PremiumContext';

type TabType = 'text' | 'image' | 'file';
type PageType = 'dashboard' | 'mock-test' | 'quiz' | 'flashcards' | 'ask' | 'predicted-questions' | /* 'youtube-summarizer' | */ 'pricing' | 'usage' | 'profile' | 'trends' | 'daily-quiz' | 'pair-quiz' | 'previous-papers' | 'withdrawal' | 'withdrawal-success';
type DashboardSection = 'overview' | 'quiz' | 'flashcards' | 'study-material';
type AppScreenType = 'auth' | 'landing' | 'main' | 'reset-password';

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
  { id: 'daily-quiz' as PageType, label: 'Play & Win', icon: 'emoji-events' },
  { id: 'mock-test' as PageType, label: 'Mock Test', icon: 'quiz' },
  { id: 'quiz' as PageType, label: 'Quiz', icon: 'school' },
  { id: 'pair-quiz' as PageType, label: 'Pair Quiz', icon: 'people' },
  { id: 'flashcards' as PageType, label: 'Flashcards', icon: 'style' },
  { id: 'ask' as PageType, label: 'Ask Question', icon: 'help' },
  { id: 'predicted-questions' as PageType, label: 'Predicted Questions', icon: 'psychology' },
  { id: 'previous-papers' as PageType, label: 'Previous Papers', icon: 'description' },
  { id: 'trends' as PageType, label: 'PYQ Features', icon: 'analytics' },
  { id: 'withdrawal' as PageType, label: 'Withdraw Coins', icon: 'account-balance-wallet' },
  { id: 'usage' as PageType, label: 'Usage Dashboard', icon: 'dashboard' },
  { id: 'profile' as PageType, label: 'Profile', icon: 'person' },
  { id: 'pricing' as PageType, label: 'Pricing', icon: 'local-offer' },
];

export default function App() {
  // Authentication State
  const [appScreen, setAppScreen] = useState<AppScreenType>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const [screenWidth, setScreenWidth] = useState(initialWidth);
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('daily-quiz');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>('overview');
  const [quizData, setQuizData] = useState<any>(null);
  const [mockTestData, setMockTestData] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [mockTestResults, setMockTestResults] = useState<any>(null);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [flashcardData, setFlashcardData] = useState<any>(null);
  const [studyMaterialData, setStudyMaterialData] = useState<any>(null);
  const [predictedQuestionsData, setPredictedQuestionsData] = useState<any>(null);
  const [youtubeSummaryData, setYoutubeSummaryData] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [mockTestLoading, setMockTestLoading] = useState(false);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [studyMaterialLoading, setStudyMaterialLoading] = useState(false);
  const [predictedQuestionsLoading, setPredictedQuestionsLoading] = useState(false);
  const [youtubeSummaryLoading, setYoutubeSummaryLoading] = useState(false);
  const [dailyQuizCount, setDailyQuizCount] = useState(0);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [withdrawalSuccessData, setWithdrawalSuccessData] = useState<{
    withdrawalId: string;
    amount: string;
    coinsDeducted: number;
    remainingCoins: number;
  } | null>(null);

  // Authentication Handlers
  const handleAuthSuccess = async (userInfo: User) => {
    setUser(userInfo);
    // Set user ID in API service to auto-inject X-User-ID header
    // Ensure userId is always a string
    await setUserId(String(userInfo.id));
    setAppScreen('main');
    setShowLanding(false);
    setCurrentPage('daily-quiz');
    
    // Check premium status and setup periodic refresh
    checkPremiumStatus();
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
    setIsPremium(false);
    setAppScreen('landing');
    setShowLanding(true);
    setResults(null);
    setQuizData(null);
    setMockTestData(null);
    setQuizResults(null);
    setMockTestResults(null);
    setFlashcardData(null);
    setStudyMaterialData(null);
    setPredictedQuestionsData(null);
    setYoutubeSummaryData(null);
  };



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

  /**
   * Render a premium feature - shows PremiumGate if user is not premium
   */
  const RenderPremiumFeature = (featureId: string, component: React.ReactNode) => {
    if (isPremiumFeature(featureId) && !isPremium) {
      const featureInfo = PREMIUM_FEATURES[featureId as keyof typeof PREMIUM_FEATURES];
      return (
        <PremiumGate
          featureName={featureInfo?.name || 'Premium Feature'}
          description={featureInfo?.description || 'This feature is only available for premium users'}
          onUnlock={() => setCurrentPage('pricing')}
        >
          {component}
        </PremiumGate>
      );
    }
    return component;
  };

  /**
   * Check if a premium feature can be accessed
   */
  const checkPremiumStatus = async () => {
    try {
      if (user?.id) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ed-tech-backend-tzn8.onrender.com/api';
        console.log('[App] 🔍 Checking premium status for user:', user.id);
        
        const response = await fetch(`${apiUrl}/subscription/status/?user_id=${encodeURIComponent(user.id)}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-ID': String(user.id)
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[App] 📊 Subscription data received:', JSON.stringify(data, null, 2));
          
          // Production-level validation: check multiple conditions
          const isPremiumUser = (
            data.success === true &&
            data.is_paid === true && 
            data.subscription_active === true &&
            data.plan && 
            data.plan !== 'free' &&
            data.subscription_status === 'active'
          );
          
          console.log('[App] ✅ Premium Status Check:', {
            isPremium: isPremiumUser,
            is_paid: data.is_paid,
            subscription_active: data.subscription_active,
            plan: data.plan,
            status: data.subscription_status,
            is_trial: data.is_trial,
            next_billing: data.next_billing_date,
            days_remaining: data.days_until_next_billing
          });
          
          setIsPremium(isPremiumUser);
          setSubscriptionData(data);
          
          if (isPremiumUser) {
            console.log('[App] 🎉 User is PREMIUM! All features unlocked.');
            console.log(`[App] 📅 Plan: ${data.plan}, Trial: ${data.is_trial}, Next billing: ${data.next_billing_date}`);
          } else {
            console.log('[App] 🔒 User is FREE tier. Premium features locked.');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('[App] ❌ Subscription check failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          setIsPremium(false);
        }
      } else {
        console.log('[App] 👤 Guest user or no user ID - setting isPremium to false');
        setIsPremium(false);
      }
    } catch (error) {
      console.error('[App] ❌ Premium status check error:', error);
      setIsPremium(false);
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
      Alert.alert('Validation Error', 'Please enter a question');
      return;
    }

    if (question.trim().length < 3) {
      Alert.alert('Validation Error', 'Question must be at least 3 characters long');
      return;
    }

    if (question.trim().length > 5000) {
      Alert.alert('Validation Error', 'Question must not exceed 5000 characters');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      console.log('[App] 🔍 User submitted text question:', question.trim().substring(0, 50), '...');
      
      const response = await solveQuestionByText(question);

      if (!response || !response.success) {
        throw new Error(response?.message || 'No response from server');
      }

      console.log('[App] ✅ Received solution:', response.solution?.substring(0, 100), '...');
      
      setResults(response);
      setLoading(false);

      // Show ad for free users after text question is solved
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[AskQuestion] Text ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage = error?.message || error || 'Failed to solve question';
      console.error('[App] ❌ Error solving question:', errorMessage);

      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'Try Again', onPress: () => {} },
          { text: 'Cancel', onPress: () => setLoading(false) }
        ]
      );

      setLoading(false);
    }
  };

  const handleImageSubmit = async (imageUri: string) => {
    if (!imageUri || !imageUri.trim()) {
      Alert.alert('Validation Error', 'Please select an image');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      console.log('[App] 🖼️ User submitted image:', imageUri.substring(0, 50), '...');

      const response = await solveQuestionByImage(imageUri);

      if (!response || !response.success) {
        throw new Error(response?.message || 'No response from server');
      }

      console.log('[App] ✅ Received image solution:', response.solution?.substring(0, 100), '...');

      setResults(response);
      setLoading(false);

      // Show ad for free users after image question is solved
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[AskQuestion] Image ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage = error?.message || error || 'Failed to process image';
      console.error('[App] ❌ Error solving image question:', errorMessage);

      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'Try Again', onPress: () => {} },
          { text: 'Cancel', onPress: () => setLoading(false) }
        ]
      );

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
      const userId = user?.id || 'guest_user';
      
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[Quiz] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Quiz generation is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setQuizLoading(false);
        return;
      }

      // Check feature usage before generating
      console.log('[Quiz] Checking feature usage for:', topic);
      // COMMENTED OUT: Let backend handle feature usage validation
      // let usageCheck: any = null;
      // try {
      //   usageCheck = await checkFeatureUsage('quiz');
      //   console.log('[Quiz] Usage check response:', usageCheck);
      // } catch (usageError: any) {
      //   console.warn('[Quiz] Usage check failed (continuing anyway):', usageError.message);
      //   usageCheck = { allowed: true };
      // }
      // if (usageCheck && (usageCheck.allowed === false || usageCheck.success === false)) {
      //   const message = usageCheck.error || 'You have reached your monthly limit for quizzes. Please upgrade to continue.';
      //   Alert.alert('Feature Limit Reached', message);
      //   setQuizLoading(false);
      //   return;
      // }

      console.log(`[Quiz] Feature usage allowed, calling endpoint: POST /api/quiz/generate/ with payload:`, { topic, num_questions: numQuestions, difficulty });
      
      // Call the quiz service endpoint with correct parameters
      const response = await generateQuiz(
        { topic },
        userId,
        numQuestions,
        difficulty as 'easy' | 'medium' | 'hard'
      );
      
      console.log('[Quiz] API Response received:', response);

      // Extract quiz data from response
      // Backend returns: { success, data: {title, topic, difficulty, questions}, questions }
      const quizDataToSet = {
        title: response?.data?.title || `Quiz: ${topic}`,
        topic: response?.data?.topic || topic,
        difficulty: difficulty,
        questions: response?.questions || response?.data?.questions || [],
      };

      console.log('[Quiz] Generated', quizDataToSet.questions.length, 'questions');
      
      // Record feature usage after successful generation (don't block on this)
      console.log('[Quiz] Recording feature usage...');
      try {
        await recordFeatureUsage('quiz', topic.length, 'text', {
          num_questions: numQuestions,
          difficulty: difficulty,
          question_count: quizDataToSet.questions.length,
        });
        console.log('[Quiz] Usage recorded successfully');
      } catch (recordError) {
        console.warn('[Quiz] Failed to record usage (non-critical):', recordError);
      }

      setQuizData(quizDataToSet);
      setQuizLoading(false);

      // Show ad for free users after text quiz generation
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[Quiz] Text ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      console.error('[Quiz] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        endpoint: 'POST /quiz/generate/',
        stack: error.stack,
      });
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else if (status === 401) {
        Alert.alert('Unauthorized', 'Please login to generate quizzes');
      } else {
        Alert.alert('Error', error.message || 'Failed to generate quiz');
      }
      setQuizLoading(false);
    }
  };

  // Helper function to extract text content from file
  const extractFileContent = async (file: any): Promise<string> => {
    try {
      const fileName = file.file?.name || file.name || 'document';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      // Check if it's a binary file (image)
      const isBinaryFile = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension || '');
      
      if (file.file && typeof file.file === 'object' && file.file.constructor.name === 'File') {
        // For binary files on web, return a descriptive text instead of raw binary
        if (isBinaryFile) {
          return `[Image File Content]\nFilename: ${fileName}\nFile Type: ${file.mimeType || 'image'}\n\nThis appears to be an image file. Please provide study material as text documents (PDF, TXT, MD) for better results.`;
        }
        
        // For text files, read as text
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve(content || '');
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file.file);
        });
      }

      // For native platforms - try to read from URI
      if (file.uri) {
        try {
          // For images, we'll create a descriptive text
          if (isBinaryFile) {
            return `[Image File Content]\nFilename: ${fileName}\nFile Type: ${file.mimeType || 'image'}\n\nThis appears to be an image file. Please provide study material as text documents (PDF, TXT, MD) for better results.`;
          }

          // For PDF files
          if (fileExtension === 'pdf') {
            return `[PDF Document]\nFilename: ${fileName}\nSize: ${file.size} bytes\n\nNote: For better results, please use text-based documents (TXT, MD) or ensure your PDF contains extractable text.`;
          }

          // For text files, fetch and read
          const fileResponse = await fetch(file.uri);
          const blob = await fileResponse.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result as string;
              resolve(content || '');
            };
            reader.onerror = () => reject(new Error('Failed to read file content'));
            reader.readAsText(blob);
          });
        } catch (fetchError) {
          console.error('[Quiz] Error fetching file from URI:', fetchError);
          throw new Error('Failed to read file from device');
        }
      }

      return '';
    } catch (error) {
      console.error('[Quiz] Error extracting file content:', error);
      throw error;
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
      const userId = user?.id || 'guest_user';
      
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[Quiz] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Quiz generation is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setQuizLoading(false);
        return;
      }

      const file = files[0];
      console.log('[Quiz] Starting file upload process:', { name: file.name, size: file.size, type: file.mimeType });

      // Extract content from file
      const fileContent = await extractFileContent(file);
      
      if (!fileContent || fileContent.trim().length === 0) {
        Alert.alert('Error', 'File content is empty or could not be read');
        setQuizLoading(false);
        return;
      }

      console.log(`[Quiz] Generating quiz from file: "${file.name}" (${fileContent.length} characters) with ${numQuestions} questions`);
      
      // Use generateQuiz with file content as document
      const response = await generateQuiz(
        { document: fileContent },
        userId,
        numQuestions,
        difficulty as 'easy' | 'medium' | 'hard'
      );

      console.log('[Quiz] File upload response:', response);

      const quizDataToSet = {
        title: response?.data?.title || `Quiz from ${file.name}`,
        topic: response?.data?.topic || file.name || 'Document',
        difficulty: difficulty,
        questions: response?.questions || response?.data?.questions || [],
      };

      console.log('[Quiz] Setting quiz data from file:', quizDataToSet);
      setQuizData(quizDataToSet);
      setQuizLoading(false);

      // Show ad for free users after file quiz generation
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[Quiz] File ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      console.error('[Quiz] Error generating quiz from file:', error);
      Alert.alert('Error', error.message || 'Failed to generate quiz from file');
      setQuizLoading(false);
    }
  };

  const handleGenerateQuizFromImage = async (imageUri: string, numQuestions: number = 5, difficulty: string = 'medium') => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    setQuizLoading(true);
    setQuizData(null);

    try {
      const userId = user?.id || 'guest_user';
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Quiz generation is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setQuizLoading(false);
        return;
      }

      // Check feature usage before generating
      console.log('[Quiz] Checking feature usage...');
      // COMMENTED OUT: Let backend handle feature usage validation
      // const usageCheck = await checkFeatureUsage('quiz');
      // if (!usageCheck.success || !usageCheck.allowed) {
      //   const message = usageCheck.error || 'You have reached your monthly limit for quizzes. Please upgrade to continue.';
      //   Alert.alert('Feature Limit Reached', message);
      //   setQuizLoading(false);
      //   return;
      // }

      console.log('[Quiz] Feature usage allowed, processing image with OCR...');
      
      // Generate quiz from image using OCR
      const response = await generateQuizFromImage(
        imageUri,
        numQuestions,
        difficulty as 'easy' | 'medium' | 'hard'
      );
      
      // Record feature usage after successful generation
      console.log('[Quiz] Recording feature usage...');
      await recordFeatureUsage('quiz', 500, 'image', {
        num_questions: numQuestions,
        difficulty: difficulty,
        question_count: response?.questions?.length || 0,
      });

      const quizDataToSet = {
        title: response?.data?.title || 'Quiz from Image',
        topic: response?.data?.topic || 'OCR Image',
        difficulty: difficulty,
        questions: response?.questions || response?.data?.questions || [],
      };

      setQuizData(quizDataToSet);
      setQuizLoading(false);

      // Show ad for free users after image quiz generation
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[Quiz] Image ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      console.error('[Quiz] Error generating quiz from image:', error);
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', error.message || 'Failed to generate quiz from image');
      }
      setQuizLoading(false);
    }
  };

  const handleGenerateFlashcards = async (topic: string, numCards: number = 5) => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    setFlashcardLoading(true);
    setFlashcardData(null);

    try {
      const userId = user?.id || 'guest_user';
      
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[Flashcards] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Flashcard generation is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setFlashcardLoading(false);
        return;
      }

      // Check feature usage before generating
      console.log('[Flashcards] Checking feature usage for:', topic);
      // COMMENTED OUT: Let backend handle feature usage validation
      // let usageCheck: any = null;
      // try {
      //   usageCheck = await checkFeatureUsage('flashcards');
      //   console.log('[Flashcards] Usage check response:', usageCheck);
      // } catch (usageError: any) {
      //   console.warn('[Flashcards] Usage check failed (continuing anyway):', usageError.message);
      //   usageCheck = { allowed: true };
      // }
      // if (usageCheck && (usageCheck.allowed === false || usageCheck.success === false)) {
      //   const message = usageCheck.error || 'You have reached your monthly limit for flashcards. Please upgrade to continue.';
      //   Alert.alert('Feature Limit Reached', message);
      //   setFlashcardLoading(false);
      //   return;
      // }

      console.log(`[Flashcards] Feature usage allowed, calling endpoint: POST /api/flashcards/generate/ with payload:`, { topic, num_cards: numCards, language: 'english', difficulty: 'medium' });

      // Use default language (english) and difficulty (medium) from API
      const response = await generateFlashcards(topic, numCards, 'english', 'medium');
      console.log('[Flashcards] API Response received:', response);
      
      if (!response) {
        throw new Error('No response received from flashcard generation');
      }

      // Record feature usage after successful generation (don't block on this)
      console.log('[Flashcards] Recording feature usage...');
      try {
        await recordFeatureUsage('flashcards', topic.length, 'text', {
          num_cards: numCards,
          language: 'english',
          difficulty: 'medium',
        });
        console.log('[Flashcards] Usage recorded successfully');
      } catch (recordError) {
        console.warn('[Flashcards] Failed to record usage (non-critical):', recordError);
      }

      console.log('[Flashcards] Setting flashcard data with', response?.cards?.length || 0, 'cards');
      setFlashcardData(response);
      setFlashcardLoading(false);
      
      // Show Unity ad after flashcard generation (free users only)
      if (!isPremium) {
        console.log('[Flashcards] Showing ad after flashcard generation');
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[Flashcards] Ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      console.error('[Flashcards] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
      });
      
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
      const userId = user?.id || 'guest_user';
      
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[Flashcards] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Flashcard generation is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setFlashcardLoading(false);
        return;
      }

      // Check feature usage before generating
      console.log('[Flashcards] Checking feature usage...');
      // COMMENTED OUT: Let backend handle feature usage validation
      // const usageCheck = await checkFeatureUsage('flashcards');
      // if (!usageCheck.success || !usageCheck.allowed) {
      //   const message = usageCheck.error || 'You have reached your monthly limit for flashcards. Please upgrade to continue.';
      //   Alert.alert('Feature Limit Reached', message);
      //   setFlashcardLoading(false);
      //   return;
      // }

      console.log('[Flashcards] Feature usage allowed, processing image with OCR...');
      
      // Generate flashcards from image using OCR
      const response = await generateFlashcardsFromImage(imageUri, 5, 'english', 'medium');
      
      // Record feature usage after successful generation
      console.log('[Flashcards] Recording feature usage...');
      await recordFeatureUsage('flashcards', 500, 'image', {
        source: 'ocr_image',
        ocr_confidence: response.ocrConfidence,
      });

      setFlashcardData(response);
      setFlashcardLoading(false);
      
      // Show Unity ad after image flashcard generation (free users only)
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[Flashcards/Image] Ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      console.error('[Flashcards] Error generating from image:', error);
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

  const handleGenerateFlashcardsFromFile = async (files: any[], numCards: number = 5) => {
    if (!files || files.length === 0) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    
    setFlashcardLoading(true);
    setFlashcardData(null);

    try {
      const userId = user?.id || 'guest_user';
      
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[Flashcards] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Flashcard generation is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setFlashcardLoading(false);
        return;
      }
      
      console.log('[Flashcards] Starting file-based generation with', files.length, 'file(s)');
      
      // Check feature usage
      // COMMENTED OUT: Let backend handle feature usage validation
      // const usageCheck = await checkFeatureUsage('flashcards');
      // if (!usageCheck.allowed) {
      //   Alert.alert('Feature Limit Reached', usageCheck.error || 'You have reached the limit for generating flashcards');
      //   setFlashcardLoading(false);
      //   return;
      // }

      // Process file through document endpoint
      const response = await generateFlashcardsFromFile(files[0], numCards, 'english', 'medium');
      
      console.log('[Flashcards] File processing successful, cards generated:', response?.data?.length || 0);

      // Record usage with document metadata
      await recordFeatureUsage('flashcards', 500, 'file', {
        source: response.source || 'document',
        file_type: files[0]?.type || 'unknown',
        card_count: response?.data?.length || numCards,
      });

      setFlashcardData(response);
      setFlashcardLoading(false);

      // Show ad for free users after file flashcard generation
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[Flashcards] File ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      console.error('[Flashcards] Error generating from file:', error);
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else if (status === 401) {
        Alert.alert('Unauthorized', 'Please login to generate flashcards from files');
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

      // Show ad for free users after study material generation
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[StudyMaterial] Ad display failed:', err));
        }, 1500);
      }
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

      // Show ad for free users after file study material generation
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[StudyMaterial] File ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate study material from file');
      setStudyMaterialLoading(false);
    }
  };

  const handleGeneratePredictedQuestions = async (topic: string, examType: string = 'medium') => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic or subject');
      return;
    }

    // Get userId from user state
    const userId = user?.id || 'guest_user';

    setPredictedQuestionsLoading(true);
    setPredictedQuestionsData(null);

    try {
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[PredictedQuestions] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Predicted Questions is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setPredictedQuestionsLoading(false);
        return;
      }
      
      console.log('[PredictedQuestions] Starting text-based generation for topic:', topic);
      
      // Check feature usage before generating
      // COMMENTED OUT: Let backend handle feature usage validation
      // const usageCheck = await checkFeatureUsage('predicted-questions');
      // if (!usageCheck.allowed) {
      //   Alert.alert('Feature Limit Reached', usageCheck.error || 'You have reached the limit for generating predicted questions');
      //   setPredictedQuestionsLoading(false);
      //   return;
      // }

      // Generate predicted questions
      const response = await generatePredictedQuestions(topic, userId, examType, 3);
      console.log('[PredictedQuestions] Text-based generation successful, questions generated:', response?.questions?.length || 0);
      
      // Record usage after successful generation
      await recordFeatureUsage('predicted-questions', 500, 'text', {
        source: 'text_input',
        exam_type: examType,
        question_count: response?.questions?.length || 3,
      });

      setPredictedQuestionsData(response);
      setPredictedQuestionsLoading(false);
      
      // Show Unity ad after predicted questions generation (free users only)
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[PredictedQuestions] Ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      console.error('[PredictedQuestions] Error generating from text:', error);
      // Show backend details if available
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message || 'Failed to generate predicted questions';
      const details = error.response?.data?.details;
      
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else if (status === 401) {
        Alert.alert('Unauthorized', 'Please login to generate predicted questions');
      } else {
        Alert.alert('Error', message, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      }
      setPredictedQuestionsLoading(false);
    }
  };

  const handleGeneratePredictedQuestionsFromImage = async (imageUri: string) => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    setPredictedQuestionsLoading(true);
    setPredictedQuestionsData(null);

    try {
      const userId = user?.id || 'guest_user';
      
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[PredictedQuestions] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Predicted Questions is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setPredictedQuestionsLoading(false);
        return;
      }
      
      console.log('[PredictedQuestions] Starting image-based generation from:', imageUri.substring(0, 50) + '...');
      
      // Check feature usage
      // COMMENTED OUT: Let backend handle feature usage validation
      // const usageCheck = await checkFeatureUsage('predicted-questions');
      // if (!usageCheck.allowed) {
      //   Alert.alert('Feature Limit Reached', usageCheck.error || 'You have reached the limit for generating predicted questions');
      //   setPredictedQuestionsLoading(false);
      //   return;
      // }

      // Process image through OCR endpoint
      const response = await generatePredictedQuestionsFromImage(imageUri, userId, 'General', 3);
      
      console.log('[PredictedQuestions] Image processing successful, questions generated:', response?.questions?.length || 0);
      console.log('[PredictedQuestions] Response data:', response);

      // Record usage with image/OCR metadata
      await recordFeatureUsage('predicted-questions', 500, 'image', {
        source: 'ocr_image',
        ocr_confidence: response?.ocr_confidence || 0,
        question_count: response?.questions?.length || 3,
      });

      setPredictedQuestionsData(response);
      setPredictedQuestionsLoading(false);
    } catch (error: any) {
      console.error('[PredictedQuestions] Error generating from image:', error);
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else if (status === 401) {
        Alert.alert('Unauthorized', 'Please login to generate predicted questions from images');
      } else {
        Alert.alert('Error', error.message || 'Failed to generate predicted questions from image');
      }
      setPredictedQuestionsLoading(false);
    }
  };

  const handleGeneratePredictedQuestionsFromFile = async (files: any[], examType: string = 'medium') => {
    if (!files || files.length === 0) {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    
    setPredictedQuestionsLoading(true);
    setPredictedQuestionsData(null);

    try {
      const userId = user?.id || 'guest_user';
      
      // CRITICAL: Check subscription before allowing access to premium feature
      // console.log('[PredictedQuestions] Checking subscription status for user:', userId);
      const hasSubscription = await canAccessPremiumFeature(userId);
      
      if (!hasSubscription) {
        Alert.alert(
          'Premium Feature',
          'Predicted Questions is a premium feature. Please subscribe to access it.',
          [
            { text: 'View Plans', onPress: () => setCurrentPage('pricing') },
            { text: 'Cancel', onPress: () => {} },
          ]
        );
        setPredictedQuestionsLoading(false);
        return;
      }
      
      console.log('[PredictedQuestions] Starting file-based generation with', files.length, 'file(s)');
      
      // Check feature usage
      // COMMENTED OUT: Let backend handle feature usage validation
      // const usageCheck = await checkFeatureUsage('predicted-questions');
      // if (!usageCheck.allowed) {
      //   Alert.alert('Feature Limit Reached', usageCheck.error || 'You have reached the limit for generating predicted questions');
      //   setPredictedQuestionsLoading(false);
      //   return;
      // }

      // Process file through document endpoint
      const response = await generatePredictedQuestionsFromFile(files[0], userId, examType, 3);
      
      console.log('[PredictedQuestions] File processing successful, questions generated:', response?.questions?.length || 0);

      // Record usage with document metadata
      await recordFeatureUsage('predicted-questions', 500, 'file', {
        source: response?.source || 'document',
        file_type: files[0]?.type || 'unknown',
        question_count: response?.questions?.length || 3,
      });

      setPredictedQuestionsData(response);
      setPredictedQuestionsLoading(false);
    } catch (error: any) {
      console.error('[PredictedQuestions] Error generating from file:', error);
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data?.error;
      if (status === 429) {
        const retrySeconds = error.response?.headers?.['retry-after'];
        const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
        Alert.alert('Quota Exceeded', msg, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      } else if (status === 401) {
        Alert.alert('Unauthorized', 'Please login to generate predicted questions from files');
      } else {
        Alert.alert('Error', error.message || 'Failed to generate predicted questions from file');
      }
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
      
      // Show Unity ad after YouTube video summarization (free users only)
      if (!isPremium) {
        setTimeout(() => {
          adsManager.showAd().catch(err => console.log('[YouTube] Ad display failed:', err));
        }, 1500);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to summarize YouTube video';
      const details = error.response?.data?.details;
      Alert.alert('Error', message, details ? [{ text: 'Details', onPress: () => Alert.alert('Details', String(details)) }, { text: 'OK' }] : [{ text: 'OK' }]);
      setYoutubeSummaryLoading(false);
    }
  };

  const handleStartQuiz = (config: any) => {
    try {
      setMockTestLoading(true);
      setMockTestData(null);

      // Generate mock test from local JSON files with random question selection
      const mockTest = generateMockTest({
        subject: config.subject,
        topics: config.topics || [],
        difficulty: config.difficulty || 'medium',
        examLevel: config.examLevel || 'jee-mains',
        timeLimit: config.timeLimit || 0,
        numQuestions: config.numQuestions || 20,
      });

      setMockTestData(mockTest);
      setMockTestLoading(false);
      
      // Increment Play & Win count for free users
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

  // Initialize health check and coin loading after all functions are defined
  useEffect(() => {
    // Debug: Check if Gemini API key is loaded
    const geminiKey = typeof process !== 'undefined' && process.env ? process.env.EXPO_PUBLIC_GEMINI_API_KEY : undefined;
    console.log('[App] Gemini API Key Status:', geminiKey ? '✅ Loaded' : '❌ NOT FOUND');
    if (geminiKey) {
      console.log('[App] API Key (first 20 chars):', geminiKey.substring(0, 20) + '...');
    }
    
    checkApiHealth();
    loadUserCoins();
  }, []);

  useEffect(() => {
    // Refresh coins when user changes (login/logout)
    if (user?.id) {
      loadUserCoins();
      loadSubscriptionStatus();
      // Immediately check premium status on user change
      checkPremiumStatus();
    }
  }, [user]);

  // Periodic premium status refresh (every 5 minutes)
  useEffect(() => {
    if (!user?.id) return;
    
    // Set up interval to refresh premium status
    const premiumStatusInterval = setInterval(() => {
      console.log('[App] 🔄 Periodic premium status refresh');
      checkPremiumStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(premiumStatusInterval);
  }, [user?.id]);

  useEffect(() => {
    // Monitor premium status changes and provide feedback
    if (isPremium) {
      console.log('[App] 🎉🎉🎉 PREMIUM STATUS ACTIVE - All features unlocked!');
    } else {
      console.log('[App] 🔒 Free user - Premium features locked');
    }
  }, [isPremium]);

  const renderMainContent = () => {
    return (
      <View style={styles.mainContent}>
        {/* Top navbar for smaller screens */}
        <View style={[styles.topBar, styles.pageHeader]}>
          <View style={styles.topLeft}>
            {screenWidth <= 767 && (
              <TouchableOpacity onPress={() => toggleDrawer(true)} style={styles.hamburger}>
                <MaterialIcons name="menu" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Always show compact right-side: coins only */}
          <View style={styles.topRightCompact}>
            <TouchableOpacity 
              onPress={() => setCurrentPage('withdrawal')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'transparent', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border }}
            >
              <Image source={require('./assets/coins.png')} style={{ width: 20, height: 20 }} />
              <Text style={{ color: colors.text, fontWeight: '700' }}>{userCoins}</Text>
            </TouchableOpacity>
          </View>

          {/* Header content */}
          <View style={styles.headerLeft}>
            <MaterialIcons name="school" size={28} color={colors.primary} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.pageTitle}>Brain Pay</Text>
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
                      onSubmit={(topic: string) => handleGenerateFlashcards(topic, 10)} 
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
              {!mockTestData && !mockTestLoading && (
                <QuizSelector 
                  onStartQuiz={handleStartQuiz} 
                  onClose={() => setCurrentPage('ask')} 
                  userCoins={0}
                  isPremium={false}
                  dailyQuizCount={dailyQuizCount}
                  quizType="mock-test"
                />
              )}
              {(mockTestData || mockTestLoading) && (
                <Quiz quizData={mockTestData} loading={mockTestLoading} />
              )}
              {mockTestData && (
                <TouchableOpacity 
                  style={styles.newContentButton}
                  onPress={() => setMockTestData(null)}
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
                      style={[styles.horizontalTab, activeTab === 'file' && styles.horizontalTabActive]}
                      onPress={() => setActiveTab('file')}
                    >
                      <MaterialIcons 
                        name="upload-file" 
                        size={20} 
                        color={activeTab === 'file' ? colors.white : colors.textMuted} 
                      />
                      <Text style={[styles.horizontalTabText, activeTab === 'file' && styles.horizontalTabTextActive]}>
                        Document Upload
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.horizontalTabContent}>
                    {activeTab === 'text' ? (
                      <TextInputComponent 
                        onSubmit={(text: string) => handleGenerateQuiz(text, 10, 'medium')} 
                        loading={quizLoading}
                        placeholder="Paste your study material, notes, or topic content here..."
                      />
                    ) : (
                      <FileUpload
                        onSubmit={(file) => handleGenerateQuizFromFile(file, 10, 'medium')}
                        loading={quizLoading}
                        placeholder="Upload PDF, TXT, or Document to generate quiz"
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
                    onFileSubmit={(files) => handleGenerateFlashcardsFromFile(files, 10)}
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
                    onFileSubmit={(files) => handleGenerateFlashcardsFromFile(files, 10)}
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
                    onImageSubmit={handleGeneratePredictedQuestionsFromImage}
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
      ) : /* youtube-summarizer disabled
      currentPage === 'youtube-summarizer' ? (
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
      ) : */ currentPage === 'ask' ? (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.askQuestionContainer}>
              {/* Header Section */}
              <View style={styles.askQuestionHeader}>
                <MaterialIcons name="help-outline" size={48} color={colors.primary} />
                <Text style={styles.askQuestionTitle}>Ask Any Question</Text>
                <Text style={styles.askQuestionSubtitle}>
                  Get the predictions of concepts with explanations and questions on those concepts
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
            onPremiumUnlocked={() => {
              console.log('[App] Premium status unlocked via payment - refreshing...');
              checkPremiumStatus();
            }}
            usage={subscriptionData?.usage}
            limits={subscriptionData?.limits}
          />
        </View>
      ) : currentPage === 'profile' ? (
        <RenderProfilePage
          userId={user?.id || 'guest'}
          userName={user?.name || 'User'}
          userEmail={user?.email || 'user@example.com'}
          onNavigateToPricing={() => setCurrentPage('pricing')}
          onLogout={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: () => handleLogout(),
              },
            ]);
          }}
          onBack={() => setCurrentPage('dashboard')}
        />
      ) : currentPage === 'pair-quiz' ? (
        <View style={{ flex: 1 }}>
          <PairQuizContainer onExit={() => setCurrentPage('ask')} />
        </View>
      ) : currentPage === 'daily-quiz' ? (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.featurePageContainer}>
              <DailyQuizScreen
                userId={String(user?.id || 'guest')}
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
            onWithdrawalSuccess={(data) => {
              setWithdrawalSuccessData(data);
              setCurrentPage('withdrawal-success');
              loadUserCoins();
            }}
          />
        </View>
      ) : currentPage === 'withdrawal-success' ? (
        <View style={{ flex: 1 }}>
          {withdrawalSuccessData && (
            <WithdrawalSuccessScreen
              withdrawalData={withdrawalSuccessData}
              onClose={() => {
                setCurrentPage('ask');
                setWithdrawalSuccessData(null);
              }}
              onGoToDashboard={() => {
                setCurrentPage('dashboard');
                setWithdrawalSuccessData(null);
              }}
            />
          )}
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
  }

  const showSidebar = isWeb && screenWidth >= 768;

  // Render Reset Password Screen
  if (appScreen === 'reset-password') {
    return (
      <PremiumProvider userId={user?.id || 'guest'}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <ResetPasswordScreen 
              onClose={() => setAppScreen('auth')}
              onBackToLogin={() => setAppScreen('auth')}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </PremiumProvider>
    );
  }

  // Render Auth Screen
  if (!user) {
    return (
      <PremiumProvider userId="guest">
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <AuthScreen 
              onAuthSuccess={handleAuthSuccess}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </PremiumProvider>
    );
  }

  // Render Main App with user logged in
  return (
    <PremiumProvider userId={String(user?.id || 'guest')}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
          
          {showSidebar ? (
            <View style={styles.layoutWithSidebar}>
              {renderSidebarWithLogout()}
              {renderMainContent()}
            </View>
          ) : (
            renderMainContent()
          )}

          {/* Mobile Drawer Portal - Rendered Absolutely on Top */}
          {!showSidebar && drawerOpen && (
            <View style={styles.drawerPortal}>
              {/* Overlay Backdrop */}
              <TouchableOpacity 
                style={styles.drawerOverlay} 
                activeOpacity={0.9} 
                onPress={() => toggleDrawer(false)} 
              />
              
              {/* Drawer Menu */}
              {renderSidebarWithLogout(true)}
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </PremiumProvider>
  );

  function renderSidebarWithLogout(isDrawer = false) {
    // compute sidebar width for different breakpoints
    const isMobileScreen = screenWidth < 768;
    const sidebarWidth = isMobileScreen ? screenWidth * 0.85 : (screenWidth >= 1280 ? 240 : 200);
    
    return (
      <View style={isDrawer ? styles.sidebarDrawer : [styles.sidebar, { width: sidebarWidth }]}>
        {/* User Profile Section */}
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <MaterialIcons name="account-circle" size={64} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>{user?.provider === 'google' ? 'Google User' : 'Learner'}</Text>
        </View>

        {/* Navigation Items - ScrollView */}
        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          {navItems.map((item) => {
            const isPremium_Feature = isPremiumFeature(item.id);
            const isAccessible = !isPremium_Feature || isPremium;
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  currentPage === item.id && styles.navItemActive,
                  !isAccessible && { opacity: 0.6 }
                ]}
                onPress={() => {
                  if (!isAccessible) {
                    // Premium feature - navigate to pricing
                    setCurrentPage('pricing');
                    if (screenWidth < 768) {
                      toggleDrawer(false);
                    }
                  } else {
                    setCurrentPage(item.id);
                    // Close drawer on mobile after selection
                    if (screenWidth < 768) {
                      toggleDrawer(false);
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={{ position: 'relative' }}>
                  <MaterialIcons 
                    name={item.icon as any} 
                    size={20} 
                    color={currentPage === item.id ? colors.primary : colors.textMuted} 
                  />
                  {isPremium_Feature && !isPremium && (
                    <View style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: colors.error,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.white
                    }}>
                      <MaterialIcons name="lock" size={9} color={colors.white} />
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.navText,
                  currentPage === item.id && styles.navTextActive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Logout Button - Footer */}
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

// Profile Page Component
interface RenderProfilePageProps {
  userId: string;
  userName: string;
  userEmail: string;
  onNavigateToPricing: () => void;
  onLogout: () => void;
  onBack?: () => void;
}

function RenderProfilePage({
  userId,
  userName,
  userEmail,
  onNavigateToPricing,
  onLogout,
  onBack,
}: RenderProfilePageProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
    // Refresh every 3 seconds to catch subscription updates
    const interval = setInterval(loadSubscriptionStatus, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadSubscriptionStatus = async () => {
    try {
      if (userId === 'guest' || userId === 'guest_' + Date.now()) {
        setIsPremium(false);
        setLoading(false);
        return;
      }
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ed-tech-backend-tzn8.onrender.com/api';
      const response = await fetch(`${apiUrl}/subscription/status/?user_id=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns: {success, user_id, plan, is_paid, subscription_active, subscription_status, ...}
        // Premium if is_paid=true AND plan is premium (not free)
        const isPremiumUser = data.is_paid === true && data.plan && data.plan !== 'free';
        setIsPremium(isPremiumUser);
      } else {
        setIsPremium(false);
      }
    } catch (error) {
      console.error('[ProfilePage] Subscription status check error:', error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: typography.h2.fontSize, fontWeight: '700' as const, color: colors.text }}>
            My Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Section with Avatar */}
        <View style={{ backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.sm, alignItems: 'center' }}>
          {/* Avatar with Lock Badge - Relative positioned container */}
          <View style={{ position: 'relative', width: 120, height: 120, marginBottom: spacing.lg }}>
            {/* Avatar Circle */}
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="person" size={50} color={colors.white} />
            </View>
            
            {/* Lock Badge - Red for free users */}
            {!isPremium && (
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.white, ...shadows.md }}>
                <MaterialIcons name="lock" size={18} color={colors.white} />
              </View>
            )}

            {/* Premium Badge - Green checkmark for premium users */}
            {isPremium && (
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.white, ...shadows.md }}>
                <MaterialIcons name="check" size={18} color={colors.white} />
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Text style={{ fontSize: typography.h3.fontSize, fontWeight: '600' as const, color: colors.text, marginBottom: spacing.xs }}>
              {userName}
            </Text>
            <Text style={{ fontSize: typography.body.fontSize, fontWeight: '400' as const, color: colors.textMuted, marginBottom: spacing.md }}>
              {userEmail}
            </Text>
            <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: isPremium ? '#E5F5E5' : '#FFE5E5' }}>
              <MaterialIcons name={isPremium ? 'verified' : 'trending-up'} size={16} color={isPremium ? colors.success : colors.error} />
              <Text style={{ fontSize: 12, fontWeight: '600' as const, color: isPremium ? colors.success : colors.error }}>
                {isPremium ? 'Premium Member' : 'Free User'}
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade Card (Free Users Only) */}
        {!isPremium && (
          <View style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginVertical: spacing.md, ...shadows.md }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
              <MaterialIcons name="lock" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontSize: typography.h3.fontSize, fontWeight: '600' as const, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' }}>
              Premium Features Locked
            </Text>
            <Text style={{ fontSize: typography.body.fontSize, fontWeight: '400' as const, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center', lineHeight: 20 }}>
              Unlock all features and enjoy unlimited access to:
            </Text>

            {/* Features List */}
            <View style={{ width: '100%', marginVertical: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0' }}>
              {[
                { icon: 'psychology', text: 'AI-Powered Questions' },
                { icon: 'video-library', text: 'Video Summaries' },
                { icon: 'analytics', text: 'Advanced Analytics' },
                { icon: 'bolt', text: 'Priority Support' },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs }}>
                  <MaterialIcons name={item.icon as any} size={20} color={colors.success} />
                  <Text style={{ fontSize: typography.body.fontSize, fontWeight: '500' as const, color: colors.text }}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: typography.body.fontSize, fontWeight: '600' as const, color: colors.text, marginVertical: spacing.md, textAlign: 'center' }}>
              Subscribe to unlock all premium features
            </Text>

            <TouchableOpacity
              style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.md, width: '100%', ...shadows.md }}
              onPress={onNavigateToPricing}
              activeOpacity={0.7}
            >
              <MaterialIcons name="lock-open" size={20} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' as const }}>Subscribe Now</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 12, fontWeight: '400' as const, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }}>
              ₹1 first month, then ₹99/month • Cancel anytime
            </Text>
          </View>
        )}

        {/* Account Information */}
        <View style={{ marginVertical: spacing.lg, backgroundColor: colors.white, borderRadius: borderRadius.md, paddingVertical: spacing.md, ...shadows.sm }}>
          <Text style={{ fontSize: typography.h3.fontSize, fontWeight: '600' as const, color: colors.text, marginBottom: spacing.md, marginHorizontal: spacing.md }}>
            Account Information
          </Text>
          {[
            { icon: 'person', label: 'Name', value: userName },
            { icon: 'email', label: 'Email', value: userEmail },
            { icon: isPremium ? 'verified' : 'info', label: 'Status', value: isPremium ? 'Premium Member' : 'Free Member' },
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: idx < 2 ? 1 : 0, borderBottomColor: '#F0F0F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                <MaterialIcons name={item.icon as any} size={20} color={colors.primary} />
                <Text style={{ fontSize: typography.body.fontSize, fontWeight: '500' as const, color: colors.text }}>
                  {item.label}
                </Text>
              </View>
              <Text style={{ fontSize: typography.body.fontSize, fontWeight: '400' as const, color: item.label === 'Status' && isPremium ? colors.success : colors.textMuted }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Premium Benefits Section (Premium Users Only) */}
        {isPremium && (
          <View style={{ marginVertical: spacing.lg, backgroundColor: colors.white, borderRadius: borderRadius.md, paddingVertical: spacing.md, ...shadows.sm }}>
            <Text style={{ fontSize: typography.h3.fontSize, fontWeight: '600' as const, color: colors.text, marginBottom: spacing.md, marginHorizontal: spacing.md }}>
              Your Premium Benefits
            </Text>
            {[
              'Unlimited AI Questions',
              'All Video Summaries',
              'Full Analytics Access',
              'Priority Support',
              'Ad-free Experience',
            ].map((benefit, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: idx < 4 ? 1 : 0, borderBottomColor: '#F0F0F0' }}>
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text style={{ fontSize: typography.body.fontSize, fontWeight: '500' as const, color: colors.text }}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={{ backgroundColor: colors.error, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginVertical: spacing.lg, marginBottom: spacing.xl, ...shadows.md }}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={20} color={colors.white} />
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' as const }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
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
    paddingHorizontal: 12,
    paddingVertical: spacing.md,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userProfile: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: spacing.md,
  },
  avatar: {
    marginBottom: spacing.md,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userName: {
    ...typography.h4,
    marginBottom: spacing.xs,
    fontWeight: '700',
    color: '#111827',
    fontSize: 16,
  },
  userRole: {
    ...typography.small,
    color: '#6B7280',
    fontWeight: '500',
  },
  navMenu: {
    paddingRight: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  navItemActive: {
    backgroundColor: '#EEF2FF',
  },
  navText: {
    ...typography.body,
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
    flex: 1,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sidebarFooter: {
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
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
    backgroundColor: colors.error + '20',
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
    paddingHorizontal: 15,
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
  drawerPortal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 98,
    flexDirection: 'row',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 1,
  },
  sidebarDrawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 320,
    zIndex: 2,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: spacing.md,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: spacing.sm,
    marginTop: 20,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
