import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface TextInputComponentProps {
  onSubmit: (data: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export const TextInputComponent: React.FC<TextInputComponentProps> = ({ 
  onSubmit, 
  loading,
  placeholder = "Paste your problem statement, show your work, or ask for hints..."
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed) {
      // pass the raw trimmed string to the parent handler
      onSubmit(trimmed);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textarea}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={8}
        editable={!loading}
      />

      <View style={styles.footer}>
        <Text style={styles.charCount}>{text.length} characters</Text>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Solve Question</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    minHeight: 340,
    justifyContent: 'space-between',
  },
  textarea: {
    borderWidth: 2,
    borderColor: '#e6eefb',
    borderRadius: borderRadius.xl,
    padding: spacing.lg * 1.2,
    fontSize: 16,
    backgroundColor: colors.backgroundGray,
    color: colors.text,
    minHeight: 240,
    flex: 1,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  charCount: {
    ...typography.small,
    color: colors.textMuted,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
