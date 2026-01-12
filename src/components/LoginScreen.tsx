import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
  onForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onSwitchToRegister, 
  onLoginSuccess,
  onForgotPassword
}) => {
  const insets = useSafeAreaInsets();
  const windowDims = useWindowDimensions();
  const screenDims = Dimensions.get('screen');
  const width = Math.min(windowDims.width, screenDims.width);
  const height = Math.min(windowDims.height, screenDims.height);
  
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Responsive detection
  const isMobile = width < 600;
  const isSmallMobile = width < 400;
  const isCompactHeight = height < 800;

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username or email is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim(), password);

      if (result.success) {
        Alert.alert('Success', 'Logged in successfully!', [
          { text: 'OK', onPress: onLoginSuccess }
        ]);
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    Alert.alert(
      'Continue as Guest?',
      'You will have limited access to features. Premium features will be locked.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => onLoginSuccess(),
          style: 'default',
        },
      ]
    );
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      Alert.alert('Reset Password', 'Enter your email to receive reset instructions');
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} 
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isMobile && styles.scrollContentMobile,
            isCompactHeight && styles.scrollContentCompact,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, isCompactHeight && styles.headerCompact]}>
            <View style={[styles.iconContainer, isSmallMobile && styles.iconContainerSmall]}>
              <MaterialIcons name="school" size={isSmallMobile ? 48 : 56} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, isSmallMobile && styles.titleSmall]}>Welcome Back!</Text>
            <Text style={[styles.subtitle, isSmallMobile && styles.subtitleSmall]}>
              Sign in to continue your learning journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email/Username Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isSmallMobile && styles.labelSmall]}>Email or Username</Text>
              <View 
                style={[
                  styles.inputContainer,
                  focusedInput === 'username' && styles.inputFocused,
                  errors.username && styles.inputError
                ]}
              >
                <MaterialIcons name="person" size={20} color="#9CA3AF" />
                <TextInput
                  style={[styles.input, isSmallMobile && styles.inputSmall]}
                  placeholder="student@domain.com"
                  placeholderTextColor="#D1D5DB"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  underlineColorAndroid="transparent"
                  selectionColor="transparent"
                  editable={!loading}
                />
              </View>
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isSmallMobile && styles.labelSmall]}>Password</Text>
              <View 
                style={[
                  styles.inputContainer,
                  focusedInput === 'password' && styles.inputFocused,
                  errors.password && styles.inputError
                ]}
              >
                <MaterialIcons name="lock" size={20} color="#9CA3AF" />
                <TextInput
                  style={[styles.input, isSmallMobile && styles.inputSmall]}
                  placeholder="Enter password"
                  placeholderTextColor="#D1D5DB"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                  selectionColor="transparent"
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity 
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size={isSmallMobile ? 'small' : 'large'} />
              ) : (
                <Text style={[styles.signInButtonText, isSmallMobile && styles.signInButtonTextSmall]}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Continue as Guest Button */}
            <TouchableOpacity 
              style={[styles.guestButton, loading && styles.buttonDisabled]}
              onPress={handleGuestLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person-outline" size={18} color="#3B82F6" />
              <Text style={[styles.guestButtonText, isSmallMobile && styles.guestButtonTextSmall]}>
                Continue as Guest
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, isCompactHeight && styles.dividerCompact]}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity 
              style={styles.signUpPrompt}
              onPress={onSwitchToRegister}
              disabled={loading}
            >
              <Text style={[styles.signUpText, isSmallMobile && styles.signUpTextSmall]}>
                New here?{' '}
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, isCompactHeight && styles.footerCompact]}>
            <MaterialIcons name="security" size={14} color="#9CA3AF" />
            <Text style={[styles.footerText, isSmallMobile && styles.footerTextSmall]}>
              Your data is secured with encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  scrollContentMobile: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  scrollContentCompact: {
    paddingVertical: 16,
  },

  /* Header Styles */
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerCompact: {
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#5A8C9E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#5A8C9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainerSmall: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleSmall: {
    fontSize: 13,
    lineHeight: 18,
  },

  /* Form Styles */
  form: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 12,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  inputSmall: {
    fontSize: 14,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  /* Button Styles */
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginBottom: 18,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  signInButtonTextSmall: {
    fontSize: 15,
  },
  guestButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: 20,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  guestButtonTextSmall: {
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerCompact: {
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 12,
    fontWeight: '500',
  },

  /* Sign Up Section */
  signUpPrompt: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpTextSmall: {
    fontSize: 13,
  },
  signUpLink: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingTop: 16,
  },
  footerCompact: {
    marginTop: 12,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footerTextSmall: {
    fontSize: 11,
  },
});
