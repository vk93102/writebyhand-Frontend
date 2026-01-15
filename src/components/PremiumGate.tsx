import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePremium } from '../context/PremiumContext';

/**
 * PremiumGate Component
 *
 * A reusable wrapper component that implements the "Freemium Teaser" pattern.
 * 
 * Features:
 * - Shows locked content with reduced opacity for free users
 * - Prevents interaction with locked content via pointerEvents="none"
 * - Displays an attractive lock overlay with unlock button
 * - Navigates to subscription screen on unlock attempt
 * - Smooth transitions and modern design
 *
 * Usage:
 * ```tsx
 * <PremiumGate featureName="Advanced Analytics">
 *   <HighValueChart />
 * </PremiumGate>
 * ```
 */

interface PremiumGateProps {
  /** The UI elements to protect */
  children: React.ReactNode;
  /** Display name of the feature being locked */
  featureName: string;
  /** Optional description text for the lock overlay */
  description?: string;
  /** Optional custom lock icon/emoji (default: 🔒) */
  lockIcon?: string;
  /** Optional custom button text (default: "Unlock Premium") */
  buttonText?: string;
  /** Opacity for locked content (0-1, default: 0.35) */
  lockedOpacity?: number;
  /** Callback when unlock button is pressed */
  onUnlock?: () => void;
}

const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  featureName,
  description,
  lockIcon = '🔒',
  buttonText = 'Unlock Premium',
  lockedOpacity = 0.35,
  onUnlock,
}) => {
  const { isPremium } = usePremium();

  /**
   * Handle unlock button press
   */
  const handleUnlockPress = () => {
    if (onUnlock) {
      onUnlock();
    }
  };

  // If user is premium, show content normally
  if (isPremium) {
    return <>{children}</>;
  }

  // If not premium, show with lock overlay
  return (
    <View style={styles.container}>
      {/* Locked Content (Disabled) */}
      <View style={[styles.lockedContent, { opacity: lockedOpacity }]} pointerEvents="none">
        {children}
      </View>

      {/* Lock Overlay */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleUnlockPress}
        style={styles.overlay}
      >
        {/* Semi-transparent background */}
        <View style={styles.overlayBackground} />

        {/* Lock Card Container */}
        <View style={styles.lockCard}>
          {/* Lock Icon */}
          <Text style={styles.lockIcon}>{lockIcon}</Text>

          {/* Title */}
          <Text style={styles.featureName}>{featureName}</Text>

          {/* Description */}
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          
          {!description && (
            <Text style={styles.description}>
              Upgrade to unlock premium features
            </Text>
          )}

          {/* Unlock Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleUnlockPress}
            style={styles.unlockButton}
          >
            <Text style={styles.unlockButtonText}>{buttonText}</Text>
          </TouchableOpacity>

          {/* Premium Benefits Hint */}
          <View style={styles.benefitsHint}>
            <Text style={styles.benefitText}>✨ Ad-free experience</Text>
            <Text style={styles.benefitText}>⭐ Advanced features</Text>
            <Text style={styles.benefitText}>🚀 Priority support</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  
  lockedContent: {
    // Content is rendered here but disabled
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: -1,
  },

  lockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  } as ViewStyle,

  lockIcon: {
    fontSize: 56,
    marginBottom: 16,
    textAlign: 'center',
  },

  featureName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  } as TextStyle,

  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  unlockButton: {
    backgroundColor: '#6C63FF', // Modern purple
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,

  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,

  benefitsHint: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 14,
    width: '100%',
  } as ViewStyle,

  benefitText: {
    fontSize: 12,
    color: '#888888',
    marginVertical: 3,
    textAlign: 'center',
  } as TextStyle,
});

export default PremiumGate;
