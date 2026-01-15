
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
import { premiumFeatureService } from '../services/premiumFeatureService';

interface ProfileLockSectionProps {
  userId: string;
  userName: string;
  userEmail: string;
  onUpgradePress: () => void;
  onProfilePress?: () => void;
}

interface ProfileUpgradeCardProps {
  isPremium: boolean;
  onUpgradePress: () => void;
  loading?: boolean;
}

export const ProfileLockSection: React.FC<ProfileLockSectionProps> = ({
  userId,
  userName,
  userEmail,
  onUpgradePress,
  onProfilePress,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, [userId]);

  const checkPremiumStatus = async () => {
    try {
      setLoading(true);
      const status = await premiumFeatureService.getSubscriptionStatus(userId);
      setIsPremium(status.isPremium);
    } catch (error) {
      console.error('[ProfileLockSection] Error checking premium status:', error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={50} color={colors.white} />
        </View>
        {!isPremium && (
          <View style={styles.lockBadge}>
            <MaterialIcons name="lock" size={16} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>

        <View
          style={[
            styles.statusBadge,
            isPremium ? styles.statusBadgePremium : styles.statusBadgeFree,
          ]}
        >
          <MaterialIcons
            name={isPremium ? 'verified' : 'trending-up'}
            size={16}
            color={isPremium ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.statusText,
              isPremium ? styles.statusTextPremium : styles.statusTextFree,
            ]}
          >
            {isPremium ? 'Premium Member' : 'Upgrade'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const ProfileUpgradeCard: React.FC<ProfileUpgradeCardProps> = ({
  isPremium,
  onUpgradePress,
  loading = false,
}) => {
  if (isPremium) {
    return null;
  }

  return (
    <View style={styles.upgradeCardContainer}>
      <View style={styles.lockIcon}>
        <MaterialIcons name="lock" size={40} color={colors.primary} />
      </View>

      <Text style={styles.upgradeTitle}>Premium Features Locked</Text>
      <Text style={styles.upgradeDescription}>
        Unlock all features and enjoy unlimited access to:
      </Text>

      <View style={styles.featuresList}>
        <UpgradeFeatureItem
          icon="psychology"
          text="AI-Powered Questions"
        />
        <UpgradeFeatureItem
          icon="video-library"
          text="Video Summaries"
        />
        <UpgradeFeatureItem
          icon="analytics"
          text="Advanced Analytics"
        />
        <UpgradeFeatureItem
          icon="bolt"
          text="Priority Support"
        />
      </View>

      <Text style={styles.upgradePromptText}>
        Subscribe to unlock all premium features
      </Text>

      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={onUpgradePress}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <MaterialIcons name="lock-open" size={20} color={colors.white} />
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.pricingText}>
        ₹1 first month, then ₹99/month • Cancel anytime
      </Text>
    </View>
  );
};

interface UpgradeFeatureItemProps {
  icon: string;
  text: string;
}

const UpgradeFeatureItem: React.FC<UpgradeFeatureItemProps> = ({
  icon,
  text,
}) => (
  <View style={styles.featureItemContainer}>
    <MaterialIcons name={icon as any} size={20} color={colors.success} />
    <Text style={styles.featureItemText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lockBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    ...shadows.md,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.body.fontSize,
    fontWeight: '400' as const,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusBadgeFree: {
    backgroundColor: '#FFE5E5',
  },
  statusBadgePremium: {
    backgroundColor: '#E5F5E5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusTextFree: {
    color: colors.error,
  },
  statusTextPremium: {
    color: colors.success,
  },

  // ProfileUpgradeCard styles
  upgradeCardContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.md,
    ...shadows.md,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  upgradeTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: typography.body.fontSize,
    fontWeight: '400' as const,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresList: {
    width: '100%',
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  upgradePromptText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
    width: '100%',
    ...shadows.md,
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  pricingText: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // UpgradeFeatureItem
  featureItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  featureItemText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
});
