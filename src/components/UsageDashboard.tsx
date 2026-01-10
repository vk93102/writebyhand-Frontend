/**
 * Usage Dashboard
 * Complete implementation of subscription and feature usage dashboard
 * Shows user subscription status, feature limits, and usage statistics
 */

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
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import {
  subscriptionService,
  SubscriptionStatus,
  UsageStatus,
  DashboardData,
} from '../services/subscriptionService';
import { getUsageDashboard } from '../services/api';

interface UsageFeature {
  name: string;
  key: string;
  icon: string;
  color: string;
  category?: string;
}

interface UsageDashboardProps {
  userId: string;
  onBack: () => void;
  onUpgrade: () => void;
  onManageSubscription?: () => void;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({
  userId,
  onBack,
  onUpgrade,
  onManageSubscription,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'features'>('overview');

  const features: UsageFeature[] = [
    { name: 'Mock Tests', key: 'mock_test', icon: 'assignment', color: '#4CAF50' },
    { name: 'Quizzes', key: 'quiz', icon: 'school', color: '#2196F3' },
    { name: 'Flashcards', key: 'flashcards', icon: 'style', color: '#9C27B0' },
    { name: 'PYQs', key: 'pyqs', icon: 'history-edu', color: '#FF9800' },
    { name: 'Ask Questions', key: 'ask_question', icon: 'help-outline', color: '#F44336' },
    { name: 'Predicted Questions', key: 'predicted_questions', icon: 'lightbulb', color: '#FFC107' },
    { name: 'YouTube Summarizer', key: 'youtube_summarizer', icon: 'video-library', color: '#E91E63' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Try to fetch from new usage API first
      try {
        const usageResponse = await getUsageDashboard();
        console.log('[UsageDashboard] Usage API response:', usageResponse);
        
        if (usageResponse.success && usageResponse.dashboard) {
          // Format the usage data for display
          const formattedData = {
            plan: usageResponse.dashboard.plan || 'free',
            features: usageResponse.dashboard.features || {},
            billing: {
              subscription_status: 'active',
              is_trial: false,
              trial_end_date: null,
              next_billing_date: null,
            },
          };
          
          console.log('[UsageDashboard] Formatted dashboard data:', formattedData);
          setDashboardData(formattedData as any);
          return;
        }
      } catch (usageError) {
        console.log('[UsageDashboard] Usage API not available, falling back to subscription service:', usageError);
      }
      
      // Fallback to subscription service if usage API fails
      const dashboard = await subscriptionService.getDashboard();
      setDashboardData(dashboard);
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

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage < 50) return colors.success;
    if (percentage < 80) return colors.warning;
    return colors.error;
  };

  const renderSubscriptionHeader = () => {
    if (!dashboardData) return null;

    const billing = dashboardData.billing;
    const isActive = billing.subscription_status === 'active';
    const isTrial = billing.is_trial;

    return (
      <View style={[styles.planCard, !isActive && styles.planCardInactive]}>
        <View style={styles.planCardHeader}>
          <View>
            <Text style={styles.planName}>{dashboardData.plan.toUpperCase()}</Text>
            <View style={[styles.statusBadge, { borderColor: isActive ? colors.success : colors.error }]}>
              <MaterialIcons
                name={isActive ? 'check-circle' : 'cancel'}
                size={14}
                color={isActive ? colors.success : colors.error}
              />
              <Text style={[styles.statusBadgeText, { color: isActive ? colors.success : colors.error }]}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
          <MaterialIcons
            name={isTrial ? 'schedule' : 'workspace-premium'}
            size={48}
            color={isTrial ? colors.warning : colors.primary}
          />
        </View>

        {/* Subscription Details */}
        {isTrial && billing.trial_end_date && (
          <View style={styles.detailRow}>
            <MaterialIcons
              name="schedule"
              size={18}
              color={colors.primary}
            />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Trial Ends</Text>
              <Text style={styles.detailValue}>
                {new Date(billing.trial_end_date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {billing.next_billing_date && !isTrial && (
          <View style={styles.detailRow}>
            <MaterialIcons
              name="event-note"
              size={18}
              color={colors.success}
            />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Next Billing</Text>
              <Text style={styles.detailValue}>
                {new Date(billing.next_billing_date!).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {/* Access Status */}
        {Object.values(dashboardData.features).some(f => f.unlimited) ? (
          <View style={[styles.accessStatus, styles.unlimitedStatus]}>
            <MaterialIcons
              name="all-inclusive"
              size={20}
              color={colors.success}
            />
            <Text style={[styles.accessStatusText, { color: colors.success }]}>
              Unlimited Access
            </Text>
          </View>
        ) : (
          <View style={[styles.accessStatus, styles.limitedStatus]}>
            <MaterialIcons
              name="info-outline"
              size={20}
              color={colors.warning}
            />
            <Text style={[styles.accessStatusText, { color: colors.warning }]}>
              3 Uses Per Feature Monthly
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {!Object.values(dashboardData.features).some(f => f.unlimited) && (
          <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
            <MaterialIcons name="upgrade" size={18} color="#fff" />
            <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}

        {isActive && onManageSubscription && (
          <TouchableOpacity style={styles.manageBtn} onPress={onManageSubscription}>
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFeatureCard = (feature: UsageFeature) => {
    if (!dashboardData || !dashboardData.features[feature.key]) {
      return null;
    }

    const featureData = dashboardData.features[feature.key];

    return (
      <View key={feature.key} style={styles.featureCard}>
        <View
          style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}
        >
          <MaterialIcons
            name={feature.icon as any}
            size={24}
            color={feature.color}
          />
        </View>

        <Text style={styles.featureName}>{feature.name}</Text>

        {featureData.unlimited ? (
          <View style={styles.unlimitedBadge}>
            <MaterialIcons
              name="all-inclusive"
              size={16}
              color={colors.success}
            />
            <Text style={styles.unlimitedText}>Unlimited</Text>
          </View>
        ) : (
          <>
            <Text style={styles.usageCount}>
              {featureData.used}/{featureData.limit}
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${featureData.percentage_used}%`,
                    backgroundColor: featureData.percentage_used < 50 
                      ? colors.success 
                      : featureData.percentage_used < 80 
                        ? colors.warning 
                        : colors.error,
                  },
                ]}
              />
            </View>

            <Text style={styles.remainingText}>
              {featureData.remaining} remaining
            </Text>
          </>
        )}

        {featureData.remaining !== null && featureData.remaining === 0 && !featureData.unlimited && (
          <View style={styles.limitReachedBadge}>
            <MaterialIcons name="block" size={12} color="#fff" />
            <Text style={styles.limitReachedText}>Limit Reached</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Usage Dashboard</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading usage data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usage Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Header */}
        {renderSubscriptionHeader()}

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'overview' && styles.activeTabLabel,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'features' && styles.activeTab]}
            onPress={() => setActiveTab('features')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'features' && styles.activeTabLabel,
              ]}
            >
              Features
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Plan Type</Text>
                <Text style={styles.summaryValue}>
                  {dashboardData?.plan.toUpperCase()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Status</Text>
                <Text style={styles.summaryValue}>
                  {dashboardData?.billing.subscription_status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Access</Text>
                <Text style={styles.summaryValue}>
                  {Object.values(dashboardData?.features || {}).some(f => f.unlimited) ? 'Unlimited' : 'Limited'}
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              {features.slice(0, 3).map((feature) => renderFeatureCard(feature))}
            </View>

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>💡 Tips</Text>
              <View style={styles.tipCard}>
                <MaterialIcons
                  name={Object.values(dashboardData?.features || {}).some(f => f.unlimited) ? 'celebration' : 'lightbulb'}
                  size={20}
                  color={colors.warning}
                />
                <Text style={styles.tipText}>
                  {Object.values(dashboardData?.features || {}).some(f => f.unlimited)
                    ? 'You have unlimited access! Start learning without limits.'
                    : 'Upgrade to Premium for just ₹1 and get unlimited access to all features.'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <>
            <Text style={styles.sectionTitle}>All Features</Text>
            <View style={styles.statsGrid}>
              {features.map((feature) => renderFeatureCard(feature))}
            </View>

            {!Object.values(dashboardData?.features || {}).some(f => f.unlimited) && (
              <View style={styles.resetInfoCard}>
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.resetInfoText}>
                  Usage limits reset on the 1st of each month
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  planCardInactive: {
    borderColor: '#e8eaed',
    opacity: 0.8,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    marginLeft: spacing.xs,
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  accessStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  unlimitedStatus: {
    backgroundColor: '#ecfdf5',
  },
  limitedStatus: {
    backgroundColor: '#fffbf0',
  },
  accessStatusText: {
    marginLeft: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  upgradeBtnText: {
    marginLeft: spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  manageBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  manageBtnText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e8eaed',
    marginHorizontal: spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
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
    textAlign: 'center',
  },
  usageCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  unlimitedText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e8eaed',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  remainingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  limitReachedBadge: {
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
  limitReachedText: {
    marginLeft: 2,
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  tipsSection: {
    marginBottom: spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  tipText: {
    marginLeft: spacing.md,
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  resetInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  resetInfoText: {
    marginLeft: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
