/**
 * Pricing Card Component
 * Displays individual pricing plan with lock icon support
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { FeatureLockIcon } from './FeatureLockIcon';
import { premiumFeatureService, SubscriptionStatus } from '../services/premiumFeatureService';

interface PricingCardProps {
  plan: 'free' | 'scholar' | 'genius';
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  onSubscribe: () => void;
  isPopular?: boolean;
  userId: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  name,
  price,
  period,
  description,
  features,
  onSubscribe,
  isPopular = false,
  userId,
}) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [userId]);

  const loadSubscriptionStatus = async () => {
    try {
      const status = await premiumFeatureService.getSubscriptionStatus(userId);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('[PricingCard] Error loading status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already subscribed
  const isCurrentPlan = subscriptionStatus?.isPremium && subscriptionStatus?.plan !== 'free';
  const isLocked = plan !== 'free' && !subscriptionStatus?.isPremium;

  return (
    <View
      style={[
        styles.card,
        isPopular && styles.popularCard,
        isCurrentPlan && styles.currentPlan,
      ]}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.badgeText}>MOST POPULAR</Text>
        </View>
      )}

      {isCurrentPlan && (
        <View style={styles.currentBadge}>
          <MaterialIcons name="check-circle" size={20} color={colors.success} />
          <Text style={styles.currentText}>Current Plan</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.period}>{period}</Text>
      </View>

      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <MaterialIcons
              name="check-circle"
              size={16}
              color={isLocked ? colors.gray400 : colors.success}
            />
            <Text
              style={[
                styles.featureText,
                isLocked && styles.lockedFeatureText,
              ]}
            >
              {feature}
            </Text>
            {isLocked && (
              <FeatureLockIcon locked={true} size="small" showLabel={false} />
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isCurrentPlan && styles.buttonDisabled,
          isPopular && styles.buttonPrimary,
        ]}
        onPress={onSubscribe}
        disabled={isCurrentPlan || loading}
        activeOpacity={isCurrentPlan ? 1 : 0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text
            style={[
              styles.buttonText,
              isCurrentPlan && styles.buttonTextDisabled,
            ]}
          >
            {isCurrentPlan ? 'Current Plan' : plan === 'free' ? 'Get Started' : 'Subscribe Now'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  popularCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '05',
  },
  currentPlan: {
    borderColor: colors.success,
    borderWidth: 2,
    backgroundColor: colors.success + '05',
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  currentText: {
    color: colors.success,
    fontSize: typography.size.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  header: {
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  period: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  featureList: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  lockedFeatureText: {
    color: colors.gray400,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.gray300,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default PricingCard;
