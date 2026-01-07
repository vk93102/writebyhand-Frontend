import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface MockTestManagementProps {
  userRole?: 'admin' | 'moderator';
}

export const MockTestManagement: React.FC<MockTestManagementProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mock Test Management</Text>
      <Text style={styles.subtitle}>
        Upload/download mock test files and manage test availability
      </Text>
      {/* TODO: Implement mock test management features */}
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
