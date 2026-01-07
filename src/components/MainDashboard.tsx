import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { getDailyQuiz } from '../services/api';
import { getUserCoins } from '../services/api';
import { getQuizSettings } from '../services/mockTestService';
import { DailyQuizScreen } from './DailyQuizScreen';

interface MainDashboardProps {
  userName: string;
  onNavigateToFeature: (feature: string) => void;
  onNavigateToPricing: () => void;
}

interface ActivityItem {
  id: string;
  type: 'question' | 'quiz' | 'flashcard' | 'video';
  title: string;
  timestamp: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface QuickAccess {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  feature: string;
}

const QUICK_ACCESS: QuickAccess[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: 'person',
    color: '#5B6DCD',
    feature: 'profile',
  },
  {
    id: 'quiz',
    title: 'Quiz',
    icon: 'quiz',
    color: '#FFD93D',
    feature: 'quiz',
  },
  {
    id: 'flashcard',
    title: 'Flash Cards',
    icon: 'style',
    color: '#95E1D3',
    feature: 'flashcards',
  },
  {
    id: 'ask',
    title: 'Ask Questions',
    icon: 'help-outline',
    color: '#FF6B6B',
    feature: 'ask-question',
  },
  {
    id: 'predicted',
    title: 'Predicted Questions',
    icon: 'psychology',
    color: '#4ECDC4',
    feature: 'predicted-questions',
  },
  {
    id: 'video',
    title: 'YouTube Summarizer',
    icon: 'video-library',
    color: '#F38181',
    feature: 'youtube-summarizer',
  },
  {
    id: 'trends',
    title: 'Trends',
    icon: 'analytics',
    color: '#7C3AED',
    feature: 'trends',
  },
  {
    id: 'dailyQuiz',
    title: 'Daily Quiz',
    icon: 'emoji-events',
    color: '#FFD700',
    feature: 'daily-quiz',
  },
  {
    id: 'upload',
    title: 'Upload Document',
    icon: 'upload-file',
    color: '#A29BFE',
    feature: 'upload-document',
  },
];

export const MainDashboard: React.FC<MainDashboardProps> = ({
  userName,
  onNavigateToFeature,
  onNavigateToPricing,
}) => {
  const [userStats, setUserStats] = useState({
    questionsAnswered: 24,
    quizzesCompleted: 8,
    hoursLearned: 15.5,
    currentStreak: 5,
  });
  
  const [userCoins, setUserCoins] = useState(0);
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);
  const [dailyQuizAvailable, setDailyQuizAvailable] = useState<boolean | null>(null);
  const [quizSettings, setQuizSettings] = useState<any>(null);

  useEffect(() => {
    loadUserCoins();
    checkDailyQuizStatus();
    loadQuizSettings();
  }, []);

  const loadQuizSettings = async () => {
    try {
      const settings = await getQuizSettings();
      setQuizSettings(settings);
    } catch (error) {
      console.error('Failed to load quiz settings:', error);
      // Use defaults
      setQuizSettings({
        daily_quiz: {
          attempt_bonus: 5,
          coins_per_correct: 5,
          perfect_score_bonus: 10,
        }
      });
    }
  };

  const loadUserCoins = async () => {
    try {
      const data = await getUserCoins(userName || 'anonymous');
      setUserCoins(data.total_coins || 0);
    } catch (error) {
      console.error('Failed to load coins:', error);
    }
  };

  const checkDailyQuizStatus = async () => {
    try {
      const data = await getDailyQuiz(userName || 'anonymous');
      // If already_attempted is true, quiz is not available
      if (data.already_attempted) setDailyQuizAvailable(false);
      else setDailyQuizAvailable(true);
    } catch (error) {
      // If 404 or error, treat as not available
      setDailyQuizAvailable(false);
    }
  };

  const handleDailyQuizComplete = () => {
    setShowDailyQuiz(false);
    loadUserCoins(); // Refresh coins after completing quiz
  };

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'question',
      title: 'Asked question about Physics',
      timestamp: '2 hours ago',
      icon: 'help-outline',
    },
    {
      id: '2',
      type: 'quiz',
      title: 'Completed Math Quiz - 85%',
      timestamp: '5 hours ago',
      icon: 'quiz',
    },
    {
      id: '3',
      type: 'flashcard',
      title: 'Reviewed Biology flashcards',
      timestamp: '1 day ago',
      icon: 'style',
    },
    {
      id: '4',
      type: 'video',
      title: 'Summarized Chemistry lecture',
      timestamp: '2 days ago',
      icon: 'video-library',
    },
  ]);

  const [subscriptionStatus, setSubscriptionStatus] = useState({
    plan: 'free',
    questionsRemaining: 2,
    quizzesRemaining: 1,
    flashcardsRemaining: 3,
    daysUntilReset: 18,
  });

  const renderQuickAccessItem = (item: QuickAccess) => (
    <TouchableOpacity
      key={item.id}
      style={styles.quickAccessCard}
      onPress={() => onNavigateToFeature(item.feature)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.quickAccessIcon,
          { backgroundColor: item.color + '20' },
        ]}
      >
        <MaterialIcons name={item.icon} size={32} color={item.color} />
      </View>
      <Text style={styles.quickAccessText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityItem}>
      <View
        style={[
          styles.activityIcon,
          {
            backgroundColor:
              item.type === 'question'
                ? '#FF6B6B20'
                : item.type === 'quiz'
                ? '#FFD93D20'
                : item.type === 'flashcard'
                ? '#95E1D320'
                : '#F3818120',
          },
        ]}
      >
        <MaterialIcons
          name={item.icon}
          size={20}
          color={
            item.type === 'question'
              ? '#FF6B6B'
              : item.type === 'quiz'
              ? '#FFD93D'
              : item.type === 'flashcard'
              ? '#95E1D3'
              : '#F38181'
          }
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityTime}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}! 👋</Text>
            <Text style={styles.motivationalText}>
              Keep up your {userStats.currentStreak}-day streak! You're doing amazing!
            </Text>
          </View>
          <View style={styles.coinsBadge}>
            <MaterialIcons name="monetization-on" size={24} color="#FFD700" />
            <Text style={styles.coinsCount}>{userCoins}</Text>
          </View>
        </View>

        {/* Daily Quiz Banner */}
        <TouchableOpacity 
          style={styles.dailyQuizBanner}
          onPress={() => setShowDailyQuiz(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dailyQuizContent}>
            <View style={styles.dailyQuizIcon}>
              <MaterialIcons name="emoji-events" size={32} color="#FFD700" />
            </View>
            <View style={styles.dailyQuizText}>
              <Text style={styles.dailyQuizTitle}>Daily Quiz 🎯</Text>
              <Text style={styles.dailyQuizSubtitle}>
                Answer 5 questions • Earn up to {quizSettings ? (quizSettings.daily_quiz.attempt_bonus + (5 * quizSettings.daily_quiz.coins_per_correct)) : 35} coins
              </Text>
              {dailyQuizAvailable !== null && (
                <View style={[styles.dailyBadge, dailyQuizAvailable ? styles.dailyBadgeAvailable : styles.dailyBadgeDone]}>
                  <Text style={[styles.dailyBadgeText, dailyQuizAvailable ? styles.dailyBadgeTextAvailable : styles.dailyBadgeTextDone]}>{dailyQuizAvailable ? 'Available' : 'Completed'}</Text>
                </View>
              )}
            </View>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color={colors.white} />
        </TouchableOpacity>

      {/* Subscription Banner */}
      {subscriptionStatus.plan === 'free' && (
        <View style={styles.subscriptionBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <MaterialIcons name="trending-up" size={24} color={colors.primary} />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Unlock Unlimited Access</Text>
              <Text style={styles.bannerSubtitle}>
                Upgrade to Premium for ₹1.99/month
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={onNavigateToPricing}
          >
            <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="help-outline" size={24} color="#FF6B6B" />
            <Text style={styles.statLabel}>Questions</Text>
            <Text style={styles.statValue}>{userStats.questionsAnswered}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="quiz" size={24} color="#FFD93D" />
            <Text style={styles.statLabel}>Quizzes</Text>
            <Text style={styles.statValue}>{userStats.quizzesCompleted}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="access-time" size={24} color="#4ECDC4" />
            <Text style={styles.statLabel}>Hours</Text>
            <Text style={styles.statValue}>{userStats.hoursLearned.toFixed(1)}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{userStats.currentStreak} days</Text>
          </View>
        </View>
      </View>

      {/* Feature Usage */}
      {subscriptionStatus.plan === 'free' && (
        <View style={styles.usageSection}>
          <Text style={styles.sectionTitle}>Monthly Usage</Text>
          <Text style={styles.usageReset}>
            Resets in {subscriptionStatus.daysUntilReset} days
          </Text>

          {[
            {
              name: 'Questions',
              used: 1,
              limit: 3,
              color: '#FF6B6B',
            },
            {
              name: 'Quizzes',
              used: 2,
              limit: 3,
              color: '#FFD93D',
            },
            {
              name: 'Flashcards',
              used: 0,
              limit: 3,
              color: '#95E1D3',
            },
          ].map((item, index) => (
            <View key={index} style={styles.usageItem}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageName}>{item.name}</Text>
                <Text style={styles.usageCount}>
                  {item.used}/{item.limit}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(item.used / item.limit) * 100}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.upgradeButton} onPress={onNavigateToPricing}>
            <MaterialIcons name="star" size={20} color={colors.white} />
            <Text style={styles.upgradeButtonText}>Upgrade to Unlimited</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Access */}
      <View style={styles.quickAccessSection}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.quickAccessGrid}>
          {QUICK_ACCESS.map((item) => renderQuickAccessItem(item))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentActivity.length > 0 ? (
          <FlatList
            data={recentActivity.slice(0, 4)}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginVertical: spacing.md,
                }}
              />
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No activity yet. Start learning!</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => onNavigateToFeature('ask-question')}
            >
              <Text style={styles.emptyStateButtonText}>Ask Your First Question</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Learning Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Pro Tips for Better Learning</Text>
        {[
          {
            icon: 'wb-sunny',
            title: 'Study Regularly',
            description: 'Consistent daily practice improves retention by 40%',
          },
          {
            icon: 'schedule',
            title: 'Use Flashcards',
            description: 'Review flashcards daily to reinforce concepts',
          },
          {
            icon: 'assessment',
            title: 'Take Quizzes',
            description: 'Test yourself weekly to identify weak areas',
          },
        ].map((tip, index) => (
          <View key={index} style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <MaterialIcons name={tip.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDescription}>{tip.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to level up your studies?</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={onNavigateToPricing}>
          <MaterialIcons name="star" size={20} color={colors.white} />
          <Text style={styles.ctaButtonText}>Explore Premium Features</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Daily Quiz Modal */}
    <Modal
      visible={showDailyQuiz}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <DailyQuizScreen
        visible={showDailyQuiz}
        userId={userName || 'anonymous'}
        onComplete={handleDailyQuizComplete}
        onClose={() => setShowDailyQuiz(false)}
      />
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Welcome Section */
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h2,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  motivationalText: {
    ...typography.body,
    color: colors.textMuted,
  },
  coinsBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFD70020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsCount: {
    ...typography.h3,
    fontWeight: '700',
    color: '#FFD700',
    marginTop: spacing.xs,
  },
  streakBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B6B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    ...typography.h3,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: spacing.xs,
  },

  /* Daily Quiz Banner */
  dailyQuizBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  dailyQuizContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dailyQuizIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyQuizText: {
    flex: 1,
  },
  dailyQuizTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  dailyQuizSubtitle: {
    ...typography.small,
    color: colors.white + 'DD',
  },

  /* Subscription Banner */
  subscriptionBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    ...typography.small,
    color: colors.white + '80',
  },
  bannerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Stats Section */
  statsSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  statValue: {
    ...typography.h3,
    fontWeight: '700',
    marginTop: spacing.xs,
  },

  /* Usage Section */
  usageSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  usageReset: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  usageItem: {
    marginBottom: spacing.lg,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  usageName: {
    ...typography.body,
    fontWeight: '600',
  },
  usageCount: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  upgradeButtonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
  },

  /* Quick Access Section */
  quickAccessSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    ...shadows.sm,
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  quickAccessText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text,
    fontSize: 14,
  },

  /* Activity Section */
  activitySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  activityTime: {
    ...typography.small,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textMuted,
    marginVertical: spacing.md,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  emptyStateButtonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
  },

  dailyQuizBanner: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyQuizContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  dailyQuizIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyQuizText: {
    flex: 1,
  },
  dailyQuizTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  dailyQuizSubtitle: {
    ...typography.small,
    color: colors.white,
    marginTop: spacing.xs,
  },
  dailyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  dailyBadgeAvailable: {
    backgroundColor: colors.white,
  },
  dailyBadgeDone: {
    backgroundColor: colors.white + '40',
  },
  dailyBadgeText: {
    ...typography.small,
    fontWeight: '700',
  },
  dailyBadgeTextAvailable: {
    color: colors.primary,
  },
  dailyBadgeTextDone: {
    color: colors.textMuted,
  },

  /* Tips Section */
  tipsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tipDescription: {
    ...typography.small,
    color: colors.textMuted,
    lineHeight: 18,
  },

  /* CTA Section */
  ctaSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  ctaTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  ctaButtonText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
});
