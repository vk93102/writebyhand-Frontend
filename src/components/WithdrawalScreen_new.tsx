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
  Dimensions,
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
        if (!upiId.trim()) {
          setErrorMessage('UPI ID is required');
          Alert.alert('Required Field', 'Please enter your UPI ID');
          return;
        }
        // Simple UPI validation
        if (!upiId.includes('@')) {
          const msg = 'Invalid UPI ID format';
          setErrorMessage(msg);
          Alert.alert('Invalid UPI', msg);
          return;
        }
      } else {
        // Bank transfer validation
        if (!accountNumber.trim()) {
          setErrorMessage('Account number is required');
          Alert.alert('Required Field', 'Please enter your account number');
          return;
        }
        if (!ifscCode.trim()) {
          setErrorMessage('IFSC code is required');
          Alert.alert('Required Field', 'Please enter IFSC code');
          return;
        }
      }

      // Initiate loading animation
      setLoading(true);
      Animated.parallel([
        Animated.timing(loadingOverlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(loadingScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(loadingRotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();

      // Prepare withdrawal request
      const withdrawalData = {
        email: emailInput,
        coins_to_withdraw: coins,
        account_holder_name: accountHolderName,
        payout_method: payoutMethod,
        ...(payoutMethod === 'upi' ? { upi_id: upiId } : {
          account_number: accountNumber,
          ifsc_code: ifscCode,
        }),
      };

      const response = await requestCoinWithdrawal(userId, withdrawalData);

      const {
        withdrawal_id: withdrawalId,
        amount,
        coins_deducted: coinsDeducted,
        remaining_coins: remainingCoins,
      } = response;

      // Notify of success
      Alert.alert('Success', 'Withdrawal request submitted for approval! You will receive an email confirmation shortly.');

      // Reset form
      setCoinsAmount('');
      setUserEmail('');
      setAccountHolderName('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      setErrorMessage('');

      // Update UI
      setUserCoins(remainingCoins);

      // Call success callback
      onWithdrawalSuccess({
        withdrawalId,
        amount,
        coinsDeducted,
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
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContainer}>
          {/* Left Side - Security Illustration */}
          <View style={styles.leftSide}>
            <View style={styles.imageContainer}>
              <Image
                source={require('../../assets/signin.png')}
                style={styles.securityImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Right Side - Withdrawal Form */}
          <View style={styles.rightSide}>
            <View style={styles.formContainer}>
              {/* Close Button */}
              <TouchableOpacity onPress={onClose} style={styles.closeButtonForm}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Form Title */}
              <Text style={styles.formTitle}>Withdraw Coins</Text>
              <Text style={styles.formSubtitle}>Convert your coins to real money</Text>

              {/* Coin Balance Card */}
              <View style={styles.balanceCardForm}>
                <View style={styles.balanceRowForm}>
                  <MaterialIcons name="account-balance-wallet" size={28} color={colors.primary} />
                  <View style={styles.balanceInfoForm}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>{userCoins} Coins</Text>
                    <Text style={styles.balanceRupees}>≈ ₹{(userCoins / 10).toFixed(2)}</Text>
                  </View>
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
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Account Number</Text>
                      <TextInput
                        style={[styles.input, errorMessage && !accountNumber.trim() ? styles.inputError : null]}
                        placeholder="Enter account number"
                        placeholderTextColor={colors.textMuted}
                        value={accountNumber}
                        onChangeText={(val) => {
                          setAccountNumber(val);
                          setErrorMessage('');
                        }}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>IFSC Code</Text>
                      <TextInput
                        style={[styles.input, errorMessage && !ifscCode.trim() ? styles.inputError : null]}
                        placeholder="SBIN0001234"
                        placeholderTextColor={colors.textMuted}
                        value={ifscCode}
                        onChangeText={(val) => {
                          setIfscCode(val);
                          setErrorMessage('');
                        }}
                      />
                    </View>
                  </>
                )}

                {/* Email (Optional) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email (Optional)</Text>
                  <TextInput
                    style={[styles.input, errorMessage && userEmail && !userEmail.includes('@') ? styles.inputError : null]}
                    placeholder="your.email@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={userEmail}
                    onChangeText={(val) => {
                      setUserEmail(val);
                      setErrorMessage('');
                    }}
                  />
                </View>

                {/* Auto-Approval Banner */}
                <View style={styles.autoApprovalBanner}>
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <View style={styles.autoApprovalText}>
                    <Text style={styles.autoApprovalTitle}>Auto-Approved</Text>
                    <Text style={styles.autoApprovalSubtitle}>Your withdrawal will be auto-approved and processed within 24-48 hours</Text>
                  </View>
                </View>

                {/* Withdraw Button */}
                <TouchableOpacity
                  style={[styles.payButton, loading ? styles.payButtonDisabled : null]}
                  onPress={handleRequestWithdrawal}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <MaterialIcons name="payment" size={20} color={colors.white} />
                      <Text style={styles.payButtonText}>Request Withdrawal</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Processing Note */}
                <Text style={styles.processingNote}>
                  Your request will be reviewed and processed within 24-48 hours
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      <Animated.View
        style={[
          styles.loadingOverlay,
          {
            opacity: loadingOverlayAnim,
            pointerEvents: loading ? 'auto' : 'none',
          },
        ]}
      >
        <View style={styles.loadingContent}>
          <Animated.View
            style={[
              styles.loadingSpinner,
              {
                transform: [
                  {
                    scale: loadingScaleAnim,
                  },
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
  scrollContainer: {
    flex: 1,
  },
  mainContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flex: 1,
    minHeight: Platform.OS === 'web' ? 'auto' : '100%',
  },
  leftSide: {
    flex: Platform.OS === 'web' ? 1 : 0,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 0 : spacing.xl,
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  imageContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? Dimensions.get('window').height * 0.8 : 250,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  securityImage: {
    width: '100%',
    height: '100%',
  },
  rightSide: {
    flex: Platform.OS === 'web' ? 1 : 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
  },
  closeButtonForm: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  formTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  formSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  balanceCardForm: {
    backgroundColor: '#F0F4FF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.lg,
  },
  balanceRowForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  balanceInfoForm: {
    flex: 1,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  balanceRupees: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
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
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  autoApprovalBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D1FAE5',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    gap: spacing.sm,
  },
  autoApprovalText: {
    flex: 1,
  },
  autoApprovalTitle: {
    ...typography.body,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: spacing.xs,
  },
  autoApprovalSubtitle: {
    ...typography.caption,
    color: '#047857',
    lineHeight: 18,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
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

export default WithdrawalScreen;
