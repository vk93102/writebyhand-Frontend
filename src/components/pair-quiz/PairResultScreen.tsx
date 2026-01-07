/**
 * Pair Quiz Results Screen - Side-by-side comparison
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePairQuiz } from '../../services/pair-quiz/pairQuizContext';

interface PairResultScreenProps {
  onDone: () => void;
}

export const PairResultScreen: React.FC<PairResultScreenProps> = ({ onDone }) => {
  const { session, isHost, resetState } = usePairQuiz();

  if (!session) {
    return null;
  }

  const myScore = isHost ? session.hostScore : session.partnerScore;
  const partnerScore = isHost ? session.partnerScore : session.hostScore;
  const myAnswers = isHost ? session.hostAnswers : session.partnerAnswers;
  const partnerAnswers = isHost ? session.partnerAnswers : session.hostAnswers;
  const myTimeTaken = isHost ? session.hostTimeTaken : session.partnerTimeTaken;
  const partnerTimeTaken = isHost ? session.partnerTimeTaken : session.hostTimeTaken;

  const winner = (myScore || 0) > (partnerScore || 0) ? 'you' : 
                 (myScore || 0) < (partnerScore || 0) ? 'partner' : 'tie';

  const handleDone = () => {
    resetState();
    onDone();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Complete!</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Winner Banner */}
        <View style={[
          styles.winnerBanner,
          winner === 'you' && styles.winnerBannerWin,
          winner === 'partner' && styles.winnerBannerLose,
          winner === 'tie' && styles.winnerBannerTie,
        ]}>
          <MaterialIcons 
            name={winner === 'you' ? 'emoji-events' : winner === 'tie' ? 'handshake' : 'thumb-up'} 
            size={48} 
            color="#fff" 
          />
          <Text style={styles.winnerText}>
            {winner === 'you' ? 'You Won!' : winner === 'tie' ? "It's a Tie!" : 'Partner Won!'}
          </Text>
          {winner !== 'tie' && (
            <Text style={styles.winnerSubtext}>
              {winner === 'you' ? 'Great job!' : 'Better luck next time!'}
            </Text>
          )}
        </View>

        {/* Score Comparison */}
        <View style={styles.scoresContainer}>
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <MaterialIcons name="person" size={24} color="#4CAF50" />
              <Text style={styles.scoreLabel}>You</Text>
            </View>
            <Text style={styles.scoreValue}>{myScore?.toFixed(0)}%</Text>
            <Text style={styles.scoreSubtext}>
              {Math.round((myScore || 0) * session.questions.length / 100)} / {session.questions.length} correct
            </Text>
            {myTimeTaken && (
              <Text style={styles.timeText}>⏱️ {formatTime(myTimeTaken)}</Text>
            )}
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <MaterialIcons name="people" size={24} color="#2196F3" />
              <Text style={[styles.scoreLabel, styles.partnerLabel]}>Partner</Text>
            </View>
            <Text style={[styles.scoreValue, styles.partnerScore]}>{partnerScore?.toFixed(0)}%</Text>
            <Text style={styles.scoreSubtext}>
              {Math.round((partnerScore || 0) * session.questions.length / 100)} / {session.questions.length} correct
            </Text>
            {partnerTimeTaken && (
              <Text style={styles.timeText}>⏱️ {formatTime(partnerTimeTaken)}</Text>
            )}
          </View>
        </View>

        {/* Question-by-Question Comparison */}
        <View style={styles.comparisonContainer}>
          <Text style={styles.sectionTitle}>Answer Comparison</Text>
          
          {session.questions.map((question: any, index: number) => {
            const myAnswer = myAnswers?.[index];
            const partnerAnswer = partnerAnswers?.[index];
            const correctAnswer = question.correct_answer;
            const myCorrect = myAnswer === correctAnswer;
            const partnerCorrect = partnerAnswer === correctAnswer;
            const bothSame = myAnswer === partnerAnswer;

            return (
              <View key={index} style={styles.questionComparison}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Question {index + 1}</Text>
                  {bothSame && (
                    <View style={styles.sameAnswerBadge}>
                      <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                      <Text style={styles.sameAnswerText}>Same Answer</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.questionTextSmall}>{question.question_text}</Text>

                <View style={styles.answersRow}>
                  {/* Your Answer */}
                  <View style={[styles.answerBox, myCorrect && styles.answerBoxCorrect]}>
                    <View style={styles.answerHeader}>
                      <MaterialIcons name="person" size={16} color="#666" />
                      <Text style={styles.answerLabel}>You</Text>
                    </View>
                    <Text style={styles.answerText}>{myAnswer || 'No answer'}</Text>
                    {myCorrect && (
                      <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    )}
                    {!myCorrect && myAnswer && (
                      <MaterialIcons name="cancel" size={20} color="#f44336" />
                    )}
                  </View>

                  {/* Partner Answer */}
                  <View style={[styles.answerBox, partnerCorrect && styles.answerBoxCorrect]}>
                    <View style={styles.answerHeader}>
                      <MaterialIcons name="people" size={16} color="#666" />
                      <Text style={styles.answerLabel}>Partner</Text>
                    </View>
                    <Text style={styles.answerText}>{partnerAnswer || 'No answer'}</Text>
                    {partnerCorrect && (
                      <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    )}
                    {!partnerCorrect && partnerAnswer && (
                      <MaterialIcons name="cancel" size={20} color="#f44336" />
                    )}
                  </View>
                </View>

                <View style={styles.correctAnswerBox}>
                  <MaterialIcons name="lightbulb" size={16} color="#FF9800" />
                  <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
                  <Text style={styles.correctAnswerText}>{correctAnswer}</Text>
                </View>

                {question.explanation && (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationText}>{question.explanation}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  winnerBanner: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  winnerBannerWin: {
    backgroundColor: '#4CAF50',
  },
  winnerBannerLose: {
    backgroundColor: '#2196F3',
  },
  winnerBannerTie: {
    backgroundColor: '#FF9800',
  },
  winnerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  winnerSubtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  partnerLabel: {
    color: '#2196F3',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  partnerScore: {
    color: '#2196F3',
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  comparisonContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questionComparison: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  sameAnswerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sameAnswerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  questionTextSmall: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  answersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  answerBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerBoxCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  answerText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  correctAnswerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  correctAnswerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  explanationBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
