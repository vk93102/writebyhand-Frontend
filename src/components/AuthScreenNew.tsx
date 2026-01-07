import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { registerUser, loginUser } from '../services/api';
import { ResetPasswordScreen } from './ResetPasswordScreen';

const { width: initialWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface AuthScreenNewProps {
  onAuthSuccess: (user: any) => void;
  onBack?: () => void;
  onGuestLogin?: () => void;
}

export const AuthScreenNew: React.FC<AuthScreenNewProps> = ({ onAuthSuccess, onBack, onGuestLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(initialWidth);
  const isMobile = width < 768;

  useEffect(() => {
    const sub = (Dimensions as any).addEventListener?.('change', ({ window }: any) => {
      setWidth(window.width);
    });
    return () => sub?.remove?.();
  }, []);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastLoginError, setLastLoginError] = useState<string | null>(null);
  
  // Signup fields
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    const identifier = (email || '').trim();
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter both username/email and password');
      return;
    }

    // If it looks like an email address, validate the format
    if (identifier.includes('@') && !validateEmail(identifier)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setLastLoginError(null);

    try {
      const res = await loginUser(identifier, password);
      setLoading(false);
      setLoginAttempts(0); // Reset on success

      if (res?.success) {
        const data = res.data || res;
        onAuthSuccess({
          id: data.user_id || data.user?.id || 'user_' + Date.now(),
          name: data.username || (data.user && data.user.username) || identifier.split('@')[0],
          email: data.email || (data.user && data.user.email) || (identifier.includes('@') ? identifier.toLowerCase() : undefined),
          provider: 'email',
          token: data.token || data.access_token || (data.data && data.data.token),
        });
      } else {
        // Handle specific error codes from backend
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        let errorMessage = res.error || res.message || 'Login failed';
        if (res.error_code === 'USER_NOT_FOUND') {
          errorMessage = 'User not found. Please check your username/email or sign up for a new account.';
        } else if (res.error_code === 'INVALID_PASSWORD') {
          errorMessage = 'Incorrect password. Please try again.';
          if (newAttempts >= 3) {
            errorMessage += ' Consider resetting your password if you\'ve forgotten it.';
          }
        }

        setLastLoginError(errorMessage);
        Alert.alert('Login failed', errorMessage);
      }
    } catch (err: any) {
      setLoading(false);
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      console.error('Login error:', err);

      // Handle different types of errors
      let errorMessage = 'Failed to login';
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          errorMessage = data?.error || 'Invalid request. Please check your input.';
        } else if (status === 401) {
          errorMessage = data?.error || 'Invalid credentials';
        } else if (status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.error || `Login failed (${status})`;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error. Please check your internet connection and try again.';
        if (newAttempts < 3) {
          errorMessage += ' (This was attempt ' + newAttempts + ' of 3)';
        }
      } else {
        // Other error
        errorMessage = err.message || 'An unexpected error occurred';
      }

      setLastLoginError(errorMessage);
      Alert.alert('Login error', errorMessage);
    }
  };

  const handleSignup = async () => {
    // Clear previous error
    setSignupError(null);

    // Validation
    if (!fullName || !signupEmail || !signupPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const emailNormalized = (signupEmail || '').trim().toLowerCase();
    if (!validateEmail(emailNormalized)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (signupPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Check password match
    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(signupPassword);
    const hasLowerCase = /[a-z]/.test(signupPassword);
    const hasNumber = /[0-9]/.test(signupPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      Alert.alert(
        'Weak Password', 
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return;
    }

    setLoading(true);
    try {
      // Derive a safe username from the email local-part
      let username = emailNormalized.split('@')[0] || `user${Date.now()}`;
      username = username.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 30);
      if (!username) username = `user${Date.now()}`;
      const res = await registerUser(username, emailNormalized, signupPassword, fullName);
      setLoading(false);
      if (res?.success) {
        const data = res.data || res;
        onAuthSuccess({
          id: data.user_id || data.user?.id || 'user_' + Date.now(),
          name: data.username || (data.user && data.user.username) || fullName,
          email: data.email || (data.user && data.user.email) || signupEmail,
          provider: 'email',
          token: data.token || (data.data && data.data.token) || null,
        });
      } else {
        Alert.alert('Signup failed', res.error || res.message || 'Registration error');
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Signup error:', err);

      // Handle different types of signup errors
      let errorMessage = 'Failed to register';
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          errorMessage = data?.error || 'Invalid registration data. Please check your input.';
        } else if (status === 409) {
          errorMessage = data?.error || 'User already exists with this email.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.error || `Registration failed (${status})`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }

      Alert.alert('Signup error', errorMessage);
    }
  };

  // Google Sign-In removed

  const renderLogin = () => (
    <View style={[styles.formContainer, isMobile && styles.formContainerMobile]}>
      {/* Logo at top for mobile */}
      {isMobile && (
        <View style={styles.mobileLogoContainer}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="school" size={40} color={colors.primary} />
          </View>
          <Text style={styles.mobileBrandTitle}>Unlock Your Potential</Text>
          <Text style={styles.mobileBrandSubtitle}>
            Elevate your learning experience with our innovative AI-powered study tools and resources to support your growth.
          </Text>
        </View>
      )}

      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Log into your account to continue your learning journey</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email or Username</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter your password</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (lastLoginError) setLastLoginError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {lastLoginError && (
            <Text style={styles.errorText}>{lastLoginError}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => setMode('reset')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Log in</Text>
          )}
        </TouchableOpacity>

        {onGuestLogin && (
          <TouchableOpacity 
            style={styles.guestButton}
            onPress={onGuestLogin}
            disabled={loading}
          >
            <MaterialIcons name="person-outline" size={20} color={colors.textMuted} />
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        )}

        <View style={styles.switchMode}>
          <Text style={styles.switchModeText}>New here? </Text>
          <TouchableOpacity onPress={() => setMode('signup')}>
            <Text style={styles.switchModeLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSignup = () => (
    <View style={[styles.formContainer, isMobile && styles.formContainerMobile]}>
      {/* Logo at top for mobile */}
      {isMobile && (
        <View style={styles.mobileLogoContainer}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="school" size={40} color={colors.primary} />
          </View>
          <Text style={styles.mobileBrandTitle}>Unlock Your Potential</Text>
          <Text style={styles.mobileBrandSubtitle}>
            Elevate your learning experience with our innovative AI-powered study tools and resources to support your growth.
          </Text>
        </View>
      )}

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start your learning journey today</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="person" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Rahuljha996886"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Rahuljha@123"
              placeholderTextColor={colors.textMuted}
              value={signupEmail}
              onChangeText={setSignupEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Minimum 8 characters"
              placeholderTextColor={colors.textMuted}
              value={signupPassword}
              onChangeText={(text) => {
                setSignupPassword(text);
                if (signupError) setSignupError(null);
              }}
              secureTextEntry={!showSignupPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowSignupPassword(!showSignupPassword)}>
              <MaterialIcons 
                name={showSignupPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Re-enter password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (signupError) setSignupError(null);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialIcons 
                name={showConfirmPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {signupError && (
            <Text style={styles.errorText}>{signupError}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.switchMode}>
          <Text style={styles.switchModeText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => setMode('login')}>
            <Text style={styles.switchModeLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (mode === 'reset') {
    return (
      <ResetPasswordScreen
        onClose={() => setMode('login')}
        onBackToLogin={() => setMode('login')}
      />
    );
  }

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
        {/* Left / Brand panel: hidden on mobile */}
        {!isMobile && (
          <View style={styles.leftSection}>
            <View style={styles.brandSection}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="school" size={48} color={colors.primary} />
              </View>
              <Text style={styles.brandTitle}>Unlock Your Potential</Text>
              <Text style={styles.brandSubtitle}>
                Elevate your learning experience with our innovative AI-powered study tools and resources to support your growth.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.rightSection}>
          {mode === 'login' ? renderLogin() : renderSignup()}
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
    backgroundColor: Platform.OS === 'web' ? '#E8F2FF' : colors.white,
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
  mobileBrandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  mobileBrandSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
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
  errorText: {
    fontSize: 12,
    color: '#EF4444', // red-500
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  /* Google button removed */
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    marginBottom: spacing.lg,
    minHeight: 48,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
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
