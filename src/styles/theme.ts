import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const colors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#dbeafe',
  secondary: '#1e40af',
  secondaryDark: '#1e3a8a',
  background: '#ffffff',
  backgroundLight: '#f0f7ff',
  backgroundGray: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f8fbff',
  text: '#1e293b',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#6b7280',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#cbd5e1',
  cardBorder: '#d8e3f5',
  success: '#16a34a',
  successLight: '#dcfce7',
  error: '#dc2626',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  accent: '#f43f5e',
  accentSecondary: '#fbbf24',
  gradientStart: '#0f172a',
  gradientMid: '#1e3a8a',
  gradientEnd: '#2563eb',
  midnight: '#050816',
  deepIndigo: '#0f172a',
  neonBlue: '#60a5fa',
  neonPink: '#f472b6',
  aqua: '#2dd4bf',
  aurora: '#c084fc',
  glass: 'rgba(255,255,255,0.85)',
  glassStroke: 'rgba(255,255,255,0.2)',
  nightOverlay: 'rgba(8,8,30,0.85)',
  inputBackground: '#eef2ff',
  white: '#ffffff',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
};

export const spacing = {
  xs: 3.2,    // Reduced by 20% from 4
  sm: 6.4,    // Reduced by 20% from 8
  md: 9.6,    // Reduced by 20% from 12
  lg: 12.8,   // Reduced by 20% from 16
  xl: 16,     // Reduced by 20% from 20
  xxl: 19.2,  // Reduced by 20% from 24
  xxxl: 25.6, // Reduced by 20% from 32
};

export const borderRadius = {
  sm: 6.4,   // Reduced by 20% from 8
  md: 9.6,   // Reduced by 20% from 12
  lg: 12.8,  // Reduced by 20% from 16
  xl: 16,    // Reduced by 20% from 20
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  glow: {
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  glass: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const typography = {
  h1: {
    fontSize: 22.4,  // Reduced by 20% from 28
    fontWeight: '700' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 19.2,  // Reduced by 20% from 24
    fontWeight: '700' as const,
    color: colors.text,
  },
  h3: {
    fontSize: 16,    // Reduced by 20% from 20
    fontWeight: '600' as const,
    color: colors.text,
  },
  h4: {
    fontSize: 12.8,  // Reduced by 20% from 16
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 12,    // Reduced by 20% from 15
    fontWeight: '400' as const,
    color: colors.text,
  },
  small: {
    fontSize: 10.4,  // Reduced by 20% from 13
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 9.6,   // Reduced by 20% from 12
    fontWeight: '500' as const,
    color: colors.textLight,
  },
  button: {
    fontSize: 12,    // Reduced by 20% from 15
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    color: colors.white,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glassPanel: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    padding: spacing.xl,
    ...shadows.glass,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: 15,
    backgroundColor: colors.backgroundGray,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
