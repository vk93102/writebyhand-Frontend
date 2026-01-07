/**
 * Pair Quiz Main Container
 * Manages navigation between lobby, quiz, and results screens
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { PairQuizProvider } from '../../services/pair-quiz/pairQuizContext';
import { PairLobbyScreen } from './PairLobbyScreen';
import { PairQuizScreen } from './PairQuizScreen';
import { PairResultScreen } from './PairResultScreen';

type Screen = 'lobby' | 'quiz' | 'results';

interface PairQuizContainerProps {
  onExit: () => void;
}

export const PairQuizContainer: React.FC<PairQuizContainerProps> = ({ onExit }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');

  const handleQuizStart = () => {
    setCurrentScreen('quiz');
  };

  const handleQuizComplete = () => {
    setCurrentScreen('results');
  };

  const handleQuizCancel = () => {
    setCurrentScreen('lobby');
  };

  const handleDone = () => {
    setCurrentScreen('lobby');
    onExit();
  };

  return (
    <PairQuizProvider>
      <View style={{ flex: 1 }}>
        {currentScreen === 'lobby' && (
          <PairLobbyScreen onQuizStart={handleQuizStart} onBack={onExit} />
        )}
        
        {currentScreen === 'quiz' && (
          <PairQuizScreen onComplete={handleQuizComplete} onCancel={handleQuizCancel} />
        )}
        
        {currentScreen === 'results' && (
          <PairResultScreen onDone={handleDone} />
        )}
      </View>
    </PairQuizProvider>
  );
};
