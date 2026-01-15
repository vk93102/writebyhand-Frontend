/**
 * Feature Lock Icon Component
 * Minimal production-level component for showing premium lock
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

interface FeatureLockIconProps {
  locked: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const FeatureLockIcon: React.FC<FeatureLockIconProps> = ({
  locked,
  size = 'small',
  showLabel = true,
}) => {
  if (!locked) return null;

  const sizes = {
    small: { icon: 18, container: 24 },
    medium: { icon: 24, container: 32 },
    large: { icon: 32, container: 44 },
  };

  const sizeConfig = sizes[size];

  return (
    <View style={[styles.container, { width: sizeConfig.container, height: sizeConfig.container }]}>
      <View style={styles.badge}>
        <MaterialIcons name="lock" size={sizeConfig.icon} color={colors.white} />
      </View>
      {showLabel && size === 'large' && (
        <Text style={styles.label}>Premium</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 8,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});

export default FeatureLockIcon;
