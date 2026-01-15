import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface TextInputComponentProps {
  onSubmit: (text: string) => Promise<void> | void;
  loading?: boolean;
  placeholder?: string;
}

export const TextInputComponent: React.FC<TextInputComponentProps> = ({
  onSubmit,
  loading = false,
  placeholder = 'Enter text here...',
}) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(text);
      setText('');
    } catch (error) {
      console.error('Error submitting text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          editable={!loading && !isLoading}
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || isLoading || !text.trim()) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || isLoading || !text.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialIcons name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.characterCount}>
        {text.length}/2000
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 80,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  characterCount: {
    marginTop: spacing.xs,
    fontSize: typography.small.fontSize,
    color: colors.textMuted,
    textAlign: 'right',
  },
});
