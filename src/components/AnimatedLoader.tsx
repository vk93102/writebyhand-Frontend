import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Text } from 'react-native';
import { colors, spacing } from '../styles/theme';

interface AnimatedLoaderProps {
  visible?: boolean;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  text?: string;
  color?: string;
}

const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  visible = true,
  size = 'medium',
  overlay = false,
  text = '',
  color = colors.primary,
}) => {
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const sizeMap = {
    small: 60,
    medium: 100,
    large: 150,
  };

  const coinSize = sizeMap[size];

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Spinning animation
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        })
      ).start();

      // Scale bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Pulse glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      opacity.setValue(0);
      spin.setValue(0);
      scale.setValue(1);
      pulse.setValue(1);
    }
  }, [visible]);

  if (!visible) return null;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <Animated.View style={[styles.loaderContent, { opacity }]}>
      {/* Outer pulse glow */}
      <Animated.View
        style={[
          styles.pulseOuter,
          {
            width: coinSize * 1.8,
            height: coinSize * 1.8,
            borderRadius: coinSize * 0.9,
            backgroundColor: `${color}20`,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* Middle pulse */}
      <Animated.View
        style={[
          styles.pulseMiddle,
          {
            width: coinSize * 1.4,
            height: coinSize * 1.4,
            borderRadius: coinSize * 0.7,
            backgroundColor: `${color}35`,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* Spinning coin with bounce */}
      <Animated.Image
        source={require('../../assets/coins.png')}
        style={[
          styles.coinImage,
          {
            width: coinSize,
            height: coinSize,
            transform: [{ rotate }, { scale }],
          },
        ]}
        resizeMode="contain"
      />

      {/* Orbiting particles */}
      <Animated.View
        style={[
          styles.particle,
          {
            width: size === 'small' ? 6 : 8,
            height: size === 'small' ? 6 : 8,
            backgroundColor: color,
            transform: [
              { rotate },
              { translateX: coinSize * 0.7 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          {
            width: size === 'small' ? 6 : 8,
            height: size === 'small' ? 6 : 8,
            backgroundColor: color,
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['120deg', '480deg'],
                }),
              },
              { translateX: coinSize * 0.7 },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          {
            width: size === 'small' ? 6 : 8,
            height: size === 'small' ? 6 : 8,
            backgroundColor: color,
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['240deg', '600deg'],
                }),
              },
              { translateX: coinSize * 0.7 },
            ],
          },
        ]}
      />

      {text && (
        <Animated.Text
          style={[
            styles.loadingText,
            { color, marginTop: size === 'small' ? 8 : 16 },
            { opacity: pulse },
          ]}
        >
          {text}
        </Animated.Text>
      )}
    </Animated.View>
  );

  if (overlay) {
    return (
      <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="auto">
        {content}
      </Animated.View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    // Subtle light dim to blend with app background and ensure visibility on all themes
    backgroundColor: 'rgba(249,250,251,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    position: 'absolute',
  },
  pulseMiddle: {
    position: 'absolute',
  },
  coinImage: {
    zIndex: 2,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AnimatedLoader;
