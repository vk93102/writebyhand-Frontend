import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { getDailyQuizAttempt } from '../services/api';

interface Props {
  userId: string;
  quizId: string;
  onClose: () => void;
  initialResults?: any; // optional results object if we already have them
}

export const DailyQuizResults: React.FC<Props> = ({ userId, quizId, onClose, initialResults }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(initialResults || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getDailyQuizAttempt(userId, quizId);
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.container}><ActivityIndicator size="large" color={colors.primary} /></View>
  );

  if (error) return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
    </View>
  );

  if (!data) return null;

  const items = data.results ?? data.result?.results ?? [];
  const headerCorrect = data.correct_count ?? data.result?.correct_count ?? 0;
  const headerTotal = data.total_questions ?? data.result?.total_questions ?? items.length;
  const headerScore = data.score_percentage ?? data.result?.score_percentage ?? Math.round((headerCorrect / Math.max(1, headerTotal)) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Detailed Results</Text>
        <Text style={styles.subTitle}>{data.date ?? ''} — Score: {headerCorrect}/{headerTotal} ({Math.round(headerScore)}%)</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.questionCard}><Text style={styles.errorText}>No detailed question results available.</Text></View>
      ) : items.map((r: any) => (
        <View key={r.question_id} style={styles.questionCard}>
          <View style={styles.questionRow}>
            <Text style={styles.questionText}>{r.question_id}. {r.question}</Text>
            {r.is_correct ? (
              <View style={styles.correctBadge}><MaterialIcons name="check-circle" size={18} color={colors.success} /><Text style={styles.badgeText}>Correct</Text></View>
            ) : (
              <View style={styles.incorrectBadge}><MaterialIcons name="cancel" size={18} color={colors.error} /><Text style={styles.badgeText}>Incorrect</Text></View>
            )}
          </View>

          <View style={styles.optionsList}>
            {r.options && Array.isArray(r.options) ? r.options.map((opt: string, idx: number) => {
              const isUser = idx === r.user_answer_index;
              const isCorrect = idx === r.correct_answer_index;
              return (
                <View key={idx} style={[styles.optionRow, isCorrect && styles.optionCorrect, isUser && styles.optionUser]}>
                  {isCorrect ? (
                    <MaterialIcons name="check" size={16} color={colors.white} />
                  ) : isUser ? (
                    <MaterialIcons name="radio-button-checked" size={16} color={colors.primary} />
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={16} color="#9CA3AF" />
                  )}
                  <Text style={[styles.optionText, isCorrect && styles.optionTextCorrect, isUser && styles.optionTextUser]}>{opt}</Text>
                </View>
              );
            }) : (
              <View style={styles.optionRow}><Text style={styles.optionText}>Your answer: {r.user_answer ?? r.user_answer_index ?? 'N/A'}</Text></View>
            )}
          </View>

          {r.explanation ? (
            <View style={styles.explanationBox}><Text style={styles.explanationText}>{r.explanation}</Text></View>
          ) : null}
        </View>
      ))}

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeBtnText}>Close</Text></TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subTitle: { fontSize: 14, color: '#6B7280', marginTop: 6 },
  questionCard: { backgroundColor: '#FAFAFB', borderRadius: 10, padding: spacing.md, marginBottom: spacing.md },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionText: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  correctBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 6, borderRadius: 8 },
  incorrectBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', padding: 6, borderRadius: 8 },
  badgeText: { marginLeft: 6, color: '#111827', fontWeight: '700' },
  optionsList: { marginTop: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginBottom: 6 },
  optionCorrect: { backgroundColor: '#0ea5a533' },
  optionUser: { backgroundColor: '#EFF6FF' },
  optionText: { marginLeft: 8, color: '#111827' },
  optionTextCorrect: { color: '#065F46', fontWeight: '700' },
  optionTextUser: { color: '#1E40AF', fontWeight: '600' },
  explanationBox: { marginTop: spacing.sm, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8 },
  explanationText: { color: '#6B7280' },
  closeBtn: { marginTop: spacing.lg, alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 30, backgroundColor: colors.primary, borderRadius: 8 },
  closeBtnText: { color: '#FFFFFF', fontWeight: '700' },
  closeButton: { marginTop: spacing.md },
  closeText: { color: colors.primary },
  errorText: { color: '#B91C1C' }
});
