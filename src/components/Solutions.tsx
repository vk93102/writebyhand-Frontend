import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const sample = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  title: `Solution #${i + 1}`,
  desc: 'Short overview and subject context',
  status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Draft' : 'Pending',
  updated: `${1 + i}h ago`,
}));

export const Solutions: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Solutions</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary}>
            <Text style={styles.btnText}>Add Solution</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
        {sample.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={[styles.badge, s.status === 'Active' ? styles.badgeActive : s.status === 'Draft' ? styles.badgeDraft : styles.badgePending]}>
                {s.status}
              </Text>
            </View>
            <Text style={styles.cardDesc}>{s.desc}</Text>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardMeta}>Updated {s.updated}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.linkBtn}>
                  <Text style={styles.linkText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn}>
                  <Text style={styles.smallText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h3 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btnPrimary: { backgroundColor: colors.primary, padding: spacing.sm, borderRadius: borderRadius.sm },
  btnSecondary: { borderWidth: 1, borderColor: colors.border, padding: spacing.sm, borderRadius: borderRadius.sm },
  btnText: { color: colors.white, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { width: '48%', backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, ...shadows.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { ...typography.h4, fontWeight: '700' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  badgeActive: { backgroundColor: colors.successLight, color: colors.success },
  badgeDraft: { backgroundColor: '#fffbeb', color: '#d97706' },
  badgePending: { backgroundColor: '#fef2f2', color: colors.error },
  cardDesc: { color: colors.textMuted, marginBottom: spacing.sm },
  cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { color: colors.textMuted },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  linkBtn: { padding: spacing.xs },
  smallBtn: { padding: spacing.xs },
  linkText: { color: colors.primary, fontWeight: '600' },
  smallText: { color: colors.textMuted },
});
