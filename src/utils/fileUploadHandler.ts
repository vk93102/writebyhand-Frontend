import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';


export const SUPPORTED_FORMATS = {
  documents: ['text/plain', 'text/markdown', 'application/pdf'],
  extensions: ['txt', 'md', 'pdf', 'jpg', 'jpeg', 'png'],
  images: ['image/jpeg', 'image/png'],
};


export const FILE_PICKER_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedMimeTypes: [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'image/jpeg',
    'image/png',
  ],
};


export const pickDocumentOrImage = async () => {
  try {
    console.log('[FileUpload] Starting document picker');

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'image/jpeg',
        'image/png',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      console.log('[FileUpload] Document picker cancelled');
      return null;
    }

    const file = result.assets[0];
    console.log('[FileUpload] Document selected:', {
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
    });

    // Validate file size
    if (file.size && file.size > FILE_PICKER_CONFIG.maxFileSize) {
      Alert.alert('File too large', 'Please select a file smaller than 10MB');
      return null;
    }

    return {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || getMimeTypeFromFileName(file.name),
      size: file.size,
    };
  } catch (error) {
    console.error('[FileUpload] Error picking document:', error);
    Alert.alert('Error', 'Failed to pick document');
    return null;
  }
};


export const pickImage = async (source: 'camera' | 'library' = 'library') => {
  try {
    console.log('[FileUpload] Starting image picker:', source);

    if (source === 'camera') {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission denied', 'Camera access is required');
        return null;
      }
    } else {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libraryPermission.status !== 'granted') {
        Alert.alert('Permission denied', 'Photo library access is required');
        return null;
      }
    }

    let result;
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (result.canceled) {
      console.log('[FileUpload] Image picker cancelled');
      return null;
    }

    const image = result.assets[0];
    console.log('[FileUpload] Image selected:', {
      uri: image.uri,
      width: image.width,
      height: image.height,
    });

    return {
      uri: image.uri,
      name: `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  } catch (error) {
    console.error('[FileUpload] Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
    return null;
  }
};

/**
 * Get MIME type from file name
 */
export const getMimeTypeFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
};

/**
 * Validate file before upload
 */
export const validateFile = (file: any): { valid: boolean; error?: string } => {
  // Check file exists
  if (!file || !file.uri) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size
  if (file.size && file.size > FILE_PICKER_CONFIG.maxFileSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const mimeType = file.type || getMimeTypeFromFileName(file.name);
  if (!FILE_PICKER_CONFIG.supportedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: 'File type not supported. Use: .txt, .md, .pdf, .jpg, .png',
    };
  }

  return { valid: true };
};

/**
 * Create FormData for multipart file upload
 */
export const createFormDataForUpload = (
  file: any,
  additionalData: Record<string, any> = {}
): FormData => {
  const formData = new FormData();

  // Add file with 'document' field name (MUST be 'document', not 'image')
  if (Platform.OS === 'web' && file instanceof File) {
    // Web File object
    formData.append('document', file);
  } else if (typeof file.uri === 'string') {
    // Mobile/native - convert to blob-like object
    const fileName = file.name || 'document';
    const mimeType = file.type || getMimeTypeFromFileName(fileName);

    formData.append('document', {
      uri: file.uri,
      type: mimeType,
      name: fileName,
    } as any);
  } else {
    throw new Error('Invalid file object');
  }

  // Add additional parameters
  Object.keys(additionalData).forEach((key) => {
    const value = additionalData[key];
    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  return formData;
};

export default {
  pickDocumentOrImage,
  pickImage,
  getMimeTypeFromFileName,
  validateFile,
  createFormDataForUpload,
  SUPPORTED_FORMATS,
  FILE_PICKER_CONFIG,
};
