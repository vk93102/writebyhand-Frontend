import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';
import { loginUser, registerUser } from '../services/api';

const brainPayLogo = require('../../assets/logo.png');

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'signup';

type Provider = 'email' | 'guest';

const mapUserPayload = (payload: any, provider: Provider) => {
  if (!payload) {
    return null;
  }
  const data = payload?.data ?? payload;
  return {
    id: data?.user_id ?? data?.id ?? null,
    username: data?.username ?? '',
    email: data?.email ?? '',
    fullName: data?.full_name ?? data?.fullName ?? '',
    token: data?.token,
    provider,
  };
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAuthError = () => setError(null);

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    resetAuthError();
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      const message = 'Enter both your email/username and password.';
      setError(message);
      Alert.alert('Missing Details', message);
      return;
    }

    try {
      setLoading(true);
      resetAuthError();
      const result = await loginUser(identifier.trim(), password);
      const mappedUser = mapUserPayload(result?.data, 'email');
      if (!mappedUser) {
        throw new Error('Invalid login response received.');
      }
      onAuthSuccess(mappedUser);
    } catch (err: any) {
      const message = err?.message || 'Unable to log in right now.';
      setError(message);
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupFullName.trim() || !signupUsername.trim() || !signupEmail.trim() || !password.trim()) {
      const message = 'Fill out all fields to continue.';
      setError(message);
      Alert.alert('Missing Details', message);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim().toLowerCase())) {
      const message = 'Please enter a valid email address.';
      setError(message);
      Alert.alert('Invalid Email', message);
      return;
    }

    try {
      setLoading(true);
      resetAuthError();
      const result = await registerUser(
        signupUsername.trim(),
        signupEmail.trim().toLowerCase(),
        password,
        signupFullName.trim()
      );
      const mappedUser = mapUserPayload(result?.data, 'email');
      if (!mappedUser) {
        throw new Error('Invalid signup response received.');
      }
      onAuthSuccess(mappedUser);
    } catch (err: any) {
      const message = err?.message || 'Unable to create an account right now.';
      setError(message);
      Alert.alert('Sign Up Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      resetAuthError();
      const timestamp = Date.now();
      const guestUsername = `guest_${timestamp}`;
      const guestEmail = `guest_${timestamp}@vaida.app`;
      const guestPassword = `Guest@${timestamp}`;

      const result = await registerUser(guestUsername, guestEmail, guestPassword, 'Guest User');
      const mappedUser = mapUserPayload(result?.data, 'guest');
      if (!mappedUser) {
        throw new Error('Unable to start a guest session.');
      }
      onAuthSuccess(mappedUser);
    } catch (err: any) {
      const message = err?.message || 'Unable to start a guest session right now.';
      setError(message);
      Alert.alert('Guest Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (loading) {
      return;
    }
    if (mode === 'login') {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  const renderLoginFields = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email or Username</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.textLight}
            value={identifier}
            onChangeText={setIdentifier}
            editable={!loading}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label]}>Password</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderSignupFields = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textLight}
            value={signupFullName}
            onChangeText={setSignupFullName}
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="alternate-email" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor={colors.textLight}
            value={signupUsername}
            onChangeText={setSignupUsername}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.textLight}
            value={signupEmail}
            onChangeText={setSignupEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label]}>Password</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Image source={brainPayLogo} accessibilityLabel="BrainPayP logo" style={{ width: 140, height: 40, resizeMode: 'contain', alignSelf: 'center', marginBottom: 2 }} />
           
            <Text style={styles.title}>{mode === 'login' ? 'Log In' : 'Sign Up'}</Text>
            <Text style={styles.subtitle}>
              {mode === 'login'
                ? 'Unlock your potential with our AI-powered learning platform.'
                : 'Create an account to start learning with AI-powered study tools.'}
            </Text>

           

            {error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {mode === 'login' ? renderLoginFields() : renderSignupFields()}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.guestButton, loading && styles.disabledButton]}
              onPress={handleGuestLogin}
              disabled={loading}
            >
              <MaterialIcons name="person-outline" size={18} color={colors.primary} />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            <Text style={styles.switchText}>
              {mode === 'login' ? 'New here? ' : 'Already have an account? '}
              <Text style={styles.switchLink} onPress={handleToggleMode}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl,
    ...shadows.md,
  },
  logoRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  logoImage: {
    width: 250,
    height: 200,
    resizeMode: 'contain',
    marginBottom: -16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: spacing.xxl,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  commentLabel: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue100,
    borderRadius: 999,
    paddingHorizontal: spacing.xxl,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 48,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
  },
  guestButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: spacing.md,
  },
  switchText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xxl,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
    marginLeft: spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default AuthScreen;
