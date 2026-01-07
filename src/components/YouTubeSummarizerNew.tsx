import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Dimensions, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import AnimatedLoader from './AnimatedLoader';
import LoadingWebm from './LoadingWebm';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;
const API_BASE = 'http://127.0.0.1:8000/api';

interface YouTubeSummarizerProps {
  summaryData?: any;
  loading?: boolean;
  onSubmit?: (url: string) => void;
  userId?: string;
  onUpgrade?: () => void;
}

export default function YouTubeSummarizerNew({ 
  summaryData = null, 
  loading = false, 
  onSubmit = () => {},
  userId,
  onUpgrade
}: YouTubeSummarizerProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const [usageCount, setUsageCount] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(2);

  useEffect(() => {
    if (userId) {
      loadSubscriptionStatus();
    }
  }, [userId]);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/subscription/status/?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.plan || 'free');
        setUsageCount(data.usage?.youtube_summarizer || 0);
        setUsageLimit(data.limits?.youtube_summarizer || 2);
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
      setSubscriptionStatus('free');
      setUsageLimit(2);
    }
  };

  const handleSubmit = () => {
    // Check usage limit for free users
    if (subscriptionStatus === 'free' && usageCount >= usageLimit) {
      Alert.alert(
        'Usage Limit Reached',
        `You've used all ${usageLimit} free summaries this month. Upgrade to Premium for unlimited access!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Now', onPress: onUpgrade }
        ]
      );
      return;
    }
    
    onSubmit(videoUrl.trim());
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <LoadingWebm visible={true} overlay={false} />
        </View>
      </View>
    );
  }

  if (!summaryData) {
    const showUsageBanner = subscriptionStatus === 'free' && userId;
    const isLimitReached = usageCount >= usageLimit;
    const progressPercent = (usageCount / usageLimit) * 100;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Image source={require('../../assets/Youtube.png')} style={styles.headerImage} />
          <Text style={styles.title}>YouTube Video Summarizer</Text>
          <Text style={styles.subtitle}>Get AI-powered summaries, notes and practice questions.</Text>

          {/* Usage Banner for Free Users */}
          {showUsageBanner && (
            <View style={styles.usageBanner}>
              <View style={styles.usageBannerHeader}>
                <View style={styles.usageBannerTitleRow}>
                  <MaterialIcons name="info-outline" size={20} color="#F59E0B" />
                  <Text style={styles.usageBannerTitle}>Free Plan Limits</Text>
                </View>
                {isLimitReached && onUpgrade && (
                  <TouchableOpacity 
                    style={styles.upgradeSmallButton}
                    onPress={onUpgrade}
                  >
                    <Text style={styles.upgradeSmallButtonText}>Upgrade</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.usageBannerText}>
                {usageCount}/{usageLimit} summaries used this month
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progressPercent}%`,
                      backgroundColor: isLimitReached ? '#EF4444' : '#F59E0B'
                    }
                  ]} 
                />
              </View>
            </View>
          )}

          <TextInput
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <TouchableOpacity
            style={[
              styles.button, 
              (!videoUrl.trim() || isLimitReached) && styles.buttonDisabled
            ]}
            disabled={!videoUrl.trim() || isLimitReached}
            onPress={handleSubmit}
          >
            <MaterialIcons name="auto-awesome" size={20} color={colors.white} />
            <Text style={styles.buttonText}>
              {isLimitReached ? 'Limit Reached' : 'Summarize'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={styles.card}>
        <Text style={styles.title}>{summaryData.title}</Text>
        <Text style={styles.summary}>{summaryData.summary}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background, 
    padding: isMobile ? spacing.md : spacing.lg 
  },
  card: { 
    width: '100%', 
    maxWidth: isWeb ? 1200 : '100%', 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.lg, 
    padding: isMobile ? spacing.lg : spacing.xl, 
    ...shadows.md, 
    alignItems: 'center' 
  },
  headerImage: { 
    width: isMobile ? 64 : 80, 
    height: isMobile ? 64 : 80, 
    marginBottom: spacing.md 
  },
  title: { 
    ...typography.h2, 
    fontSize: isWeb ? 32 : (isMobile ? 22 : 28), 
    textAlign: 'center', 
    marginBottom: spacing.sm,
    fontWeight: '700'
  },
  subtitle: { 
    ...typography.body, 
    fontSize: isWeb ? 18 : (isMobile ? 14 : 16), 
    color: colors.textMuted, 
    textAlign: 'center', 
    marginBottom: spacing.lg, 
    paddingHorizontal: isMobile ? 0 : spacing.md,
    lineHeight: isWeb ? 28 : 22
  },
  usageBanner: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  usageBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  usageBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  usageBannerTitle: {
    fontSize: isWeb ? 16 : 14,
    fontWeight: '600',
    color: '#92400E',
  },
  usageBannerText: {
    fontSize: isWeb ? 14 : 12,
    color: '#78350F',
    marginBottom: spacing.xs,
  },
  upgradeSmallButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  upgradeSmallButtonText: {
    color: colors.white,
    fontSize: isWeb ? 14 : 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: borderRadius.md, 
    padding: spacing.md, 
    marginBottom: spacing.md, 
    color: colors.text,
    fontSize: isWeb ? 16 : (isMobile ? 14 : 16),
    minHeight: isMobile ? 44 : 48,
  },
  button: { 
    width: '100%', 
    backgroundColor: colors.primary, 
    padding: spacing.md, 
    borderRadius: borderRadius.md, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: spacing.sm, 
    alignItems: 'center' as any,
    minHeight: isMobile ? 48 : 52,
  },
  buttonDisabled: { 
    opacity: 0.6, 
    backgroundColor: colors.textMuted 
  },
  buttonText: { 
    ...typography.h4, 
    color: colors.white, 
    marginLeft: spacing.sm,
    fontSize: isWeb ? 18 : 16,
    fontWeight: '600'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 20, 
    backgroundColor: 'transparent' 
  },
  loadingText: { 
    ...typography.h3, 
    color: colors.text 
  },
  summary: { 
    ...typography.body, 
    color: colors.text,
    fontSize: isWeb ? 16 : 14,
    lineHeight: isWeb ? 24 : 20
  },
});