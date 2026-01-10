/**
 * Upgrade Prompt Modal
 * Shows when user hits feature limit and prompts them to upgrade
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import { subscriptionService } from '../services/subscriptionService';

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName: string;
  used: number;
  limit: number;
  resetDate?: string;
  message?: string;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  featureName,
  used,
  limit,
  resetDate,
  message,
}) => {
  const [loading, setLoading] = useState(false);

  const getDefaultMessage = (): string => {
    if (message) return message;
    return `You've used all ${limit} ${featureName.toLowerCase()} for this month. Upgrade to unlimited access for just ₹1 for 30 days, then ₹99/month.`;
  };

  const getResetMessage = (): string => {
    if (!resetDate) {
      return 'Your limits will reset on the 1st of next month.';
    }
    const date = new Date(resetDate);
    return `Your limits will reset on ${date.toLocaleDateString()}.`;
  };

  const handleUpgradePress = async () => {
    setLoading(true);
    onUpgrade();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="upgrade"
              size={56}
              color={colors.warning}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Monthly Limit Reached</Text>

          {/* Feature Info */}
          <View style={styles.infoBox}>
            <MaterialIcons
              name="info-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              {featureName}: {used}/{limit}
            </Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{getDefaultMessage()}</Text>

          {/* Reset Info */}
          <View style={styles.resetInfo}>
            <MaterialIcons
              name="schedule"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.resetText}>{getResetMessage()}</Text>
          </View>

          {/* Benefits Box */}
          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>Upgrade to BASIC for ₹1:</Text>
            <View style={styles.benefitItem}>
              <MaterialIcons
                name="check"
                size={18}
                color={colors.success}
              />
              <Text style={styles.benefitText}>Unlimited {featureName}</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons
                name="check"
                size={18}
                color={colors.success}
              />
              <Text style={styles.benefitText}>
                Unlimited Quizzes & Flashcards
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons
                name="check"
                size={18}
                color={colors.success}
              />
              <Text style={styles.benefitText}>30-day trial (then ₹99/month)</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons
                name="check"
                size={18}
                color={colors.success}
              />
              <Text style={styles.benefitText}>Cancel anytime - no questions</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.upgradeButton]}
              onPress={handleUpgradePress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons
                    name="local-offer"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.upgradeButtonText}>
                    UPGRADE NOW - ₹1
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.notNowButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.notNowButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            ✓ 30-day money-back guarantee{'\n'}
            ✓ Auto-renews unless cancelled{'\n'}
            ✓ Cancel anytime
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  infoText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  resetText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  benefitsBox: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitText: {
    marginLeft: spacing.sm,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  actions: {
    marginBottom: spacing.lg,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
  },
  upgradeButtonText: {
    marginLeft: spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  notNowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  notNowButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  termsText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
