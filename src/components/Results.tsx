import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface ResultsProps {
  data: any;
}

export const Results: React.FC<ResultsProps> = ({ data }) => {
  const insets = useSafeAreaInsets();
  const handleLinkPress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      // ignore
    }
  };

  // Handle new API response format (solution, explanation, sources)
  const solution = data?.solution || '';
  const explanation = data?.explanation || '';
  const sources = data?.sources || [];
  const extractedText = data?.extracted_text || data?.search_query || '';
  const cleanedText = data?.extracted_text?.cleaned || data?.query?.cleaned || '';
  const source = data?.source || 'unknown';
  const processingTime = data?.processingTime || data?.metadata?.processingTime || 0;
  
  // Legacy format support
  const searchResults = data?.search_results?.results || [];
  const webContent = data?.web_content || [];
  const youtubeVideos = data?.youtube_videos || [];
  const confidence = data?.confidence?.overall ?? data?.ocr_confidence ?? 0;
  const pipeline = data?.pipeline || source;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
        <MaterialIcons name="check-circle" size={28} color={colors.success} />
        <Text style={styles.headerTitle}>Results Found!</Text>
      </View>

      {(pipeline || source) && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Source: <Text style={styles.infoBold}>{(pipeline || source).toUpperCase().replace('_', ' ')}</Text>
          </Text>
          {processingTime > 0 && (
            <Text style={styles.infoText}>
              Processing: <Text style={styles.infoBold}>{(processingTime / 1000).toFixed(2)}s</Text>
            </Text>
          )}
        </View>
      )}

      {solution && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Solution</Text>
          </View>
          <Text style={styles.solutionText}>{solution}</Text>
          {explanation && (
            <>
              <Text style={styles.explanationLabel}>Explanation:</Text>
              <Text style={styles.explanationText}>{explanation}</Text>
            </>
          )}
        </View>
      )}

      {extractedText ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="text-fields" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{pipeline === 'image' ? 'Extracted Text' : 'Your Question'}</Text>
          </View>
          <Text style={styles.extractedText}>{extractedText}</Text>
          {cleanedText && cleanedText !== extractedText && (
            <>
              <Text style={styles.cleanedLabel}>Cleaned:</Text>
              <Text style={styles.extractedText}>{cleanedText}</Text>
            </>
          )}
        </View>
      ) : null}

      {sources.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="link" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sources ({sources.length})</Text>
          </View>

          {sources.map((src: any, idx: number) => (
            <TouchableOpacity key={idx} style={styles.resultCard} onPress={() => src.url && handleLinkPress(src.url)}>
              <Text style={styles.resultTitle} numberOfLines={2}>{src.title || `Source ${idx + 1}`}</Text>
              <Text style={styles.resultSnippet} numberOfLines={3}>{src.snippet || src.description || 'No description available'}</Text>
              {src.url && (
                <View style={styles.linkContainer}>
                  <MaterialIcons name="open-in-new" size={14} color={colors.primary} />
                  <Text style={styles.linkText} numberOfLines={1}>{src.url}</Text>
                </View>
              )}
              {src.is_trusted && (
                <View style={styles.trustBadge}>
                  <MaterialIcons name="verified" size={12} color={colors.success} />
                  <Text style={styles.trustText}>Trusted Source</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="search" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Top Search Results ({data?.search_results?.total || searchResults.length})</Text>
          </View>

          {searchResults.slice(0, 5).map((res: any, idx: number) => (
            <TouchableOpacity key={idx} style={styles.resultCard} onPress={() => handleLinkPress(res.url || res.link)}>
              <Text style={styles.resultTitle} numberOfLines={2}>{res.title}</Text>
              <Text style={styles.resultSnippet} numberOfLines={3}>{res.snippet || res.description || 'No description available'}</Text>
              <View style={styles.linkContainer}>
                <MaterialIcons name="open-in-new" size={14} color={colors.primary} />
                <Text style={styles.linkText} numberOfLines={1}>{res.url || res.link}</Text>
              </View>
              {res.trust_score ? (
                <View style={styles.trustBadge}>
                  <MaterialIcons name="verified" size={12} color={colors.success} />
                  <Text style={styles.trustText}>Trusted Source</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {webContent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="article" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Detailed Content</Text>
          </View>

          {webContent.slice(0, 3).map((c: any, i: number) => (
            <View key={i} style={styles.contentCard}>
              <Text style={styles.contentTitle} numberOfLines={2}>{c.title || `Source ${i + 1}`}</Text>
              <Text style={styles.contentSnippet} numberOfLines={5}>{c.markdown || c.content || 'Content not available'}</Text>
              {c.url ? (
                <TouchableOpacity style={styles.readMoreButton} onPress={() => handleLinkPress(c.url)}>
                  <Text style={styles.readMoreText}>Read Full Article</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {youtubeVideos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="play-circle-filled" size={20} color={colors.error} />
            <Text style={styles.sectionTitle}>Video Tutorials</Text>
          </View>

          {youtubeVideos.slice(0, 3).map((v: any, i: number) => (
            <TouchableOpacity key={i} style={styles.resultCard} onPress={() => handleLinkPress(v.url || `https://www.youtube.com/watch?v=${v.videoId}`)}>
              <Text style={styles.resultTitle} numberOfLines={2}>{v.title}</Text>
              {v.description ? <Text style={styles.resultSnippet} numberOfLines={2}>{v.description}</Text> : null}
              <View style={styles.videoMetadata}>
                {v.channel ? <Text style={styles.channelText}>📺 {v.channel}</Text> : null}
                {v.views ? <Text style={styles.viewsText}>👁 {v.views}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  headerTitle: { ...typography.h2 },
  infoBox: { backgroundColor: colors.primary + '10', borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.primary },
  infoText: { ...typography.small, color: colors.textMuted },
  infoBold: { fontWeight: '600', color: colors.primary },

  section: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, color: colors.primary },
  extractedText: { ...typography.body, lineHeight: 22, backgroundColor: colors.backgroundGray, padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  cleanedLabel: { ...typography.small, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  solutionText: { ...typography.body, lineHeight: 24, marginBottom: spacing.md, color: colors.text },
  explanationLabel: { ...typography.small, color: colors.textMuted, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xs },
  explanationText: { ...typography.body, lineHeight: 22, backgroundColor: colors.backgroundGray, padding: spacing.md, borderRadius: borderRadius.sm },

  confidenceSection: { alignItems: 'center', marginBottom: spacing.lg },
  confidenceLabel: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xs },
  confidenceBadge: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg },
  confidenceValue: { ...typography.h1, color: colors.white, fontWeight: '700' },

  resultCard: { padding: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.backgroundGray, marginBottom: spacing.md },
  resultTitle: { ...typography.h4, marginBottom: spacing.xs },
  resultSnippet: { ...typography.small, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.sm },
  linkContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  linkText: { ...typography.small, color: colors.primary, flex: 1 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  trustText: { fontSize: 11, color: colors.success, fontWeight: '500' },

  contentCard: { backgroundColor: colors.backgroundGray, borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.md },
  contentTitle: { ...typography.h4, marginBottom: spacing.sm },
  contentSnippet: { ...typography.small, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.md },
  readMoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm },
  readMoreText: { ...typography.small, color: colors.primary, fontWeight: '600' },

  videoMetadata: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs, marginBottom: spacing.xs },
  channelText: { ...typography.small, color: colors.textMuted },
  viewsText: { ...typography.small, color: colors.textMuted },
});
