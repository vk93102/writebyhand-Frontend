import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import { getSubscriptionStatus } from '../services/api';

interface UsageFeature {
  name: string;
  key: keyof Usage;
  icon: string;
  color: string;
}

interface Usage {
  mock_tests: number;
  quizzes: number;
  flash_cards: number;
  pyqs: number;
  ask_questions: number;
  predicted_questions: number;
  youtube_summarizer: number;
}

interface FeatureLimit {
  limit: number;
  used: number;
}

interface SubscriptionStatus {
  user_id: string;
  plan: string;
  subscription_status: string;
  current_period_end: string | null;
  usage: Usage;
  feature_limits: Record<string, FeatureLimit>;
}

interface UsageDashboardProps {
  userId: string;
  onBack: () => void;
  onUpgrade: () => void;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ userId, onBack, onUpgrade }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  const features: UsageFeature[] = [
    { name: 'Mock Tests', key: 'mock_tests', icon: 'assignment', color: '#4CAF50' },
    { name: 'Quizzes', key: 'quizzes', icon: 'quiz', color: '#2196F3' },
    { name: 'Flashcards', key: 'flash_cards', icon: 'style', color: '#9C27B0' },
    { name: 'PYQs', key: 'pyqs', icon: 'history-edu', color: '#FF9800' },
    { name: 'Ask Questions', key: 'ask_questions', icon: 'help-outline', color: '#F44336' },
    { name: 'Predicted Questions', key: 'predicted_questions', icon: 'lightbulb', color: '#FFC107' },
    { name: 'YouTube Summarizer', key: 'youtube_summarizer', icon: 'video-library', color: '#E91E63' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionStatus(userId);
      setStatus(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getUsagePercentage = (used: number, limit: number | null): number => {
    if (limit === null) return 0; // Unlimited
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage < 50) return colors.success;
    if (percentage < 80) return colors.warning;
    return colors.error;
  };

  const renderFeatureCard = (feature: UsageFeature) => {
    if (!status) return null;

    const used = status.usage[feature.key];
    const featureLimit = status.feature_limits[feature.key];
    const limit = featureLimit?.limit ?? null;
    const percentage = getUsagePercentage(used, limit);
    const isUnlimited = limit === null;
    const isLimitReached = !isUnlimited && used >= limit;

    return (
      <View key={feature.key} style={styles.featureCard}>
        <View style={[styles.iconContainer, { backgroundColor: feature.color + '15' }]}>
          <MaterialIcons name={feature.icon as any} size={28} color={feature.color} />
        </View>
        
        <Text style={styles.featureName}>{feature.name}</Text>
        
        <View style={styles.usageNumbers}>
          {isUnlimited ? (
            <View style={styles.unlimitedBadge}>
              <MaterialIcons name="all-inclusive" size={20} color={colors.success} />
              <Text style={styles.unlimitedText}>Unlimited</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.usedCount, isLimitReached && styles.limitReachedCount]}>
                {used}
              </Text>
              <Text style={styles.limitCount}> / {limit}</Text>
            </>
          )}
        </View>

        {!isUnlimited && (
          <>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: getUsageColor(percentage),
                  },
                ]}
              />
            </View>
            <Text style={[styles.percentageText, { color: getUsageColor(percentage) }]}>
              {percentage.toFixed(0)}% Used
            </Text>
          </>
        )}

        {isLimitReached && (
          <View style={styles.limitBadge}>
            <MaterialIcons name="warning" size={14} color="#fff" />
            <Text style={styles.limitBadgeText}>Limit Reached</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Usage Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading usage data...</Text>
        </View>
      </View>
    );
  }

  const isPremium = status?.plan === 'premium';
  const isActive = status?.subscription_status === 'active';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Usage Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Plan Status Card */}
        <View style={[styles.planCard, isPremium && styles.premiumCard]}>
          <View style={styles.planHeader}>
            <MaterialIcons
              name={isPremium ? 'workspace-premium' : 'info'}
              size={32}
              color={isPremium ? colors.warning : colors.primary}
            />
            <View style={styles.planInfo}>
              <Text style={styles.planName}>
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </Text>
              {isPremium && status?.current_period_end && (
                <Text style={styles.planSubtitle}>
                  Renews on {new Date(status.current_period_end).toLocaleDateString()}
                </Text>
              )}
              {!isPremium && (
                <Text style={styles.planSubtitle}>
                  Upgrade for unlimited access
                </Text>
              )}
            </View>
          </View>

          {!isPremium && (
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <MaterialIcons name="upgrade" size={20} color="#fff" />
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Usage Statistics - Grid Layout */}
        <Text style={styles.sectionTitle}>Feature Usage</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature) => renderFeatureCard(feature))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <View style={styles.tipCard}>
            <MaterialIcons name="lightbulb-outline" size={20} color={colors.warning} />
            <Text style={styles.tipText}>
              {isPremium
                ? 'You have unlimited access to all features. Enjoy learning!'
                : 'Upgrade to Premium for unlimited access to all features. Only ₹1 for first month!'}
            </Text>
          </View>
        </View>

        {/* Monthly Reset Info */}
        {!isPremium && (
          <View style={styles.resetInfo}>
            <MaterialIcons name="schedule" size={20} color={colors.textSecondary} />
            <Text style={styles.resetText}>
              Usage limits reset on the 1st of each month
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumCard: {
    borderColor: colors.warning,
    backgroundColor: '#fffbf0',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  planSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
  },
  upgradeButtonText: {
    marginLeft: spacing.xs,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '48%', // Two columns
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  usageNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  usedCount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  limitReachedCount: {
    color: colors.error,
  },
  limitCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unlimitedText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e8eaed',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
  },
  limitBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  limitBadgeText: {
    marginLeft: 2,
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  tipsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipText: {
    marginLeft: spacing.sm,
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  resetText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
