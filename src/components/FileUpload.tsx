import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface FileUploadProps {
  onSubmit: (files: any[]) => void;
  loading: boolean;
  placeholder?: string;
  acceptedTypes?: string[];
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onSubmit, 
  loading,
  placeholder = "Upload document(s) (PDF, TXT, or Image)",
  acceptedTypes = ['application/pdf', 'text/plain', 'image/*'],
  multiple = true
}) => {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes,
        copyToCacheDirectory: true,
        multiple: multiple,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        // For web, expo-document-picker returns file property
        const processedAssets = result.assets.map(asset => {
          if (Platform.OS === 'web' && asset.file) {
            // Web returns a File object in the file property
            return {
              ...asset,
              file: asset.file,
              uri: asset.uri,
              name: asset.name,
              size: asset.size,
              mimeType: asset.mimeType || asset.file.type
            };
          }
          return asset;
        });
        
        if (multiple) {
          setSelectedFiles(processedAssets);
        } else {
          setSelectedFiles([processedAssets[0]]);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onSubmit(selectedFiles);
    }
  };

  const handleRemove = (index?: number) => {
    if (index !== undefined) {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedFiles([]);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'picture-as-pdf';
      case 'txt':
        return 'description';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      default:
        return 'insert-drive-file';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <View style={styles.container}>
      {selectedFiles.length === 0 ? (
        <View style={styles.dropzone}>
          <MaterialIcons name="upload-file" size={64} color={colors.primary} />
          <Text style={styles.dropzoneTitle}>Upload Document{multiple ? 's' : ''}</Text>
          <Text style={styles.dropzoneHint}>{placeholder}</Text>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickDocument}
            disabled={loading}
          >
            <MaterialIcons name="folder-open" size={20} color={colors.white} />
            <Text style={styles.uploadButtonText}>Choose File{multiple ? 's' : ''}</Text>
          </TouchableOpacity>
          <Text style={styles.supportedFormats}>
            Supports PDF, TXT, JPG, PNG{multiple ? ' (multiple files)' : ''}
          </Text>
        </View>
      ) : (
        <View style={styles.filePreview}>
          {selectedFiles.map((file, index) => (
            <View key={index} style={styles.fileInfo}>
              <MaterialIcons 
                name={getFileIcon(file.name) as any} 
                size={48} 
                color={colors.primary} 
              />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>
                  {file.size ? formatFileSize(file.size) : 'Unknown size'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(index)} disabled={loading}>
                <MaterialIcons name="close" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {multiple && !loading && (
            <TouchableOpacity 
              style={styles.addMoreButton} 
              onPress={pickDocument}
            >
              <MaterialIcons name="add" size={20} color={colors.primary} />
              <Text style={styles.addMoreText}>Add More Files</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Processing...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="send" size={20} color={colors.white} />
                <Text style={styles.submitButtonText}>
                  Generate from {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 340,
  },
  dropzone: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundGray,
    minHeight: 340,
  },
  dropzoneTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dropzoneHint: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  uploadButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  supportedFormats: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  filePreview: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  fileSize: {
    ...typography.caption,
    color: colors.textMuted,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  addMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  submitButtonText: {
    ...typography.h4,
    color: colors.white,
  },
});
