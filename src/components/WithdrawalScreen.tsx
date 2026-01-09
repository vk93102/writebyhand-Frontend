import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { getUserCoins, requestCoinWithdrawal } from '../services/api';

interface WithdrawalScreenProps {
  userId: string;
  onClose: () => void;
  onWithdrawalSuccess: (data: {
    withdrawalId: string;
    amount: string;
    coinsDeducted: number;
    remainingCoins: number;
  }) => void;
}

export const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({
  userId,
  onClose,
  onWithdrawalSuccess,
}) => {
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Simple form states
  const [coinsAmount, setCoinsAmount] = useState('');
  const [userEmail, setUserEmail] = useState('');
  // Payout details
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Animation values
  const [loadingOverlayAnim] = useState(new Animated.Value(0));
  const [loadingScaleAnim] = useState(new Animated.Value(0.8));
  const [loadingRotateAnim] = useState(new Animated.Value(0));

  // Helper function to stop loading animations
  const stopLoadingAnimations = () => {
    Animated.parallel([
      Animated.timing(loadingOverlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(loadingScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      loadingRotateAnim.stopAnimation();
      loadingRotateAnim.setValue(0);
    });
  };

  useEffect(() => {
    if (userId) {
      loadUserCoins();
    }
  }, [userId]);

  // Removed Razorpay key loading (payouts are processed server-side)

  const loadUserCoins = async () => {
    try {
      const data = await getUserCoins(userId);
      console.log('Loaded user coins:', data);
      setUserCoins(data.total_coins || 0);
    } catch (error: any) {
      console.error('Failed to load coins:', error);
    }
  };

  const handleRequestWithdrawal = async () => {
    try {
      // Clear previous errors
      setErrorMessage('');
      
      // Trim input
      const coinsInput = coinsAmount.trim();
      const emailInput = userEmail.trim();
      
      // Optional email validation (used for contact purposes)
      if (emailInput) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailInput)) {
          const msg = 'Please enter a valid email address';
          setErrorMessage(msg);
          Alert.alert('Invalid Email', msg);
          return;
        }
      }
      
      // Validate coins amount
      if (!coinsInput) {
        setErrorMessage('Please enter the number of coins to withdraw');
        Alert.alert('Required Field', 'Please enter the number of coins to withdraw');
        return;
      }

      const coins = parseInt(coinsInput);
      if (isNaN(coins) || coins <= 0) {
        const msg = 'Please enter a valid number of coins';
        setErrorMessage(msg);
        Alert.alert('Invalid Amount', msg);
        return;
      }

      if (coins < 100) {
        const msg = 'Minimum withdrawal is 100 coins (₹10)';
        setErrorMessage(msg);
        Alert.alert('Minimum Withdrawal', msg);
        return;
      }

      if (coins > userCoins) {
        const msg = `Insufficient balance. You have ${userCoins} coins`;
        setErrorMessage(msg);
        Alert.alert('Insufficient Balance', `You only have ${userCoins} coins available. Please enter a lower amount.`);
        return;
      }

      // Validate account holder name
      if (!accountHolderName.trim()) {
        const msg = 'Account holder name is required';
        setErrorMessage(msg);
        Alert.alert('Required Field', msg);
        return;
      }

      // Validate payout method specific fields
      if (payoutMethod === 'upi') {
        const upiTrimmed = upiId.trim();
        if (!upiTrimmed) {
          const msg = 'UPI ID is required for UPI payout';
          setErrorMessage(msg);
          Alert.alert('Required Field', msg);
          return;
        }
        
        // Validate UPI format (e.g., user@ybl, user@okhdfcbank)
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
        if (!upiRegex.test(upiTrimmed)) {
          const msg = 'Invalid UPI ID format. Example: yourname@ybl';
          setErrorMessage(msg);
          Alert.alert('Invalid Format', msg);
          return;
        }
      } else if (payoutMethod === 'bank') {
        const accountTrimmed = accountNumber.trim();
        const ifscTrimmed = ifscCode.trim();

        if (!accountTrimmed || !ifscTrimmed) {
          const msg = 'Account number and IFSC code are required for bank transfer';
          setErrorMessage(msg);
          Alert.alert('Required Field', msg);
          return;
        }

        // Validate account number (9-18 digits)
        if (!/^\d{9,18}$/.test(accountTrimmed)) {
          const msg = 'Invalid account number. Must be 9-18 digits';
          setErrorMessage(msg);
          Alert.alert('Invalid Format', msg);
          return;
        }

        // Validate IFSC code format (e.g., SBIN0001234)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifscTrimmed)) {
          const msg = 'Invalid IFSC code format. Example: SBIN0001234';
          setErrorMessage(msg);
          Alert.alert('Invalid Format', msg);
          return;
        }
      }

      // Submit withdrawal request to backend
      setLoading(true);
      setErrorMessage('');

      // Start loading animations
      Animated.parallel([
        Animated.timing(loadingOverlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(loadingScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      const response = await requestCoinWithdrawal(
        userId,
        coins,
        payoutMethod,
        accountHolderName.trim(),
        payoutMethod === 'upi' ? upiId.trim() : undefined,
        payoutMethod === 'bank' ? accountNumber.trim() : undefined,
        payoutMethod === 'bank' ? ifscCode.trim() : undefined
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to submit withdrawal request');
      }

      // Success response with withdrawal details
      const withdrawalAmount = response.data?.rupees_amount || (coins / 10).toFixed(2);
      const withdrawalId = response.data?.withdrawal_id || 'N/A';
      const remainingCoins = response.data?.remaining_coins || (userCoins - coins);

      // Reset form
      setCoinsAmount('');
      setUserEmail('');
      setAccountHolderName('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      setErrorMessage('');

      // Notify parent component with withdrawal data
      onWithdrawalSuccess({
        withdrawalId,
        amount: withdrawalAmount,
        coinsDeducted: coins,
        remainingCoins,
      });

      stopLoadingAnimations();
      setLoading(false);
    } catch (error: any) {
      let errMsg = 'Failed to process withdrawal';
      if (error.message) {
        errMsg = error.message;
      }
      setErrorMessage(errMsg);
      Alert.alert('Error', errMsg);
      stopLoadingAnimations();
      setLoading(false);
    }
  };

  // Helper function to calculate rupees from coins
  const calculateRupees = () => {
    const coins = parseInt(coinsAmount);
    if (isNaN(coins)) return '0.00';
    return (coins / 10).toFixed(2);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
          <Image source={require('../../assets/coins.png')} style={styles.headerImage} />
          <Text style={styles.headerTitle}>Withdraw Coins</Text>
        </View>
      </View>

      {/* Coin Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <MaterialIcons name="account-balance-wallet" size={32} color={colors.primary} />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{userCoins} Coins</Text>
            <Text style={styles.balanceRupees}>≈ ₹{(userCoins / 10).toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.conversionInfo}>
          <MaterialIcons name="info-outline" size={16} color={colors.textMuted} />
          <Text style={styles.conversionText}>10 Coins = ₹1</Text>
        </View>
      </View>

      {/* Withdrawal Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Withdrawal Details</Text>

        {/* Error Message Display */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={20} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Account Holder Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Account Holder Name</Text>
          <TextInput
            style={[styles.input, errorMessage && !accountHolderName.trim() ? styles.inputError : null]}
            placeholder="Full name"
            placeholderTextColor={colors.textMuted}
            value={accountHolderName}
            onChangeText={(val) => {
              setAccountHolderName(val);
              setErrorMessage('');
            }}
          />
        </View>

        {/* Coins Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Coins to Withdraw (Min: 100)</Text>
          <TextInput
            style={[styles.input, errorMessage && !coinsAmount.trim() ? styles.inputError : null]}
            placeholder="Enter coins amount"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={coinsAmount}
            onChangeText={(val) => {
              setCoinsAmount(val);
              setErrorMessage('');
            }}
          />
          {coinsAmount && (
            <Text style={styles.conversionHint}>= ₹{calculateRupees()}</Text>
          )}
        </View>

        {/* Payout Method */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Payout Method</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity
              style={[styles.methodButton, payoutMethod === 'upi' ? styles.methodButtonActive : null]}
              onPress={() => setPayoutMethod('upi')}
            >
              <MaterialIcons name="payments" size={18} color={payoutMethod === 'upi' ? colors.white : colors.text} />
              <Text style={[styles.methodButtonText, payoutMethod === 'upi' ? { color: colors.white } : null]}>UPI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, payoutMethod === 'bank' ? styles.methodButtonActive : null]}
              onPress={() => setPayoutMethod('bank')}
            >
              <MaterialIcons name="account-balance" size={18} color={payoutMethod === 'bank' ? colors.white : colors.text} />
              <Text style={[styles.methodButtonText, payoutMethod === 'bank' ? { color: colors.white } : null]}>Bank Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* UPI Details */}
        {payoutMethod === 'upi' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>UPI ID</Text>
            <TextInput
              style={[styles.input, errorMessage && !upiId.trim() ? styles.inputError : null]}
              placeholder="yourupi@bank"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={upiId}
              onChangeText={(val) => {
                setUpiId(val);
                setErrorMessage('');
              }}
            />
          </View>
        )}

        {/* Bank Details */}
        {payoutMethod === 'bank' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Account Number</Text>
            <TextInput
              style={[styles.input, errorMessage && !accountNumber.trim() ? styles.inputError : null]}
              placeholder="Account number"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              autoCapitalize="none"
              value={accountNumber}
              onChangeText={(val) => {
                setAccountNumber(val);
                setErrorMessage('');
              }}
            />
            <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>IFSC Code</Text>
            <TextInput
              style={[styles.input, errorMessage && !ifscCode.trim() ? styles.inputError : null]}
              placeholder="IFSC code"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={ifscCode}
              onChangeText={(val) => {
                setIfscCode(val);
                setErrorMessage('');
              }}
            />
          </View>
        )}

        {/* Payout Info */}
        <View style={styles.paymentInfo}>
          <MaterialIcons name="info" size={20} color={colors.primary} />
          <Text style={styles.paymentInfoText}>
            Submit your withdrawal request. Our backend will process a payout to your UPI or bank account. Processing may take 1-3 business days.
          </Text>
        </View>

        {/* Request Withdrawal Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleRequestWithdrawal}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color={colors.white} />
              <Text style={styles.payButtonText}>⚡ Withdraw Now (Auto-Approved)</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.processingNote}>
          * Payouts are processed securely via Razorpay (server-side)
        </Text>
      </View>
    </ScrollView>

      {/* Loading Overlay */}
      <Animated.View
        style={[
          styles.loadingOverlay,
          {
            opacity: loadingOverlayAnim,
            transform: [{ scale: loadingScaleAnim }],
          },
        ]}
        pointerEvents={loading ? 'auto' : 'none'}
      >
        <View style={styles.loadingContent}>
          <Animated.View
            style={[
              styles.loadingSpinner,
              {
                transform: [
                  {
                    rotate: loadingRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialIcons name="sync" size={60} color={colors.white} />
          </Animated.View>
          <Text style={styles.loadingText}>Processing your withdrawal...</Text>
          <Text style={styles.loadingSubtext}>Sending request to admin for approval</Text>
        </View>
      </Animated.View>
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
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerImage: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  balanceCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  balanceInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  balanceAmount: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.xs,
  },
  balanceRupees: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  conversionText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  conversionHint: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  paymentInfoText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  processingNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  autoApprovalBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    gap: 8,
  },
  autoApprovalText: {
    flex: 1,
  },
  autoApprovalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  autoApprovalSubtitle: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
    minWidth: 280,
  },
  loadingSpinner: {
    marginBottom: spacing.lg,
  },
  loadingText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
