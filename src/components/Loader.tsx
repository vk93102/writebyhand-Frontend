import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';

interface LoaderProps {
  size?: 'small' | 'large' | number;
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'large', color = '#000' }) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Dynamically import CSS only on web
      import('./Loader.css');
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <div className="edtech-loader" style={{ position: 'relative', width: 200, height: 200 }}>
        <div className="loader">
          <span>
            <span></span><span></span><span></span><span></span>
          </span>
          <div className="base">
            <span></span>
            <div className="face"></div>
          </div>
        </div>
        <div className="longfazers">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
    );
  }

  // Native fallback
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});

export { Loader };
export default Loader;
