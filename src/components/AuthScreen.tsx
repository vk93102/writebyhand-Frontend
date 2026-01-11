import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { registerUser, loginUser } from '../services/api';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

const isWeb = Platform.OS === 'web';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please fill in both email and password fields.');
      return;
    }

    if (!validateEmail(loginEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const result = await loginUser(loginEmail, loginPassword);
      
      if (!result || !result.success) {
        throw new Error('Login failed');
      }
      
      onAuthSuccess({
        ...result.data,
        provider: 'email',
      });
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!signupUsername || !signupEmail || !signupFullName || !signupPassword) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    if (!validateEmail(signupEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const result = await registerUser(signupUsername, signupEmail, signupPassword, signupFullName);
      
      if (!result || !result.success) {
        throw new Error('Unable to create account');
      }
      
      onAuthSuccess({
        ...result.data,
        provider: 'email',
      });
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error?.message || 'Unable to create your account right now.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailLogin = () => (
    <View style={styles.formSection}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="mail-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder={isWeb ? "student@domain.com" : "Enter your email"}
            placeholderTextColor="#D1D5DB"
            value={loginEmail}
            onChangeText={setLoginEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="lock-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#D1D5DB"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry={!loginPasswordVisible}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setLoginPasswordVisible(!loginPasswordVisible)} disabled={loading}>
            <MaterialIcons
              name={loginPasswordVisible ? 'visibility' : 'visibility-off'}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {!isWeb && (
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity 
            style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={loading}
          >
            {rememberMe && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
          <Text style={styles.rememberMeText}>Remember me</Text>
          <TouchableOpacity style={styles.forgotPasswordLink} onPress={() => Alert.alert('Reset Password', 'Password reset link sent to your email')}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleEmailLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{isWeb ? 'Sign In' : 'Sign in'}</Text>
        )}
      </TouchableOpacity>

      {!isWeb && (
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.divider} />
        </View>
      )}
    </View>
  );

  const renderEmailSignup = () => (
    <View style={styles.formSection}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="person-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#D1D5DB"
            value={signupFullName}
            onChangeText={setSignupFullName}
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="person" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor="#D1D5DB"
            value={signupUsername}
            onChangeText={setSignupUsername}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="mail-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#D1D5DB"
            value={signupEmail}
            onChangeText={setSignupEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputShell}>
          <MaterialIcons name="lock-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#D1D5DB"
            value={signupPassword}
            onChangeText={setSignupPassword}
            secureTextEntry={!signupPasswordVisible}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setSignupPasswordVisible(!signupPasswordVisible)} disabled={loading}>
            <MaterialIcons
              name={signupPasswordVisible ? 'visibility' : 'visibility-off'}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleEmailSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signupLinksRow}>
        <Text style={styles.loginPromptText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => setActiveTab('login')}>
          <Text style={styles.loginLink}> Sign in</Text>
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

  // Mobile Layout - Simple form
  if (!isWeb) {
    return (
      <View style={styles.screen}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mobileContainer}>
            <View style={styles.formContainer}>
              {/* Header - Hidden on mobile */}
              {isWeb && (
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Get Started</Text>
                  <Text style={styles.headerSubtitle}>Book appointments with doctors and tutors.</Text>
                </View>
              )}

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
                  <Text style={[styles.tabButtonText, activeTab === 'signup' && styles.tabButtonTextActive]}>Register</Text>
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              {activeTab === 'login' ? renderEmailLogin() : renderEmailSignup()}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Web Layout - 50/50 with blue left side
  return (
    <View style={styles.screen}>
      <ScrollView 
        contentContainerStyle={styles.webScrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.webContainer}>
          {/* Left Side - Hero Section */}
          <View style={styles.leftSide}>
            <View style={styles.logoHeader}>
              <MaterialIcons name="school" size={20} color="#5B7EED" />
            </View>

            <View style={styles.centerContent}>
              {/* Icon Circle Card */}
              <View style={styles.iconCircleContainer}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="school" size={56} color="#5B7EED" />
                </View>
              </View>

              {/* Hero Text */}
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Unlock Your Potential</Text>
                <Text style={styles.heroSubtitle}>Elevate your learning experience with our innovative AI-powered study tools and resources to support your growth.</Text>
              </View>
            </View>
          </View>

          {/* Right Side - Auth Form */}
          <View style={styles.rightSide}>
            <View style={styles.webFormCard}>
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
              </View>

              {activeTab === 'login' ? renderEmailLogin() : renderEmailSignup()}
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
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  webScrollContainer: {
    flexGrow: 1,
  },

  // Mobile Layout
  mobileContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
  },
  formContainer: {
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
  },

  // Web Layout
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100vh',
    backgroundColor: '#E3F2FD',
  },

  // Left Side (Web Only)
  leftSide: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: spacing.xxxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoHeader: {
    marginBottom: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  heroTextContainer: {
    maxWidth: 420,
  },
  iconCircleContainer: {
    marginBottom: spacing.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 24,
    textAlign: 'center',
  },

  // Right Side (Web Only)
  rightSide: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  webFormCard: {
    width: '100%',
    maxWidth: 420,
  },

  // Header (Mobile Only)
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
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
    color: '#9CA3AF',
  },
  tabButtonTextActive: {
    color: '#5B7EED',
  },

  // Form Section
  formSection: {
    gap: spacing.lg,
  },

  // Fields
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  inputShell: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: spacing.xs,
  },

  // Remember Me
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5B7EED',
    borderColor: '#5B7EED',
  },
  rememberMeText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  forgotPasswordLink: {
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    color: '#5B7EED',
    fontWeight: '600',
    fontSize: 13,
  },

  // Buttons
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B7EED',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Links
  signupLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B7EED',
  },
  policyLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  smallLink: {
    color: '#5B7EED',
    fontSize: 12,
    marginHorizontal: spacing.xs,
  },
  smallLinkSeparator: {
    color: '#D1D5DB',
    fontSize: 12,
    marginHorizontal: spacing.xs,
  },
});


