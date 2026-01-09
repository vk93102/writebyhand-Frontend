import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Dimensions, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import AnimatedLoader from './AnimatedLoader';
import LoadingWebm from './LoadingWebm';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

interface YouTubeSummaryData {
  title: string;
  channel_name?: string;
  video_duration?: string;
  summary: string;
  concepts?: Array<{ term: string; definition: string }>;
  notes: string[];
  questions: string[];
  estimated_reading_time?: string;
  difficulty_level?: string;
  keywords?: string[];
}

interface YouTubeSummarizerProps {
  summaryData: YouTubeSummaryData | null;
  loading: boolean;
  onSubmit: (videoUrl: string) => void;
  userId?: string;
  onUpgrade?: () => void;
}

export const YouTubeSummarizer: React.FC<YouTubeSummarizerProps> = ({ 
  summaryData, 
  loading, 
  onSubmit,
  userId,
  onUpgrade
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 
    summary: true, 
    concepts: true, 
    notes: false, 
    questions: false 
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(2);

  useEffect(() => {
    if (userId) {
      loadSubscriptionStatus();
    }
  }, [userId]);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await fetch(`https://ed-tech-backend-tzn8.onrender.com/api/subscription/status/?user_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setSubscriptionStatus(data);
        setUsageCount(data.usage?.youtube_summarizer || 0);
        setUsageLimit(data.plan === 'free' ? 2 : 999);
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    }
  };

  const handleSubmit = () => {
    if (!videoUrl.trim()) return;

    // Check usage limits for free users
    if (subscriptionStatus?.plan === 'free' && usageCount >= usageLimit) {
      Alert.alert(
        '⚠️ Usage Limit Reached',
        `You've reached your limit of ${usageLimit} YouTube summaries this month.\n\nUpgrade to Premium for unlimited access!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Now', onPress: onUpgrade, style: 'default' }
        ]
      );
      return;
    }

    onSubmit(videoUrl.trim());
  };

  const toggle = (key: string) => setExpanded({ ...expanded, [key]: !expanded[key] });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.pageCard}>
            <LoadingWebm visible={true} overlay={false} />
          </View>
        </View>
      </View>
    );
  }

  if (!summaryData) {
    return (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.pageCard}>
            <Image source={require('../../assets/Youtube.png')} style={styles.headerImage} />
            <Text style={styles.headerTitle}>YouTube Video Summarizer</Text>
            <Text style={styles.headerSubtitle}>Get AI-powered summaries, notes, and practice questions from any YouTube video.</Text>

            {/* Usage Indicator for Free Users */}
            {subscriptionStatus?.plan === 'free' && (
              <View style={styles.usageBanner}>
                <View style={styles.usageHeader}>
                  <MaterialIcons name="info-outline" size={20} color="#F59E0B" />
                  <Text style={styles.usageTitle}>Free Plan Limits</Text>
                </View>
                <View style={styles.usageBar}>
                  <View style={styles.usageBarBackground}>
                    <View 
                      style={[
                        styles.usageBarFill, 
                        { width: `${Math.min((usageCount / usageLimit) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.usageText}>
                    {usageCount} / {usageLimit} summaries used
                  </Text>
                </View>
                {usageCount >= usageLimit && (
                  <TouchableOpacity style={styles.upgradeSmallButton} onPress={onUpgrade}>
                    <MaterialIcons name="star" size={16} color="#fff" />
                    <Text style={styles.upgradeSmallText}>Upgrade for Unlimited</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>YouTube Video URL</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="link" size={20} color={colors.textMuted} />
                <TextInput
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="https://www.youtube.com/watch?v=..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  (!videoUrl.trim() || (subscriptionStatus?.plan === 'free' && usageCount >= usageLimit)) && styles.actionDisabled
                ]}
                onPress={handleSubmit}
                disabled={!videoUrl.trim() || (subscriptionStatus?.plan === 'free' && usageCount >= usageLimit)}
              >
                <MaterialIcons name="auto-awesome" size={20} color={colors.white} />
                <Text style={styles.actionText}>
                  {subscriptionStatus?.plan === 'free' && usageCount >= usageLimit 
                    ? 'Limit Reached - Upgrade' 
                    : 'Summarize Video'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.resultHeader}>
          <MaterialIcons name="play-circle-filled" size={40} color={colors.primary} />
          <View style={{ marginLeft: spacing.md }}>
            <Text style={styles.resultTitle}>{summaryData.title}</Text>
            {summaryData.channel_name ? <Text style={styles.resultChannel}>By {summaryData.channel_name}</Text> : null}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <TouchableOpacity onPress={() => toggle('summary')} style={styles.sectionHeaderSimple}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <MaterialIcons name={expanded.summary ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
          {expanded.summary && <Text style={styles.summaryText}>{summaryData.summary}</Text>}
        </View>

        {summaryData.concepts && summaryData.concepts.length > 0 && (
          <View style={styles.sectionCard}>
            <TouchableOpacity onPress={() => toggle('concepts')} style={styles.sectionHeaderSimple}>
              <Text style={styles.sectionTitle}>Key Concepts ({summaryData.concepts.length})</Text>
              <MaterialIcons name={expanded.concepts ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
            {expanded.concepts && summaryData.concepts.map((c, i) => (
              <View key={i} style={styles.conceptItem}>
                <Text style={styles.conceptTerm}>{c.term}</Text>
                <Text style={styles.conceptDefinition}>{c.definition}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionCard}>
          <TouchableOpacity onPress={() => toggle('notes')} style={styles.sectionHeaderSimple}>
            <Text style={styles.sectionTitle}>Notes ({summaryData.notes.length})</Text>
            <MaterialIcons name={expanded.notes ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
          {expanded.notes && summaryData.notes.map((n, i) => <Text key={i} style={styles.noteText}>• {n}</Text>)}
        </View>

        <View style={styles.sectionCard}>
          <TouchableOpacity onPress={() => toggle('questions')} style={styles.sectionHeaderSimple}>
            <Text style={styles.sectionTitle}>Practice Questions ({summaryData.questions.length})</Text>
            <MaterialIcons name={expanded.questions ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
          {expanded.questions && summaryData.questions.map((q, i) => <Text key={i} style={styles.questionText}>{i + 1}. {q}</Text>)}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: 'transparent', minHeight: 400 },
  loadingText: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  contentWrapper: { 
    flex: 1, 
    padding: spacing.lg, 
    width: '100%',
    maxWidth: isWeb ? 1400 : '100%', // Increased width from 800 to 1400
    alignSelf: 'center',
  },
  pageCard: { backgroundColor: 'transparent', borderRadius: 0, padding: 0, alignItems: 'center', width: '100%' },
  headerImage: { width: 100, height: 100, marginBottom: spacing.md },
  headerTitle: { ...typography.h2, textAlign: 'center', fontSize: isWeb ? 32 : 24 },
  headerSubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, fontSize: isWeb ? 18 : 16 },
  
  // Usage Banner Styles
  usageBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#F59E0B',
    width: '100%',
    maxWidth: isWeb ? 800 : '100%',
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  usageBar: {
    marginBottom: spacing.sm,
  },
  usageBarBackground: {
    height: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  upgradeSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  upgradeSmallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  
  inputCard: { 
    backgroundColor: colors.white, 
    marginHorizontal: isMobile ? 0 : 0,
    borderRadius: borderRadius.xl, 
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: spacing.lg,
    width: '100%',
    maxWidth: isWeb ? 1200 : '100%', // Increased from 800
  },
  inputLabel: { ...typography.h4, color: colors.text, marginBottom: spacing.md, fontWeight: '600' },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.background, 
    borderRadius: borderRadius.lg, 
    padding: spacing.md, 
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { marginLeft: spacing.sm, flex: 1, ...typography.body, color: colors.text, outlineStyle: 'none' as any, fontSize: isWeb ? 16 : 14 },
  actionButton: { 
    marginTop: spacing.sm, 
    backgroundColor: colors.primary, 
    paddingVertical: spacing.lg, 
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' as any,
    ...shadows.md,
    minHeight: isWeb ? 56 : 48,
  },
  actionDisabled: { opacity: 0.5, backgroundColor: colors.textMuted },
  actionText: { ...typography.h4, color: colors.white, marginLeft: spacing.sm, fontWeight: '600', fontSize: isWeb ? 18 : 16 },
  resultHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.lg, 
    backgroundColor: colors.white, 
    marginBottom: spacing.md, 
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  resultTitle: { ...typography.h3, flex: 1, fontSize: isWeb ? 24 : 20 },
  resultChannel: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  sectionCard: { 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg, 
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeaderSimple: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h3, fontSize: isWeb ? 20 : 18 },
  summaryText: { ...typography.body, marginTop: spacing.sm, color: colors.text, lineHeight: 24, fontSize: isWeb ? 16 : 14 },
  conceptItem: { marginTop: spacing.sm, paddingLeft: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: '#F0F9FF', padding: spacing.md, borderRadius: borderRadius.md },
  conceptTerm: { ...typography.h4, color: colors.primary, marginBottom: spacing.xs, fontSize: isWeb ? 16 : 14 },
  conceptDefinition: { ...typography.body, color: colors.text, fontSize: isWeb ? 15 : 13 },
  noteText: { ...typography.body, marginTop: spacing.sm, color: colors.text, fontSize: isWeb ? 15 : 13, lineHeight: 22 },
  questionText: { ...typography.body, marginTop: spacing.sm, color: colors.text, fontSize: isWeb ? 15 : 13, lineHeight: 22 },
});

export default YouTubeSummarizer;

