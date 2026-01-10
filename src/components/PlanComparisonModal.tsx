/**
 * Plan Comparison Modal
 * Shows all available plans side-by-side for user to choose
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
  SubscriptionPlan,
} from '../services/subscriptionService';

interface PlanComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  currentPlan?: string;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  visible,
  onClose,
  onSelectPlan,
  currentPlan,
}) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const availablePlans = await subscriptionService.getAvailablePlans();
      setPlans(availablePlans);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan) {
      Alert.alert('Info', 'You are already on this plan.');
      return;
    }
    setSelectedPlanId(plan.id);
    onSelectPlan(plan);
  };

  const getPriceDisplay = (plan: SubscriptionPlan): string => {
    if (plan.first_month_price === 0 && plan.recurring_price === 0) {
      return '₹0/month';
    }
    if (plan.first_month_price === 0) {
      return `₹${plan.recurring_price}/month`;
    }
    return `₹${plan.first_month_price} (30 days)\nThen ₹${plan.recurring_price}/month`;
  };

  const getButtonLabel = (plan: SubscriptionPlan): string => {
    if (plan.id === currentPlan) {
      return 'CURRENT PLAN';
    }
    if (currentPlan && plan.recurring_price > getPlanPrice(currentPlan)) {
      return 'UPGRADE';
    }
    if (plan.first_month_price > 0) {
      return 'GET STARTED';
    }
    return 'SELECT';
  };

  const getPlanPrice = (planId: string): number => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.recurring_price ?? 0;
  };

  const renderFeatureList = (features: Record<string, any>) => {
    const featureItems = Object.entries(features).map(([key, value]) => {
      const featureName = key
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const displayValue =
        value === true ? 'Included' : value === false ? 'Not included' : value;

      return {
        name: featureName,
        included: value === true || value === 'unlimited' || value === 'Unlimited',
        value: displayValue,
      };
    });

    return featureItems;
  };

  if (loading && plans.length === 0) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Plans Grid */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.plansContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Choose the plan that works best for you
          </Text>

          {/* Plans */}
          <View style={styles.plansGrid}>
            {plans.map((plan, index) => (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.id === currentPlan && styles.currentPlanCard,
                  plan.first_month_price > 0 &&
                    index === 1 &&
                    styles.recommendedCard,
                ]}
              >
                {/* Recommended Badge */}
                {plan.first_month_price > 0 && index === 1 && (
                  <View style={styles.recommendedBadge}>
                    <MaterialIcons
                      name="stars"
                      size={14}
                      color="#fff"
                    />
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                {/* Plan Name */}
                <Text style={styles.planName}>{plan.name}</Text>

                {/* Price */}
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.price}>{getPriceDisplay(plan)}</Text>

                {/* Trial Info */}
                {plan.trial_days && plan.trial_days > 0 && (
                  <View style={styles.trialBadge}>
                    <Text style={styles.trialText}>
                      {plan.trial_days}-day free trial
                    </Text>
                  </View>
                )}

                {/* Features List */}
                <View style={styles.featuresList}>
                  {renderFeatureList(plan.features).map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <MaterialIcons
                        name={
                          feature.included
                            ? 'check-circle'
                            : 'cancel'
                        }
                        size={16}
                        color={
                          feature.included
                            ? colors.success
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.featureText,
                          !feature.included &&
                            styles.featureTextDisabled,
                        ]}
                      >
                        {feature.name}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Select Button */}
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    plan.id === currentPlan
                      ? styles.currentButton
                      : styles.activeButton,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  disabled={plan.id === currentPlan}
                >
                  <Text
                    style={
                      plan.id === currentPlan
                        ? styles.currentButtonText
                        : styles.activeButtonText
                    }
                  >
                    {getButtonLabel(plan)}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <MaterialIcons
                name="verified"
                size={20}
                color={colors.success}
              />
              <Text style={styles.infoText}>30-day money-back guarantee</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons
                name="autorenew"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>Auto-renews unless cancelled</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons
                name="done-all"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>Cancel anytime - no questions asked</Text>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.faqSection}>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                ❓ Can I upgrade or downgrade anytime?
              </Text>
              <Text style={styles.faqAnswer}>
                Yes! You can upgrade, downgrade, or cancel your subscription anytime.
                Changes take effect immediately.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                ❓ When will I be charged?
              </Text>
              <Text style={styles.faqAnswer}>
                For trial plans: ₹1 for the first 30 days, then ₹99/month on the
                anniversary of your subscription.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                ❓ What if payment fails?
              </Text>
              <Text style={styles.faqAnswer}>
                We'll automatically retry your payment for 3 days. If it fails, you'll
                go back to the free plan. You can update your payment method anytime.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                ❓ How do I cancel?
              </Text>
              <Text style={styles.faqAnswer}>
                You can cancel anytime from your Account Settings. Your access will
                continue until the end of your billing cycle.
              </Text>
            </View>
          </View>

          {/* Terms Footer */}
          <Text style={styles.termsFooter}>
            By selecting a plan, you agree to our Terms of Service and Privacy
            Policy. All prices in INR.
          </Text>
        </ScrollView>
      </View>
    </Modal>
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
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
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
  content: {
    flex: 1,
  },
  plansContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  plansGrid: {
    marginBottom: spacing.xl,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#e8eaed',
    position: 'relative',
  },
  currentPlanCard: {
    borderColor: colors.primary,
    backgroundColor: '#f0f4ff',
  },
  recommendedCard: {
    borderColor: colors.warning,
    backgroundColor: '#fffbf0',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  recommendedText: {
    marginLeft: spacing.xs,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
    lineHeight: 26,
  },
  trialBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  trialText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  featuresList: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureText: {
    marginLeft: spacing.sm,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  featureTextDisabled: {
    color: colors.textSecondary,
  },
  selectButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  activeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  currentButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currentButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoText: {
    marginLeft: spacing.md,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  faqSection: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  faqItem: {
    marginBottom: spacing.md,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  termsFooter: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
});
