import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { colors } from '../styles/theme';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const handleAuthSuccess = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {mode === 'login' ? (
          <LoginScreen
            onSwitchToRegister={() => setMode('register')}
            onLoginSuccess={handleAuthSuccess}
          />
        ) : (
          <RegisterScreen
            onSwitchToLogin={() => setMode('login')}
            onRegisterSuccess={handleAuthSuccess}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
