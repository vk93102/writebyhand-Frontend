import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface ImageUploadProps {
  onSubmit: (data: any) => void;
  loading: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onSubmit, loading }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    // Request permissions only on mobile platforms
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant camera roll permissions');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    // Request permissions only on mobile platforms
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant camera permissions');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (imageUri) {
      onSubmit(imageUri);
    }
  };

  const handleRemove = () => {
    setImageUri(null);
  };

  return (
    <View style={styles.container}>
      {!imageUri ? (
        <View style={styles.dropzone}>
          <MaterialIcons name="cloud-upload" size={80} color={colors.primary} />
          <Text style={styles.dropzoneTitle}>Upload Question Image</Text>
          <Text style={styles.dropzoneHint}>
            Drop problem photos and let{'\n'}OCR do the rest
          </Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <MaterialIcons name="insert-photo" size={20} color={colors.white} />
            <Text style={styles.uploadButtonText}>Choose File</Text>
          </TouchableOpacity>
          <Text style={styles.supportedFormats}>Supports JPG, PNG, GIF, BMP</Text>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Solve Question</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRemove}
              disabled={loading}
            >
              <MaterialIcons name="delete" size={18} color={colors.secondary} />
              <Text style={styles.secondaryButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: borderRadius.lg,
    padding: spacing.xxxl * 2,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  dropzoneTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dropzoneHint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  uploadButton: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  supportedFormats: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  previewContainer: {
    gap: spacing.xl,
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
