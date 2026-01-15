// Example: How to add ads to Daily Quiz Screen
// This shows the exact locations where to add: await showAd();

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useShowAdAfterFeature } from '../hooks/useShowAdAfterFeature';

export const DailyQuizScreenWithAds = ({ navigation }: any) => {
  const [quizState, setQuizState] = useState<'loading' | 'quiz' | 'complete'>('loading');
  const [quizData, setQuizData] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);

  // 🎯 GET THE AD HOOK - ONE LINE
  const { showAd } = useShowAdAfterFeature();

  // ✅ EXAMPLE 1: Show ad when user completes quiz
  const handleSubmitQuiz = async () => {
    try {
      console.log('Quiz submitted');

      // Calculate score
      let correctAnswers = 0;
      if (quizData?.questions) {
        quizData.questions.forEach((question: any) => {
          if (selectedAnswers[question.id] === question.correct_answer) {
            correctAnswers++;
          }
        });
      }
      setScore(correctAnswers);
      setQuizState('complete');

      // 🎬 SHOW AD HERE - Just one line!
      await showAd();

      console.log('Ad shown, quiz complete');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz');
    }
  };

  // ✅ EXAMPLE 2: Show ad when user skips quiz
  const handleSkipQuiz = async () => {
    Alert.alert('Skip Quiz', 'Are you sure? No points awarded.', [
      {
        text: 'Cancel',
        onPress: () => console.log('Skip cancelled'),
        style: 'cancel',
      },
      {
        text: 'Skip',
        onPress: async () => {
          setQuizState('complete');

          // 🎬 SHOW AD HERE TOO
          await showAd();

          // Go back
          navigation.goBack();
        },
      },
    ]);
  };

  // ✅ EXAMPLE 3: Show ad when returning to dashboard
  const handleReturnToDashboard = async () => {
    // 🎬 OPTIONAL: Show ad on exit too
    await showAd();

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {quizState === 'loading' && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Daily Quiz...</Text>
        </View>
      )}

      {quizState === 'quiz' && quizData && (
        <ScrollView style={styles.quizContainer}>
          <Text style={styles.title}>Daily Quiz</Text>
          <Text style={styles.description}>{quizData.title}</Text>

          {/* Quiz questions would go here */}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitQuiz}>
            <Text style={styles.submitButtonText}>Submit Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkipQuiz}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {quizState === 'complete' && (
        <ScrollView style={styles.completeContainer} contentContainerStyle={styles.centerContent}>
          <Text style={styles.completeTitle}>Quiz Complete!</Text>
          <Text style={styles.scoreText}>Score: {score}/10</Text>
          <Text style={styles.completeMessage}>Great job! An ad was shown above.</Text>

          <TouchableOpacity style={styles.returnButton} onPress={handleReturnToDashboard}>
            <Text style={styles.returnButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quizContainer: {
    flex: 1,
    padding: 20,
  },
  completeContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#007AFF',
  },
  completeMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  returnButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
