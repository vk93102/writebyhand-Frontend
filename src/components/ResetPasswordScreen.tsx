import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { requestPasswordReset, validateResetToken, resetPassword } from '../services/api';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface ResetPasswordScreenProps {
  onClose: () => void;
  onBackToLogin: () => void;
  initialToken?: string; // Token from email link
}

type ResetStep = 'request' | 'reset';

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onClose,
  onBackToLogin,
  initialToken,
}) => {
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const isMobile = width < 768;
  const [step, setStep] = useState<ResetStep>(initialToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleRequestReset = async () => {
    Keyboard.dismiss();

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await requestPasswordReset(email);
      
      if (response.success) {
        setResetEmail(email);
        Alert.alert(
          'Email Sent',
          'We have sent a password reset link to your email. Please check your inbox and follow the instructions.',
          [{ text: 'OK' }]
        );
        setEmail('');
      } else {
        Alert.alert('Error', response.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateToken = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter the reset token from your email');
      return;
    }

    try {
      setLoading(true);
      const response = await validateResetToken(token);
      
      if (response.success) {
        setResetEmail(response.data.email);
        setStep('reset');
      } else {
        Alert.alert('Error', response.error || 'Invalid or expired token');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to validate token');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please enter your new password in both fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword(token, newPassword);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. You can now login with your new password.',
          [
            {
              text: 'OK',
              onPress: onBackToLogin,
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to reset password');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch' }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Left brand section - hidden on mobile */}
        {!isMobile && (
          <View style={styles.leftSection}>
            <View style={styles.brandSection}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="school" size={40} color={colors.primary} />
              </View>
              <Text style={styles.brandTitle}>Unlock Your Potential</Text>
              <Text style={styles.brandSubtitle}>
                Elevate your learning experience with our innovative AI-powered study tools and resources to support your growth.
              </Text>
            </View>
          </View>
        )}

        {/* Right form section */}
        <View style={styles.rightSection}>
          <View style={[styles.formContainer, isMobile && styles.formContainerMobile]}>
            {/* Mobile logo */}
            {isMobile && (
              <View style={styles.mobileLogoContainer}>
                <View style={styles.logoCircle}>
                  <MaterialIcons name="lock-reset" size={40} color={colors.primary} />
                </View>
              </View>
            )}

            {step === 'request' && !initialToken ? (
              <>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Don't worry! It happens. Please enter the email associated with your account.
                </Text>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email address"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleRequestReset}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.submitButtonText}>Send Reset Link</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.switchMode}>
                    <Text style={styles.switchModeText}>Remember your password? </Text>
                    <TouchableOpacity onPress={onBackToLogin}>
                      <Text style={styles.switchModeLink}>Log in</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.switchMode}>
                    <Text style={styles.switchModeText}>Already have a reset token? </Text>
                    <TouchableOpacity onPress={() => setStep('reset')}>
                      <Text style={styles.switchModeLink}>Enter token</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your new password below.
                </Text>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor={colors.textMuted}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        editable={!loading}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <MaterialIcons
                          name={showPassword ? 'visibility' : 'visibility-off'}
                          size={20}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor={colors.textMuted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!loading}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <MaterialIcons
                          name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                          size={20}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.submitButtonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.switchMode}>
                    <Text style={styles.switchModeText}>Remember your password? </Text>
                    <TouchableOpacity onPress={onBackToLogin}>
                      <Text style={styles.switchModeLink}>Log in</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  leftSection: {
    flex: 1,
    backgroundColor: '#E8F2FF',
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  brandSection: {
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  rightSection: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
  },
  formContainerMobile: {
    maxWidth: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  mobileLogoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
    height: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 48,
    ...shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  switchModeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchModeLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
