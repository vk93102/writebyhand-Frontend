import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { usePremium } from '../context/PremiumContext';
import PremiumGate from '../components/PremiumGate';

/**
 * Real-World Example: Quiz App with Premium Features
 * Shows how to integrate PremiumGate in a production app
 */

// 🎯 Component 1: Quiz Results (Premium Feature)
interface QuizResult {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  correctAnswers: number;
}

interface QuizResultsChartProps {
  results: QuizResult;
}

const QuizResultsChart: React.FC<QuizResultsChartProps> = ({ results }) => {
  const percentage = (results.correctAnswers / results.totalQuestions) * 100;

  return (
    <View style={styles.chartCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Quiz Results</Text>
        <Text style={styles.scoreText}>{percentage.toFixed(0)}%</Text>
      </View>

      <View style={styles.resultDetails}>
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Score</Text>
          <Text style={styles.resultValue}>
            {results.correctAnswers}/{results.totalQuestions}
          </Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Time</Text>
          <Text style={styles.resultValue}>{results.timeTaken}s</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Accuracy</Text>
          <Text style={styles.resultValue}>{percentage.toFixed(1)}%</Text>
        </View>
      </View>

      {/* Performance Gauge */}
      <View style={styles.gaugeContainer}>
        <View
          style={[
            styles.gauge,
            {
              width: `${percentage}%`,
              backgroundColor:
                percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444',
            },
          ]}
        />
      </View>

      {/* Feedback Message */}
      <Text style={styles.feedbackText}>
        {percentage >= 80
          ? '🎉 Excellent! Keep up the great work!'
          : percentage >= 60
          ? '😊 Good job! Review challenging topics.'
          : '💪 Keep practicing! You\'ll improve!'}
      </Text>
    </View>
  );
};

// 🎯 Component 2: Study Recommendations (Premium Feature)
interface RecommendationItem {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: number;
}

const SAMPLE_RECOMMENDATIONS: RecommendationItem[] = [
  { topic: 'Quadratic Equations', difficulty: 'Medium', estimatedTime: 30 },
  { topic: 'Polynomials', difficulty: 'Hard', estimatedTime: 45 },
  { topic: 'Geometry Basics', difficulty: 'Easy', estimatedTime: 20 },
];

const StudyRecommendations: React.FC = () => {
  return (
    <View style={styles.recommendationCard}>
      <Text style={styles.recommendationTitle}>📚 Personalized Study Plan</Text>

      {SAMPLE_RECOMMENDATIONS.map((rec, idx) => (
        <View key={idx} style={styles.recommendationItem}>
          <View style={styles.recommendationLeft}>
            <Text style={styles.recommendationTopic}>{rec.topic}</Text>
            <Text style={styles.recommendationMeta}>
              {rec.difficulty} • {rec.estimatedTime} min
            </Text>
          </View>
          <TouchableOpacity style={styles.recommendationButton}>
            <Text style={styles.recommendationButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.recommendationFooter}>
        AI-powered study plan tailored to your learning style
      </Text>
    </View>
  );
};

// 🎯 Component 3: Performance History (Premium Feature)
interface HistoryItem {
  date: string;
  quizName: string;
  score: number;
}

const SAMPLE_HISTORY: HistoryItem[] = [
  { date: 'Today', quizName: 'Algebra Basics', score: 85 },
  { date: 'Yesterday', quizName: 'Geometry', score: 72 },
  { date: '2 days ago', quizName: 'Calculus Intro', score: 91 },
];

const PerformanceHistory: React.FC = () => {
  return (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>📊 Performance History</Text>

      {SAMPLE_HISTORY.map((item, idx) => (
        <View key={idx} style={styles.historyItem}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyQuizName}>{item.quizName}</Text>
          </View>
          <View
            style={[
              styles.historyScore,
              {
                backgroundColor: item.score >= 80 ? '#D1FAE5' : '#FEF3C7',
              },
            ]}
          >
            <Text
              style={[
                styles.historyScoreText,
                {
                  color: item.score >= 80 ? '#047857' : '#92400E',
                },
              ]}
            >
              {item.score}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// 🎯 Main Screen: Real-World Quiz Results Page
export const RealWorldQuizResultsScreen: React.FC = () => {
  const { isPremium, unlockPremium, isLoading } = usePremium();
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Sample quiz result
  const quizResult: QuizResult = {
    score: 85,
    totalQuestions: 20,
    timeTaken: 320,
    correctAnswers: 17,
  };

  const handleUnlockPremium = async () => {
    try {
      setIsUnlocking(true);
      await unlockPremium();
      Alert.alert('Success', 'Premium unlocked! Enjoy all features.');
    } catch (error) {
      Alert.alert('Error', 'Failed to unlock. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz Complete! 🎉</Text>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>
            {isPremium ? '👑 Premium' : '🎓 Free'}
          </Text>
        </View>
      </View>

      {/* Free Feature: Basic Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Your Score</Text>
        <View style={styles.basicScore}>
          <Text style={styles.basicScoreNumber}>
            {quizResult.correctAnswers}/{quizResult.totalQuestions}
          </Text>
          <Text style={styles.basicScoreLabel}>Correct Answers</Text>
        </View>
      </View>

      {/* Demo: Unlock Button */}
      {!isPremium && (
        <TouchableOpacity
          disabled={isLoading || isUnlocking}
          onPress={handleUnlockPremium}
          style={[
            styles.demoUnlockButton,
            (isLoading || isUnlocking) && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.demoUnlockButtonText}>
            {isUnlocking ? '🔄 Unlocking...' : '⚡ Demo: Unlock Premium (1.5s)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Premium Feature 1: Detailed Results Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Detailed Results</Text>
        <PremiumGate
          featureName="Detailed Results Chart"
          description="View comprehensive performance analytics"
          lockIcon="📊"
          buttonText="View Details"
        >
          <QuizResultsChart results={quizResult} />
        </PremiumGate>
      </View>

      {/* Premium Feature 2: Study Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Study Plan</Text>
        <PremiumGate
          featureName="AI Study Recommendations"
          description="Get a personalized study plan"
          lockIcon="🤖"
          buttonText="See Study Plan"
        >
          <StudyRecommendations />
        </PremiumGate>
      </View>

      {/* Premium Feature 3: Performance History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Your Progress</Text>
        <PremiumGate
          featureName="Performance History"
          description="Track your progress over time"
          lockIcon="📈"
          buttonText="View History"
        >
          <PerformanceHistory />
        </PremiumGate>
      </View>

      {/* Premium Feature 4: Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        <PremiumGate
          featureName="Achievements & Badges"
          description="Unlock badges and track achievements"
          lockIcon="🏆"
          buttonText="View Badges"
        >
          <View style={styles.achievementCard}>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementBadgeIcon}>🥇</Text>
              <Text style={styles.achievementBadgeName}>Quiz Master</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementBadgeIcon}>🔥</Text>
              <Text style={styles.achievementBadgeName}>7-Day Streak</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementBadgeIcon}>⚡</Text>
              <Text style={styles.achievementBadgeName}>Speed Runner</Text>
            </View>
          </View>
        </PremiumGate>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Why Upgrade?</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>✨ Detailed performance analytics</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>🤖 AI-powered study recommendations</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>📈 Track progress over time</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>🏆 Unlock achievements and badges</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>🎓 Personalized learning paths</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  contentContainer: {
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  } as TextStyle,

  premiumBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  } as ViewStyle,

  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  } as TextStyle,

  // Sections
  section: {
    marginHorizontal: 20,
    marginVertical: 16,
  } as ViewStyle,

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  } as TextStyle,

  // Basic Score (Free Feature)
  basicScore: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  } as ViewStyle,

  basicScoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  } as TextStyle,

  basicScoreLabel: {
    fontSize: 14,
    color: '#666',
  } as TextStyle,

  // Demo Button
  demoUnlockButton: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  } as ViewStyle,

  buttonDisabled: {
    opacity: 0.6,
  } as ViewStyle,

  demoUnlockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,

  // Chart Card
  chartCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  } as ViewStyle,

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  } as ViewStyle,

  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  } as TextStyle,

  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6C63FF',
  } as TextStyle,

  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    marginBottom: 12,
  } as ViewStyle,

  resultItem: {
    alignItems: 'center',
  } as ViewStyle,

  resultLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  } as TextStyle,

  resultValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  } as TextStyle,

  gaugeContainer: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  } as ViewStyle,

  gauge: {
    height: '100%',
  } as ViewStyle,

  feedbackText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  } as TextStyle,

  // Recommendation Card
  recommendationCard: {
    backgroundColor: '#F0EBFF',
    borderRadius: 12,
    padding: 16,
  } as ViewStyle,

  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  } as TextStyle,

  recommendationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  recommendationLeft: {
    flex: 1,
  } as ViewStyle,

  recommendationTopic: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  } as TextStyle,

  recommendationMeta: {
    fontSize: 11,
    color: '#888',
  } as TextStyle,

  recommendationButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  } as ViewStyle,

  recommendationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,

  recommendationFooter: {
    fontSize: 11,
    color: '#888',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  } as TextStyle,

  // History Card
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  } as ViewStyle,

  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  } as TextStyle,

  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  } as ViewStyle,

  historyLeft: {
    flex: 1,
  } as ViewStyle,

  historyDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  } as TextStyle,

  historyQuizName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  } as TextStyle,

  historyScore: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  } as ViewStyle,

  historyScoreText: {
    fontSize: 12,
    fontWeight: '700',
  } as TextStyle,

  // Achievement Card
  achievementCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  } as ViewStyle,

  achievementBadge: {
    alignItems: 'center',
    marginVertical: 8,
  } as ViewStyle,

  achievementBadgeIcon: {
    fontSize: 40,
    marginBottom: 4,
  },

  achievementBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  } as TextStyle,

  // Info Section
  infoSection: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  } as ViewStyle,

  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  } as TextStyle,

  infoItem: {
    paddingVertical: 6,
  } as ViewStyle,

  infoBullet: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  } as TextStyle,

  footer: {
    height: 20,
  } as ViewStyle,
});

export default RealWorldQuizResultsScreen;
