import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface WithdrawalSuccessScreenProps {
  withdrawalData: {
    withdrawalId: string;
    amount: string;
    coinsDeducted: number;
    remainingCoins: number;
  };
  onClose: () => void;
  onGoToDashboard: () => void;
}

export const WithdrawalSuccessScreen: React.FC<WithdrawalSuccessScreenProps> = ({
  withdrawalData,
  onClose,
  onGoToDashboard,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [checkAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const checkmarkScale = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <MaterialIcons name="check-circle" size={80} color={colors.success} />
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Withdrawal Submitted!</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth },
            ]}
          />
        </View>

        {/* Status Message */}
        <Text style={styles.statusText}>
          Your withdrawal request has been sent to our admin team for review and processing.
        </Text>

        {/* Withdrawal Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>₹{withdrawalData.amount}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="monetization-on" size={24} color={colors.warning} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Coins Deducted</Text>
              <Text style={styles.detailValue}>{withdrawalData.coinsDeducted} coins</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="account-balance" size={24} color={colors.primary} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>New Balance</Text>
              <Text style={styles.detailValue}>{withdrawalData.remainingCoins} coins</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="receipt" size={24} color={colors.secondary} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Withdrawal ID</Text>
              <Text style={styles.detailValue}>{withdrawalData.withdrawalId}</Text>
            </View>
          </View>
        </View>

        {/* Processing Info */}
        <View style={styles.processingContainer}>
          <MaterialIcons name="schedule" size={20} color={colors.textSecondary} />
          <Text style={styles.processingText}>
            Processing time: 1-3 business days
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onGoToDashboard}
          >
            <MaterialIcons name="dashboard" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onClose}
          >
            <MaterialIcons name="close" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  checkmarkContainer: {
    backgroundColor: colors.successLight,
    borderRadius: 50,
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  processingText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});

export default WithdrawalSuccessScreen;