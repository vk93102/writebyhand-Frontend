import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface QuizManagementProps {
  userRole?: 'admin' | 'moderator';
}

export const QuizManagement: React.FC<QuizManagementProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz Management</Text>
      <Text style={styles.subtitle}>
        Configure Gemini API settings, prompt templates, and difficulty levels
      </Text>
      {/* TODO: Implement quiz management features */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
