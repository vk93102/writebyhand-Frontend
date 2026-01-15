/**
 * Premium Lock Badge Component
 * Displays lock icon for premium features
 * Used in navigation and feature cards
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PremiumLockBadgeProps {
  isPremium?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const PremiumLockBadge: React.FC<PremiumLockBadgeProps> = ({
  isPremium = true,
  size = 'medium',
  style,
}) => {
  if (!isPremium) return null;

  const sizes = {
    small: { size: 16, fontSize: 10, padding: 2 },
    medium: { size: 24, fontSize: 12, padding: 4 },
    large: { size: 32, fontSize: 14, padding: 6 },
  };

  const dimensions = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          width: dimensions.size,
          height: dimensions.size,
          padding: dimensions.padding,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.lockIcon,
          { fontSize: dimensions.fontSize },
        ]}
      >
        🔒
      </Text>
    </View>
  );
};

interface PremiumFeatureCardProps {
  title: string;
  description?: string;
  isLocked: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}

export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  title,
  description,
  isLocked,
  onPress,
  children,
}) => {
  return (
    <View
      style={[
        styles.card,
        isLocked && styles.lockedCard,
      ]}
    >
      {isLocked && <View style={styles.lockedOverlay} />}
      
      <View style={styles.cardContent}>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              isLocked && styles.lockedText,
            ]}
          >
            {title}
          </Text>
          {isLocked && (
            <PremiumLockBadge isPremium size="small" style={{ marginLeft: 8 }} />
          )}
        </View>

        {description && (
          <Text
            style={[
              styles.description,
              isLocked && styles.lockedText,
            ]}
          >
            {description}
          </Text>
        )}

        {children}

        {isLocked && (
          <Text style={styles.upgradePrompt}>
            Subscribe to unlock this feature
          </Text>
        )}
      </View>
    </View>
  );
};

interface NavigationItemWithLockProps {
  icon: string;
  label: string;
  isLocked: boolean;
  onPress?: () => void;
  badge?: string;
}

export const NavigationItemWithLock: React.FC<NavigationItemWithLockProps> = ({
  icon,
  label,
  isLocked,
  onPress,
  badge,
}) => {
  return (
    <View style={styles.navItemContainer}>
      <View style={styles.navItemContent}>
        <Text style={styles.navIcon}>{icon}</Text>
        
        <View style={styles.navLabelContainer}>
          <Text
            style={[
              styles.navLabel,
              isLocked && styles.navLabelLocked,
            ]}
          >
            {label}
          </Text>
          {badge && <Text style={styles.badge}>{badge}</Text>}
        </View>
      </View>

      {isLocked && (
        <View style={styles.navLockContainer}>
          <Text style={styles.navLockIcon}>🔒</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFA500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lockIcon: {
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lockedCard: {
    opacity: 0.7,
    borderColor: '#FFB6C1',
    backgroundColor: '#F5F5F5',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
  },
  cardContent: {
    zIndex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  lockedText: {
    color: '#999',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  upgradePrompt: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#D32F2F',
    borderLeftWidth: 3,
    borderLeftColor: '#D32F2F',
  },

  navItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  navLabelContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  navLabelLocked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  navLockContainer: {
    marginLeft: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 20,
    padding: 6,
  },
  navLockIcon: {
    fontSize: 14,
  },
});
