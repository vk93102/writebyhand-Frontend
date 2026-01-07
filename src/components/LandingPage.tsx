import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onGuestLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onGuestLogin }) => {
  const features = [
    {
      iconName: 'assessment',
      iconColor: '#4F46E5',
      bgColor: '#EEF2FF',
      title: 'AI-Powered Reports',
      description: 'Get detailed reports and insights powered by advanced AI technology.',
    },
    {
      iconName: 'ondemand-video',
      iconColor: '#DC2626',
      bgColor: '#FEE2E2',
      title: 'YouTube Video Summarize',
      description: 'Summarize lengthy YouTube videos into concise, easy-to-understand notes.',
    },
    {
      iconName: 'auto-stories',
      iconColor: '#059669',
      bgColor: '#D1FAE5',
      title: 'Interactive Textbooks',
      description: 'Access interactive textbooks with engaging content and multimedia resources.',
    },
    {
      iconName: 'quiz',
      iconColor: '#D97706',
      bgColor: '#FEF3C7',
      title: 'Custom Quizzes',
      description: 'Create and take custom quizzes tailored to your learning needs and goals.',
    },
    {
      iconName: 'psychology',
      iconColor: '#7C3AED',
      bgColor: '#EDE9FE',
      title: 'Mock Tests',
      description: 'Generate custom mock tests to practice and prepare for your exams.',
    },
    {
      iconName: 'emoji-events',
      iconColor: '#EA580C',
      bgColor: '#FFEDD5',
      title: 'Daily Challenges',
      description: 'Earn coins by completing Daily Quizzes and climb the leaderboard.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah L.',
      role: 'High School Student',
      text: 'This app has been incredibly helpful for me. The AI-generated study materials have improved my grades significantly, and the quiz feature helps me prepare for tests in a fun way!',
      rating: 5,
    },
    {
      name: 'John K.',
      role: 'College Student',
      text: 'The YouTube summarization feature saves me so much time! I can quickly get the key points from lectures and focus on what matters most for my studies.',
      rating: 5,
    },
    {
      name: 'Amelia D.',
      role: 'Graduate Student',
      text: 'I love the interactive textbooks! It makes learning more engaging, and the AI reports provide valuable insights into my progress and areas for improvement.',
      rating: 5,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <MaterialIcons name="school" size={28} color={colors.primary} />
          </View>
          <Text style={styles.logoText}>StudySphere</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerLink}>
            <Text style={styles.headerLinkText}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerLink}>
            <Text style={styles.headerLinkText}>Pricing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerLink}>
            <Text style={styles.headerLinkText}>About</Text>
          </TouchableOpacity>
          {onGuestLogin && (
            <TouchableOpacity style={styles.guestButton} onPress={onGuestLogin}>
              <MaterialIcons name="person-outline" size={18} color={colors.textMuted} />
              <Text style={styles.guestButtonText}>Guest</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signupButton} onPress={onGetStarted}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Smarter Studying Starts Here</Text>
          <Text style={styles.heroSubtitle}>
            Your personalized AI-powered study companion designed to boost your learning, 
            improve grades, and make studying easier—all in one platform.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.ctaButton} onPress={onGetStarted}>
              <Text style={styles.ctaButtonText}>Get Started for Free</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {onGuestLogin && (
              <TouchableOpacity style={styles.guestCtaButton} onPress={onGuestLogin}>
                <MaterialIcons name="play-arrow" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.guestCtaButtonText}>Try as Guest</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Everything you need to succeed in your studies</Text>
        <Text style={styles.sectionSubtitle}>
          Comprehensive tools designed to enhance your study experience, boost productivity, 
          and help you achieve your academic goals with ease.
        </Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
                <MaterialIcons name={feature.iconName as any} size={32} color={feature.iconColor} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Testimonials Section */}
      <View style={[styles.section, styles.testimonialsSection]}>
        <Text style={styles.sectionTitle}>Loved by Students Like You</Text>

        <View style={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <View key={index} style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <View style={styles.testimonialAvatar}>
                  <MaterialIcons name="person" size={28} color={colors.primary} />
                </View>
                <View style={styles.testimonialInfo}>
                  <Text style={styles.testimonialName}>{testimonial.name}</Text>
                  <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <MaterialIcons key={i} name="star" size={16} color="#FBBF24" />
                ))}
              </View>
              <Text style={styles.testimonialText}>{testimonial.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Revolutionize Your Study Habits?</Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands of students who are already using our platform to achieve their academic goals.
        </Text>
        <TouchableOpacity style={styles.ctaButtonLarge} onPress={onGetStarted}>
          <Text style={styles.ctaButtonLargeText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerLeft}>
            <View style={styles.footerLogo}>
              <MaterialIcons name="school" size={24} color={colors.primary} />
              <Text style={styles.footerLogoText}>StudySphere</Text>
            </View>
          </View>
          <View style={styles.footerLinks}>
            <TouchableOpacity style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.copyright}>© 2025 StudySphere Inc. · All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerLink: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  loginButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  signupButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Hero
  hero: {
    backgroundColor: '#1E293B',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 3,
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: 800,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 56,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 28,
    maxWidth: 700,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  guestCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl * 1.5,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  guestCtaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  // Section
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    maxWidth: 800,
    alignSelf: 'center',
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  featureCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.sm,
    alignItems: 'center',
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureEmoji: {
    fontSize: 40,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Testimonials
  testimonialsSection: {
    backgroundColor: colors.white,
  },
  testimonialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  testimonialCard: {
    width: 360,
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  testimonialRole: {
    fontSize: 14,
    color: colors.textMuted,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
  },
  testimonialText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },

  // CTA Section
  ctaSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: colors.white + 'DD',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    maxWidth: 600,
  },
  ctaButtonLarge: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  ctaButtonLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  // Footer
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerLogoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  footerLink: {
    paddingHorizontal: spacing.sm,
  },
  footerLinkText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  copyright: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
