import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import AnimatedLoader from './AnimatedLoader';
import LoadingWebm from './LoadingWebm';

interface Concept {
  name: string;
  description: string;
}

interface Question {
  id: number;
  question: string;
  type: string;
}

interface StudyMaterialData {
  title: string;
  subject: string;
  topics: string[];
  concepts: Concept[];
  notes: string[];
  questions: Question[];
}

interface StudyMaterialProps {
  studyMaterialData: StudyMaterialData | null;
  loading: boolean;
}

export const StudyMaterial: React.FC<StudyMaterialProps> = ({ studyMaterialData, loading }) => {
  const [activeSection, setActiveSection] = useState<'topics' | 'concepts' | 'notes' | 'questions'>('topics');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingWebm visible={true} />
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  if (!studyMaterialData) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="school" size={64} color={colors.textMuted} />
        <Text style={styles.emptyText}>Upload a sample paper or paste text</Text>
        <Text style={styles.emptySubtext}>
          Get AI-generated topics, concepts, notes, and practice questions
        </Text>
      </View>
    );
  }

  const renderSectionButton = (
    section: 'topics' | 'concepts' | 'notes' | 'questions',
    icon: string,
    label: string,
    count: number
  ) => (
    <TouchableOpacity
      style={[styles.sectionButton, activeSection === section && styles.sectionButtonActive]}
      onPress={() => setActiveSection(section)}
    >
      <MaterialIcons
        name={icon as any}
        size={20}
        color={activeSection === section ? colors.white : colors.primary}
      />
      <Text style={[styles.sectionButtonText, activeSection === section && styles.sectionButtonTextActive]}>
        {label}
      </Text>
      <View style={[styles.countBadge, activeSection === section && styles.countBadgeActive]}>
        <Text style={[styles.countText, activeSection === section && styles.countTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialIcons name="auto-awesome" size={28} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>{studyMaterialData.title}</Text>
            <Text style={styles.subject}>{studyMaterialData.subject}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionButtons}>
        {renderSectionButton('topics', 'topic', 'Topics', studyMaterialData.topics.length)}
        {renderSectionButton('concepts', 'lightbulb', 'Concepts', studyMaterialData.concepts.length)}
        {renderSectionButton('notes', 'note', 'Notes', studyMaterialData.notes.length)}
        {renderSectionButton('questions', 'quiz', 'Questions', studyMaterialData.questions.length)}
      </View>

      <View style={styles.content}>
        {activeSection === 'topics' && (
          <View>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="topic" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Important Topics</Text>
            </View>
            {studyMaterialData.topics.map((topic, index) => (
              <View key={index} style={styles.topicItem}>
                <View style={styles.topicNumber}>
                  <Text style={styles.topicNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        )}

        {activeSection === 'concepts' && (
          <View>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="lightbulb" size={24} color={colors.warning} />
              <Text style={styles.sectionTitle}>Important Concepts</Text>
            </View>
            {studyMaterialData.concepts.map((concept, index) => (
              <View key={index} style={styles.conceptItem}>
                <View style={styles.conceptHeader}>
                  <MaterialIcons name="bookmark" size={18} color={colors.primary} />
                  <Text style={styles.conceptName}>{concept.name}</Text>
                </View>
                <Text style={styles.conceptDescription}>{concept.description}</Text>
              </View>
            ))}
          </View>
        )}

        {activeSection === 'notes' && (
          <View>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="note" size={24} color={colors.success} />
              <Text style={styles.sectionTitle}>Study Notes</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Concise, exam-focused notes for quick revision</Text>
            {studyMaterialData.notes.map((note, index) => (
              <View key={index} style={styles.noteItem}>
                <MaterialIcons name="fiber-manual-record" size={8} color={colors.primary} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </View>
        )}

        {activeSection === 'questions' && (
          <View>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="quiz" size={24} color={colors.error} />
              <Text style={styles.sectionTitle}>Practice Questions</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Descriptive questions for revision (no answers provided)
            </Text>
            {studyMaterialData.questions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>Q{question.id}</Text>
                  </View>
                  <View style={styles.questionTypeBadge}>
                    <Text style={styles.questionTypeText}>{question.type}</Text>
                  </View>
                </View>
                <Text style={styles.questionText}>{question.question}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerStats}>
          <View style={styles.footerStat}>
            <Text style={styles.footerStatValue}>{studyMaterialData.topics.length}</Text>
            <Text style={styles.footerStatLabel}>Topics</Text>
          </View>
          <View style={styles.footerStat}>
            <Text style={styles.footerStatValue}>{studyMaterialData.concepts.length}</Text>
            <Text style={styles.footerStatLabel}>Concepts</Text>
          </View>
          <View style={styles.footerStat}>
            <Text style={styles.footerStatValue}>{studyMaterialData.notes.length}</Text>
            <Text style={styles.footerStatLabel}>Notes</Text>
          </View>
          <View style={styles.footerStat}>
            <Text style={styles.footerStatValue}>{studyMaterialData.questions.length}</Text>
            <Text style={styles.footerStatLabel}>Questions</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'transparent',
    minHeight: 400,
  },
  loadingText: {
    ...typography.h4,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subject: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  sectionButtonActive: {
    backgroundColor: colors.primary,
  },
  sectionButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionButtonTextActive: {
    color: colors.white,
  },
  countBadge: {
    backgroundColor: colors.blue50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  countTextActive: {
    color: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  topicNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicNumberText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  topicText: {
    ...typography.body,
    flex: 1,
    fontWeight: '600',
  },
  conceptItem: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    ...shadows.sm,
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  conceptName: {
    ...typography.h4,
    color: colors.text,
  },
  conceptDescription: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  noteText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },
  questionItem: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  questionNumber: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  questionNumberText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  questionTypeBadge: {
    backgroundColor: colors.blue50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  questionTypeText: {
    ...typography.small,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  questionText: {
    ...typography.body,
    lineHeight: 24,
    color: colors.text,
  },
  footer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    ...shadows.md,
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  footerStat: {
    alignItems: 'center',
  },
  footerStatValue: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  footerStatLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
