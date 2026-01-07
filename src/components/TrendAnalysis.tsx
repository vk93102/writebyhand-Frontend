import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import trendsData from '../../Trends.json';

interface TrendAnalysisProps {
  onClose: () => void;
}

type ExamType = 'class_10_boards' | 'class_12_boards' | 'jee_mains' | 'jee_advanced' | 'neet' | 'gate';

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ onClose }) => {
  const [selectedExam, setSelectedExam] = useState<ExamType>('jee_mains');
  const [selectedSubject, setSelectedSubject] = useState<string>('mathematics');

  const exams = [
    { id: 'class_10_boards' as ExamType, name: 'Class 10', icon: 'school' },
    { id: 'class_12_boards' as ExamType, name: 'Class 12', icon: 'school' },
    { id: 'jee_mains' as ExamType, name: 'JEE Main', icon: 'school' },
    { id: 'jee_advanced' as ExamType, name: 'JEE Advanced', icon: 'school' },
    { id: 'neet' as ExamType, name: 'NEET', icon: 'medical-services' },
    { id: 'gate' as ExamType, name: 'GATE', icon: 'engineering' },
  ];

  const examData = trendsData.exam_trends[selectedExam];
  const subjects = examData?.subjects ? Object.keys(examData.subjects) : [];
  const subjectData = examData?.subjects?.[selectedSubject as keyof typeof examData.subjects];

  const getChapters = () => {
    if (!subjectData) return [];
    if ('chapters' in subjectData) {
      return (subjectData as any).chapters;
    }
    return [];
  };

  const chapters = getChapters();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="analytics" size={32} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Exam Trend Analysis</Text>
            <Text style={styles.headerSubtitle}>Based on 10 years of data</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Exam Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Exam</Text>
            <View style={styles.examGrid}>
              {exams.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={[
                    styles.examCard,
                    selectedExam === exam.id && styles.examCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedExam(exam.id);
                    setSelectedSubject('mathematics');
                  }}
                >
                    {exam.id === 'class_10_boards' || exam.id === 'class_12_boards' ? (
                      <View style={[styles.examNumberBadge, selectedExam === exam.id && styles.examNumberBadgeActive]}>
                        <Text style={[styles.examNumberText, selectedExam === exam.id && styles.examNumberTextActive]}>{exam.id === 'class_10_boards' ? '10' : '12'}</Text>
                      </View>
                    ) : (
                      <MaterialIcons
                        name={exam.icon as any}
                        size={24}
                        color={selectedExam === exam.id ? colors.primary : colors.textMuted}
                      />
                    )}
                  <Text
                    style={[
                      styles.examCardText,
                      selectedExam === exam.id && styles.examCardTextSelected,
                    ]}
                  >
                    {exam.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exam Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Duration: {examData?.exam_info?.duration}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="assignment" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Total Marks: {examData?.exam_info?.total_marks}
              </Text>
            </View>
            {(examData?.exam_info as any)?.questions && (
              <View style={styles.infoRow}>
                <MaterialIcons name="quiz" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Questions: {(examData.exam_info as any).questions}
                </Text>
              </View>
            )}
          </View>

          {/* Subject Selector */}
          {subjects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Subject</Text>
              <View style={styles.subjectGrid}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectCard,
                      selectedSubject === subject && styles.subjectCardSelected,
                    ]}
                    onPress={() => setSelectedSubject(subject)}
                  >
                    <Text
                      style={[
                        styles.subjectCardText,
                        selectedSubject === subject && styles.subjectCardTextSelected,
                      ]}
                    >
                      {subject.charAt(0).toUpperCase() + subject.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Chapters Analysis */}
          {chapters.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chapter-wise Weightage</Text>
              {chapters.map((chapter: any, index: number) => (
                <View key={index} style={styles.chapterCard}>
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterName}>{chapter.name}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor:
                            chapter.priority === 'high'
                              ? '#DCFCE7'
                              : chapter.priority === 'medium'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          {
                            color:
                              chapter.priority === 'high'
                                ? '#16A34A'
                                : chapter.priority === 'medium'
                                ? '#CA8A04'
                                : '#DC2626',
                          },
                        ]}
                      >
                        {chapter.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chapterStats}>
                    <View style={styles.statItem}>
                      <MaterialIcons name="trending-up" size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Weightage</Text>
                      <Text style={styles.statValue}>{chapter.weightage}%</Text>
                    </View>

                    {chapter.average_questions && (
                      <View style={styles.statItem}>
                        <MaterialIcons name="help-outline" size={16} color={colors.primary} />
                        <Text style={styles.statLabel}>Avg Questions</Text>
                        <Text style={styles.statValue}>{chapter.average_questions}</Text>
                      </View>
                    )}

                    <View style={styles.statItem}>
                      <MaterialIcons name="show-chart" size={16} color={colors.primary} />
                      <Text style={styles.statLabel}>Difficulty</Text>
                      <Text style={styles.statValue}>
                        {chapter.difficulty?.replace('-', ' ') || 'Medium'}
                      </Text>
                    </View>
                  </View>
                  

                  {chapter.subtopics && chapter.subtopics.length > 0 && (
                    <View style={styles.subtopicsContainer}>
                      <Text style={styles.subtopicsTitle}>Key Topics:</Text>
                      <View style={styles.subtopicsGrid}>
                        {chapter.subtopics.map((topic: string, idx: number) => (
                          <View key={idx} style={styles.subtopicChip}>
                            <Text style={styles.subtopicText}>{topic}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Preparation Strategy */}
          {trendsData.preparation_strategies[selectedExam.replace('_boards', '') as keyof typeof trendsData.preparation_strategies] && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preparation Strategy</Text>
              <View style={styles.strategyCard}>
                {(() => {
                  const strategy = trendsData.preparation_strategies[selectedExam.replace('_boards', '') as keyof typeof trendsData.preparation_strategies];
                  return (
                    <>
                      <View style={styles.strategyRow}>
                        <MaterialIcons name="access-time" size={20} color={colors.primary} />
                        <Text style={styles.strategyText}>
                          Timeline: {strategy.timeline}
                        </Text>
                      </View>
                      <View style={styles.strategyRow}>
                        <MaterialIcons name="schedule" size={20} color={colors.primary} />
                        <Text style={styles.strategyText}>
                          Daily Hours: {strategy.daily_hours}
                        </Text>
                      </View>
                      <View style={styles.strategyRow}>
                        <MaterialIcons name="book" size={20} color={colors.primary} />
                        <Text style={styles.strategyText}>
                          Focus: {strategy.focus}
                        </Text>
                      </View>

                      <View style={styles.tipsContainer}>
                        <Text style={styles.tipsTitle}>Key Tips:</Text>
                        {strategy.key_tips.map((tip: string, idx: number) => (
                          <View key={idx} style={styles.tipRow}>
                            <MaterialIcons name="check-circle" size={16} color="#10B981" />
                            <Text style={styles.tipText}>{tip}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  examGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  examCard: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  examCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  examCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  examCardTextSelected: {
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  subjectCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  subjectCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  subjectCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subjectCardTextSelected: {
    color: colors.white,
  },
  chapterCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chapterStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  subtopicsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subtopicsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtopicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  classIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  classIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  subtopicChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.sm,
  },
  subtopicText: {
    fontSize: 12,
    color: colors.text,
  },
  strategyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  strategyText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  tipsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  examNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examNumberBadgeActive: {
    backgroundColor: colors.primary,
  },
  examNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  examNumberTextActive: {
    color: colors.white,
  },
});
