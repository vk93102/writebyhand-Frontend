import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface LandingPageDashboardProps {
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: 'auto-awesome',
    title: 'AI-Powered Solutions',
    description: 'Get instant answers with advanced AI technology',
    gradient: ['#6366F1', '#8B5CF6'],
  },
  {
    icon: 'quiz',
    title: 'Smart Quizzes',
    description: 'Generate custom quizzes from any topic',
    gradient: ['#EC4899', '#8B5CF6'],
  },
  {
    icon: 'style',
    title: 'Flashcards',
    description: 'Create and study with intelligent flashcards',
    gradient: ['#F59E0B', '#EC4899'],
  },
  {
    icon: 'ondemand-video',
    title: 'YouTube Summaries',
    description: 'Summarize any video in seconds',
    gradient: ['#10B981', '#059669'],
  },
  {
    icon: 'analytics',
    title: 'Trends Analysis',
    description: 'Exam trends and chapter weightage insights',
    gradient: ['#7C3AED', '#5B21B6'],
  },
  {
    icon: 'analytics',
    title: 'Trends Analysis',
    description: 'Exam trends, chapter weightage and study strategy',
    gradient: ['#7C3AED', '#4C1D95'],
  },
];

const STATS = [
  { value: '2.3s', label: 'Avg Response Time' },
  { value: '98%', label: 'Accuracy Rate' },
  { value: '30+', label: 'Languages' },
  { value: '100K+', label: 'Questions Solved' },
];

export const LandingPageDashboard: React.FC<LandingPageDashboardProps> = ({ onGetStarted }) => {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIconContainer}>
            <MaterialIcons name="school" size={64} color="#ffffff" />
          </View>
          
          <Text style={styles.heroTitle}>
            AI-Powered Education
          </Text>
          
          <Text style={styles.heroSubtitle}>
            Transform your learning with intelligent question-solving, quizzes, and study tools
          </Text>

          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>Get Started Free</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            {STATS.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Powerful Features</Text>
        <Text style={styles.sectionSubtitle}>
          Everything you need to excel in your studies
        </Text>

        <View style={styles.featuresGrid}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureIconGradient}
              >
                <MaterialIcons name={feature.icon as any} size={32} color="#ffffff" />
              </LinearGradient>
              
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionSubtitle}>
          Three simple steps to smarter learning
        </Text>

        <View style={styles.stepsContainer}>
          {[
            { number: '1', title: 'Ask or Upload', description: 'Type your question or upload an image', icon: 'add-photo-alternate' },
            { number: '2', title: 'AI Processing', description: 'Our AI analyzes and solves instantly', icon: 'psychology' },
            { number: '3', title: 'Learn & Practice', description: 'Get answers, quizzes, and flashcards', icon: 'school' },
          ].map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              
              <View style={styles.stepContent}>
                <MaterialIcons name={step.icon as any} size={40} color={colors.primary} />
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaTitle}>Ready to Transform Your Learning?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of students already using AI to excel
          </Text>
          
          <TouchableOpacity 
            style={styles.ctaButtonSecondary}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonSecondaryText}>Start Learning Now</Text>
            <MaterialIcons name="rocket-launch" size={20} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 EdTech AI. Empowering learners worldwide.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  contentContainer: {
    flexGrow: 1,
  },
  heroGradient: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
    minHeight: isWeb ? 600 : 500,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  heroIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.h1,
    fontSize: isWeb ? 56 : 40,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...typography.body,
    fontSize: isWeb ? 20 : 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 28,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...shadows.xl,
  },
  ctaButtonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xxl,
    width: '100%',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: isWeb ? 140 : 80,
    alignItems: 'center',
  },
  statValue: {
    fontSize: isWeb ? 32 : 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isWeb ? 14 : 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: isWeb ? 40 : 32,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...typography.body,
    fontSize: isWeb ? 18 : 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xl,
    maxWidth: 1200,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    width: isWeb ? 260 : SCREEN_WIDTH - spacing.xl * 2,
    alignItems: 'center',
    ...shadows.md,
  },
  featureIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  featureTitle: {
    ...typography.h3,
    fontSize: 20,
    color: colors.textDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  featureDescription: {
    ...typography.body,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  howItWorksSection: {
    backgroundColor: colors.blue50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
  },
  stepsContainer: {
    flexDirection: isWeb ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xl,
    maxWidth: 1200,
  },
  stepCard: {
    backgroundColor: '#ffffff',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    width: isWeb ? 300 : SCREEN_WIDTH - spacing.xl * 2,
    alignItems: 'center',
    ...shadows.md,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    ...typography.h3,
    fontSize: 20,
    color: colors.textDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  stepDescription: {
    ...typography.body,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 2,
  },
  ctaGradient: {
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  ctaTitle: {
    ...typography.h2,
    fontSize: isWeb ? 36 : 28,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  ctaSubtitle: {
    ...typography.body,
    fontSize: isWeb ? 18 : 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  ctaButtonSecondaryText: {
    ...typography.button,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
  },
  footerText: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
});
