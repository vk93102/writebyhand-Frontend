import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface MainDashboardProps {
  userName: string;
  userEmail: string;
  onNavigateToFeature: (feature: string) => void;
  onLogout?: () => void;
}

const CONTINUE_LEARNING = [
  {
    id: '1',
    title: 'Photosynthesis Explained',
    subtitle: 'Video Summary',
    image: '📚',
    bgColor: '#1A4D3C',
  },
  {
    id: '2',
    title: 'Intro to Calculus',
    subtitle: 'Video Summary',
    image: '📐',
    bgColor: '#1A2D3C',
  },
  {
    id: '3',
    title: 'Understanding Shakespeare',
    subtitle: 'Video Summary',
    image: '✒️',
    bgColor: '#2A3D4C',
  },
];

export const MainDashboard: React.FC<MainDashboardProps> = ({
  userName,
  userEmail,
  onNavigateToFeature,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    id: 'flashcard',
    title: 'Flashcards',
    icon: 'style',
    color: '#95E1D3',
    feature: 'flashcards',
  },
  {
    id: 'predicted',
    title: 'Practice',
    icon: 'psychology',
    color: '#4ECDC4',
    feature: 'predicted-questions',
  },
  {
    id: 'video',
    title: 'Summarize',
    icon: 'video-library',
    color: '#F38181',
    feature: 'youtube-summarizer',
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
        <MaterialIcons name={item.icon} size={28} color={item.color} />
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
        <View style={styles.streakBadge}>
          <MaterialIcons name="local-fire" size={24} color="#FF6B6B" />
          <Text style={styles.streakCount}>{userStats.currentStreak}</Text>
        </View>
      </View>

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
        <Text style={styles.sectionTitle}>Quick Access</Text>
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
    gap: spacing.md,
  },
  quickAccessCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickAccessText: {
    ...typography.small,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text,
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
