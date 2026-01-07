import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { googleAuthAPI } from '../services/authService';
import AnimatedLoader from './AnimatedLoader';
import { googleAuthConfig } from '../config/googleAuth';
import { GoogleSignInButton } from './GoogleSignInButton';

WebBrowser.maybeCompleteAuthSession();

const HERO_METRICS = [
  { label: 'Setup', value: '< 1 min' },
  { label: 'Devices', value: 'Phone + Web' },
  { label: 'Security', value: 'Google OAuth' },
];

const isClientIdConfigured = (id?: string) => Boolean(id && !id.includes('YOUR_') && id.trim().length > 0);

const formatClientIdList = (items: string[]) => {
  if (items.length === 0) {
    return 'valid client IDs';
  }
  if (items.length === 1) {
    return `${items[0]} client ID`;
  }
  const lastItem = items[items.length - 1];
  return `${items.slice(0, -1).join(', ')} and ${lastItem} client IDs`;
};

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'guest'>('login');
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);
  const [signupConfirmPasswordVisible, setSignupConfirmPasswordVisible] = useState(false);
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme: googleAuthConfig.scheme,
        path: googleAuthConfig.redirectPath,
      }),
    []
  );

  const baseClientId = useMemo(() => {
    if (Platform.OS === 'ios' && isClientIdConfigured(googleAuthConfig.iosClientId)) {
      return googleAuthConfig.iosClientId;
    }
    if (Platform.OS === 'android' && isClientIdConfigured(googleAuthConfig.androidClientId)) {
      return googleAuthConfig.androidClientId;
    }
    if (Platform.OS === 'web' && isClientIdConfigured(googleAuthConfig.webClientId)) {
      return googleAuthConfig.webClientId;
    }
    if (isClientIdConfigured(googleAuthConfig.expoClientId)) {
      return googleAuthConfig.expoClientId;
    }
    return '';
  }, []);

  const googleRequestConfig = useMemo<Partial<Google.GoogleAuthRequestConfig> | undefined>(() => {
    if (!isClientIdConfigured(baseClientId)) {
      return undefined;
    }

    return {
      clientId: baseClientId,
      iosClientId: googleAuthConfig.iosClientId || undefined,
      androidClientId: googleAuthConfig.androidClientId || undefined,
      webClientId: googleAuthConfig.webClientId || undefined,
      redirectUri,
      responseType: 'code',
      scopes: ['openid', 'profile', 'email'],
      selectAccount: true,
    };
  }, [baseClientId, redirectUri]);

  const googleConfigHints = useMemo(() => {
    const missing: string[] = [];
    const targets: Array<{ value?: string; label: string }> = [
      { value: googleAuthConfig.expoClientId, label: 'Expo Go' },
      { value: googleAuthConfig.androidClientId, label: 'Android' },
      { value: googleAuthConfig.iosClientId, label: 'iOS' },
      { value: googleAuthConfig.webClientId, label: 'Web' },
    ];

    targets.forEach(({ value, label }) => {
      if (!isClientIdConfigured(value)) {
        missing.push(label);
      }
    });

    return missing;
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleGoogleAuthCode = async (authCode: string) => {
    try {
      const authResult = await googleAuthAPI.signInWithGoogle(authCode);
      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Unable to authenticate with Google');
      }
      onAuthSuccess({ ...authResult.user, provider: 'google' });
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error?.message || 'Please try again in a moment.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Login Error', 'Please fill in both email and password fields.');
      return;
    }

    if (!validateEmail(loginEmail)) {
      Alert.alert('Login Error', 'Please enter a valid email address.');
      return;
    }

    try {
      setFormLoading(true);
      const result = await googleAuthAPI.login(loginEmail, loginPassword);
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }
      onAuthSuccess(result.user);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Unable to log in. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      Alert.alert('Sign Up Error', 'Please fill out every field.');
      return;
    }

    if (!validateEmail(signupEmail)) {
      Alert.alert('Sign Up Error', 'Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 6) {
      Alert.alert('Sign Up Error', 'Password must be at least 6 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      Alert.alert('Sign Up Error', 'Passwords do not match.');
      return;
    }

    try {
      setFormLoading(true);
      const result = await googleAuthAPI.signUp(signupName, signupEmail, signupPassword);
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Unable to create account');
      }
      onAuthSuccess(result.user);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error?.message || 'Unable to create your account right now.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!guestName || !guestEmail) {
      Alert.alert('Guest Login Error', 'Please fill in your name and email.');
      return;
    }

    if (!validateEmail(guestEmail)) {
      Alert.alert('Guest Login Error', 'Please enter a valid email address.');
      return;
    }

    try {
      setFormLoading(true);
      // Guest login — pass guest user data to onAuthSuccess
      onAuthSuccess({
        name: guestName,
        email: guestEmail,
        isGuest: true,
        provider: 'guest',
      });
    } catch (error: any) {
      Alert.alert('Guest Login Failed', error?.message || 'Unable to proceed as guest.');
    } finally {
      setFormLoading(false);
    }
  };

  const renderGoogleButton = (label: string) => {
    if (googleRequestConfig) {
      return (
        <GoogleSignInButton
          config={googleRequestConfig}
          onAuthCode={handleGoogleAuthCode}
          loading={googleLoading}
          setLoading={setGoogleLoading}
          label={label}
        />
      );
    }

    return (
      <TouchableOpacity 
        style={styles.googleButton}
        onPress={() => Alert.alert('Google Sign-In', 'Please configure Google OAuth in app.json')}
      >
        <MaterialIcons name="login" size={20} color="#4285F4" />
        <Text style={styles.googleButtonText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // dev debug info to help diagnose why web Google login isn't opening
  const renderGoogleDebug = () => {
    if (!__DEV__) return null;
    const client = googleRequestConfig?.clientId || googleAuthConfig.webClientId || '';
    return (
      <View style={{ marginTop: spacing.sm }}>
        <Text style={{ fontSize: 12, color: client ? '#0f172a' : '#b91c1c' }}>
          {client ? `Google client id detected (web): ${client.substring(0, 12)}...` : 'No Google client id detected for web. Set REACT_APP_GOOGLE_CLIENT_ID or update app.json.'}
        </Text>
        <Text style={{ fontSize: 12, color: '#64748b' }}>
          Redirect URI: {redirectUri}
        </Text>
      </View>
    );
  };

  const copyRedirectUri = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
        await (navigator as any).clipboard.writeText(redirectUri);
      } else {
        // Fallback for native or environments without navigator.clipboard
        // We can't guarantee expo-clipboard is installed here; show an alert with the URL so users can copy.
        Alert.alert('Copy Redirect URI', redirectUri);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      Alert.alert('Unable to copy', 'Please copy the URL manually.');
    }
  };

  const renderEmailLogin = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Welcome back</Text>
      <Text style={styles.sectionSubtitle}>Pick up where you stopped.</Text>

      {renderGoogleButton('Continue with Google')}

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerLabel}>or email</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="mail" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="student@domain.com"
            value={loginEmail}
            onChangeText={setLoginEmail}
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!formLoading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="lock" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={colors.textLight}
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry={!loginPasswordVisible}
            editable={!formLoading}
          />
          <TouchableOpacity onPress={() => setLoginPasswordVisible((prev) => !prev)} disabled={formLoading}>
            <MaterialIcons
              name={loginPasswordVisible ? 'visibility' : 'visibility-off'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.linkButton}>
        <Text style={styles.linkButtonText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, formLoading && styles.disabledButton]}
        onPress={handleEmailLogin}
        disabled={formLoading}
      >
        {formLoading ? (
          <AnimatedLoader visible={true} size="small" color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Sign In</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmailSignup = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Create account</Text>
      <Text style={styles.sectionSubtitle}>One profile unlocks every tool.</Text>

      {renderGoogleButton('Sign up with Google')}

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerLabel}>or email</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="person" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Alex Learner"
            placeholderTextColor={colors.textLight}
            value={signupName}
            onChangeText={setSignupName}
            editable={!formLoading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="alternate-email" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textLight}
            value={signupEmail}
            onChangeText={setSignupEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!formLoading}
          />
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={[styles.fieldGroup, styles.halfWidth]}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputShell}>
            <MaterialIcons name="lock" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="6+ characters"
              placeholderTextColor={colors.textLight}
              value={signupPassword}
              onChangeText={setSignupPassword}
              secureTextEntry={!signupPasswordVisible}
              editable={!formLoading}
            />
            <TouchableOpacity onPress={() => setSignupPasswordVisible((prev) => !prev)} disabled={formLoading}>
              <MaterialIcons
                name={signupPasswordVisible ? 'visibility' : 'visibility-off'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.fieldGroup, styles.halfWidth]}>
          <Text style={styles.label}>Confirm</Text>
          <View style={styles.inputShell}>
            <MaterialIcons name="verified-user" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Repeat password"
              placeholderTextColor={colors.textLight}
              value={signupConfirmPassword}
              onChangeText={setSignupConfirmPassword}
              secureTextEntry={!signupConfirmPasswordVisible}
              editable={!formLoading}
            />
            <TouchableOpacity
              onPress={() => setSignupConfirmPasswordVisible((prev) => !prev)}
              disabled={formLoading}
            >
              <MaterialIcons
                name={signupConfirmPasswordVisible ? 'visibility' : 'visibility-off'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, formLoading && styles.disabledButton]}
        onPress={handleEmailSignup}
        disabled={formLoading}
      >
        {formLoading ? (
          <AnimatedLoader visible={true} size="small" color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Create Account</Text>
            <MaterialIcons name="north-east" size={18} color={colors.white} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.signupLinksRow}>
        <Text style={styles.loginPromptText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => setActiveTab('login')}>
          <Text style={styles.loginLink}> Log in</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.policyLinksRow}>
        <TouchableOpacity onPress={() => Linking.openURL('https://example.com/privacy')}>
          <Text style={styles.smallLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.smallLinkSeparator}>•</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://example.com/terms')}>
          <Text style={styles.smallLink}>Terms</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGuestLogin = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Continue as Guest</Text>
      <Text style={styles.sectionSubtitle}>Explore without creating an account.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="person" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor={colors.textLight}
            value={guestName}
            onChangeText={setGuestName}
            editable={!formLoading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="alternate-email" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={colors.textLight}
            value={guestEmail}
            onChangeText={setGuestEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!formLoading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, formLoading && styles.disabledButton]}
        onPress={handleGuestLogin}
        disabled={formLoading}
      >
        {formLoading ? (
          <AnimatedLoader visible={true} size="small" color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Continue as Guest</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.white} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.loginPrompt}>
        <Text style={styles.loginPromptText}>Want to create an account?</Text>
        <TouchableOpacity onPress={() => setActiveTab('signup')}>
          <Text style={styles.loginLink}> Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Left Side - Illustration */}
          <View style={styles.leftSide}>
            <View style={styles.logoHeader}>
              <MaterialIcons name="school" size={20} color="#5B7EED" />
            </View>

            <View style={styles.centerContent}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Unlock Your Potential</Text>
                <Text style={styles.heroSubtitle}>
                  Join a community of learners and educators. Access thousands of courses, quizzes, and resources to accelerate your growth.
                </Text>
              </View>
            </View>
          </View>

          {/* Right Side - Auth Form */}
          <View style={styles.rightSide}>
            <View style={styles.formCard}>
              {/* Tab Navigation */}
              <View style={styles.tabNavigation}>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'login' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('login')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'login' && styles.tabButtonTextActive]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'signup' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('signup')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'signup' && styles.tabButtonTextActive]}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'guest' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('guest')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'guest' && styles.tabButtonTextActive]}>Guest</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'login' ? renderEmailLogin() : activeTab === 'signup' ? renderEmailSignup() : renderGuestLogin()}

              {redirectUri ? (
                <View style={styles.redirectRow}>
                  <Text style={styles.redirectLabel}>Redirect URI:</Text>
                  <TouchableOpacity onPress={copyRedirectUri}>
                    <Text style={styles.redirectText} numberOfLines={1} ellipsizeMode="middle">
                      {redirectUri}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={copyRedirectUri} style={{ marginLeft: spacing.md }}>
                    <Text style={styles.copyLink}>{copied ? 'Copied' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity onPress={() => setShowHelp((s) => !s)} style={styles.helpToggle}>
                <Text style={styles.helpToggleText}>{showHelp ? 'Hide' : 'Need help configuring Google?'}</Text>
              </TouchableOpacity>
              {showHelp && (
                <View style={styles.helpCard}>
                  <Text style={styles.helpTitle}>Recommended Google Cloud Console entries</Text>
                  <Text style={styles.helpSubtitle}>Authorized JavaScript Origins</Text>
                  <Text style={styles.helpItem}>http://localhost:19006</Text>
                  <Text style={styles.helpItem}>http://localhost:8081</Text>
                  <Text style={styles.helpItem}>http://127.0.0.1:19006</Text>
                  <Text style={styles.helpSubtitle}>Authorized Redirect URIs</Text>
                  <Text style={styles.helpItem}>https://auth.expo.io/@YOUR_EXPO_ACCOUNT/EdTechMobile</Text>
                  <Text style={styles.helpItem}>edtechsolver://auth/callback</Text>
                  <Text style={styles.helpNote}>Replace YOUR_EXPO_ACCOUNT with your Expo username (run expo whoami to check)</Text>
                </View>
              )}

              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Don't have an account? 
                </Text>
                <TouchableOpacity onPress={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}>
                  <Text style={styles.loginLink}> Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },

  // Left Side - Simple text area
  leftSide: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    padding: spacing.xxxl,
    justifyContent: 'space-between',
  },
  logoHeader: {
    marginBottom: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTextContainer: {
    maxWidth: 420,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: spacing.lg,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 24,
  },

  // Right Side - Form
  rightSide: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: spacing.sm,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: spacing.xxxl,
    lineHeight: 22,
  },
  redirectRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  redirectLabel: {
    color: '#718096',
    marginRight: spacing.sm,
    fontSize: 12,
  },
  redirectText: {
    color: '#64748B',
    fontSize: 12,
    maxWidth: 320,
  },
  copyLink: {
    color: '#5B7EED',
    fontSize: 12,
    fontWeight: '600',
  },
  helpToggle: {
    marginTop: spacing.sm,
  },
  helpToggleText: {
    color: '#718096',
    fontSize: 12,
  },
  helpCard: {
    marginTop: spacing.sm,
    backgroundColor: '#F8FAFF',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EEF9',
  },
  helpTitle: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: spacing.xs,
  },
  helpSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  helpItem: {
    color: '#475569',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  helpNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: spacing.xs,
  },
  googleButton: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleButtonBlock: {
    gap: spacing.sm,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleButtonText: {
    fontWeight: '600',
    color: '#1A202C',
    fontSize: 15,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#718096',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B7EED',
  },

  // Unused but kept for compatibility
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textLight,
  },
  formSection: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputShell: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundGray,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  linkButton: {
    alignSelf: 'flex-end',
  },
  linkButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    ...shadows.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  halfWidth: {
    flex: 1,
    minWidth: 150,
  },
  policyText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 12,
    marginTop: spacing.xl,
  },
  signupLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  policyLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  smallLink: {
    color: '#5B7EED',
    fontSize: 12,
    marginHorizontal: spacing.xs,
  },
  smallLinkSeparator: {
    color: '#94A3B8',
    fontSize: 12,
    marginHorizontal: spacing.xs,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#5B7EED',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#5B7EED',
  },
});


