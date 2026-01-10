/**
 * Subscription Status Modal
 * Displays current subscription status, plan details, and next billing date
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import {
  subscriptionService,
  SubscriptionStatus,
  SubscriptionPlan,
} from '../services/subscriptionService';

interface SubscriptionStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  onManageSubscription?: () => void;
}

export const SubscriptionStatusModal: React.FC<
  SubscriptionStatusModalProps
> = ({ visible, onClose, onUpgrade, onManageSubscription }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subscriptionStatus, availablePlans] = await Promise.all([
        subscriptionService.getSubscriptionStatus(),
        subscriptionService.getAvailablePlans(),
      ]);
      setStatus(subscriptionStatus);
      setPlans(availablePlans);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load subscription info');
    } finally {
      setLoading(false);
    }
  };

  const renderBadge = () => {
    if (!status) return null;

    const badge = subscriptionService.formatStatusBadge(status.status);

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: badge.color + '20', borderColor: badge.color },
        ]}
      >
        <MaterialIcons name={badge.icon as any} size={20} color={badge.color} />
        <Text style={[styles.badgeText, { color: badge.color }]}>
          {badge.label}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading subscription info...</Text>
        </View>
      );
    }

    if (!status) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorText}>Unable to load subscription</Text>
        </View>
      );
    }

    const isActive = subscriptionService.isSubscriptionActive(status);
    const daysRemaining = subscriptionService.getDaysRemainingInTrial(
      status.trial_end_date
    );

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={[styles.header, !isActive && styles.headerInactive]}>
          <View>
            <Text style={styles.planName}>
              {status.plan.toUpperCase()} Plan
            </Text>
            {renderBadge()}
          </View>
          <MaterialIcons
            name={
              status.unlimited_access
                ? 'workspace-premium'
                : 'info-outline'
            }
            size={48}
            color={status.unlimited_access ? colors.warning : colors.primary}
          />
        </View>

        {/* Trial/Billing Info */}
        {status.is_trial && status.trial_end_date && (
          <View style={styles.infoCard}>
            <MaterialIcons name="schedule" size={24} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Trial Period</Text>
              <Text style={styles.infoValue}>
                {daysRemaining} days remaining
              </Text>
              <Text style={styles.infoSubtitle}>
                Ends: {new Date(status.trial_end_date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {/* Billing Date */}
        {status.next_billing_date && (
          <View style={styles.infoCard}>
            <MaterialIcons
              name="event-note"
              size={24}
              color={colors.success}
            />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Next Billing</Text>
              <Text style={styles.infoValue}>
                {new Date(status.next_billing_date).toLocaleDateString()}
              </Text>
              <Text style={styles.infoSubtitle}>
                Auto-renews unless cancelled
              </Text>
            </View>
          </View>
        )}

        {/* Access Status */}
        {status.unlimited_access ? (
          <View style={[styles.accessCard, styles.unlimitedAccess]}>
            <MaterialIcons
              name="check-circle"
              size={32}
              color={colors.success}
            />
            <Text style={styles.accessTitle}>Unlimited Access</Text>
            <Text style={styles.accessDescription}>
              You have unlimited access to all features and benefits of this plan.
            </Text>
          </View>
        ) : (
          <View style={[styles.accessCard, styles.limitedAccess]}>
            <MaterialIcons
              name="info"
              size={32}
              color={colors.warning}
            />
            <Text style={styles.accessTitle}>Limited Access</Text>
            <Text style={styles.accessDescription}>
              You're on the free plan with 3 uses per feature per month.
            </Text>
          </View>
        )}

        {/* Feature Highlights */}
        {status.features_unlocked && status.features_unlocked.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Your Features</Text>
            {status.features_unlocked.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <MaterialIcons
                  name="check"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Past Due Warning */}
        {status.status === 'past_due' && (
          <View style={styles.warningCard}>
            <MaterialIcons
              name="warning"
              size={24}
              color={colors.error}
            />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Payment Failed</Text>
              <Text style={styles.warningText}>
                We couldn't charge your card. Please update your payment method
                to restore access.
              </Text>
            </View>
          </View>
        )}

        {/* Cancelled Status */}
        {status.status === 'cancelled' && (
          <View style={styles.warningCard}>
            <MaterialIcons
              name="cancel"
              size={24}
              color={colors.error}
            />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Subscription Cancelled</Text>
              <Text style={styles.warningText}>
                You're back on the free plan. You can reactivate anytime.
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {isActive && onManageSubscription && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onManageSubscription}
            >
              <Text style={styles.secondaryButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          )}

          {!status.unlimited_access && onUpgrade && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={onUpgrade}
            >
              <MaterialIcons name="upgrade" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          )}

          {(status.status === 'cancelled' || !isActive) && onUpgrade && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={onUpgrade}
            >
              <Text style={styles.primaryButtonText}>Reactivate Subscription</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            📧 Confirmation and receipts will be sent to your registered email.
            {'\n\n'}
            Questions? Contact our support team for assistance.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Your Subscription</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Modal Content */}
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
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
    paddingBottom: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f0f4ff',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  headerInactive: {
    backgroundColor: '#f5f5f5',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  infoSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  accessCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  unlimitedAccess: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: colors.success,
  },
  limitedAccess: {
    backgroundColor: '#fffbf0',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  accessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  accessDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#fff',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  featureText: {
    marginLeft: spacing.md,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  warningContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  warningText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  actionsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  helpSection: {
    padding: spacing.md,
    backgroundColor: '#f9fafb',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
