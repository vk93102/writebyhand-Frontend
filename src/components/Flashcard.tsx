import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { TextInputComponent } from './TextInput';
import { ImageUpload } from './ImageUpload';
import AnimatedLoader from './AnimatedLoader';
import LoadingWebm from './LoadingWebm';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;
const isLargeScreen = width > 1024;

interface FlashcardItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  importance?: 'low' | 'medium' | 'high';
}

interface FlashcardData {
  title: string;
  topic: string;
  language?: string;
  total_cards?: number;
  cards: FlashcardItem[];
}

interface FlashcardProps {
  flashcardData: FlashcardData | null;
  loading: boolean;
  onTextSubmit?: (text: string) => void;
  onImageSubmit?: (imageUri: string) => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ flashcardData, loading, onTextSubmit, onImageSubmit }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [activeMethod, setActiveMethod] = useState<'text' | 'image'>('text');
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [unknownCards, setUnknownCards] = useState<number[]>([]);

  // Reset state when flashcardData changes
  React.useEffect(() => {
    // Handle both direct and wrapped response formats
    let dataToCheck = flashcardData;
    if (flashcardData && (flashcardData as any).data && !flashcardData.cards) {
      dataToCheck = (flashcardData as any).data;
    }
    
    if (dataToCheck && dataToCheck.cards && dataToCheck.cards.length > 0) {
      setCurrentCard(0);
      setIsFlipped(false);
      setKnownCards([]);
      setUnknownCards([]);
      flipAnimation.setValue(0);
    }
  }, [flashcardData, flipAnimation]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <LoadingWebm visible={true} />
      </View>
    );
  }

  if (!flashcardData) {
    return (
      <ScrollView style={styles.emptyContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyContent}>
          {/* Full-width input at the top */}
          <View style={styles.topInputContainer}>
            <View style={styles.inputTabsRow}>
              <TouchableOpacity
                style={[styles.inputTab, activeMethod === 'text' && styles.inputTabActive]}
                onPress={() => setActiveMethod('text')}
              >
                <MaterialIcons name="text-fields" size={20} color={activeMethod === 'text' ? colors.white : colors.textMuted} />
                <Text style={[styles.inputTabText, activeMethod === 'text' && styles.inputTabTextActive]}>Text Input</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inputTab, activeMethod === 'image' && styles.inputTabActive]}
                onPress={() => setActiveMethod('image')}
              >
                <MaterialIcons name="image" size={18} color={activeMethod === 'image' ? colors.white : colors.textMuted} />
                <Text style={[styles.inputTabText, activeMethod === 'image' && styles.inputTabTextActive]}>Image Upload</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputArea}>
              {activeMethod === 'text' ? (
                <TextInputComponent
                  onSubmit={(text) => onTextSubmit?.(text)}
                  placeholder="Enter topic for flashcards (e.g., 'Biology Cells', 'Math Formulas')..."
                />
              ) : (
                <ImageUpload
                  onSubmit={(imageUri) => onImageSubmit?.(imageUri)}
                  loading={loading}
                />
              )}
            </View>
          </View>

          <Text style={styles.emptySubtitle}>
            Generate interactive study cards from any topic or document
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Validate flashcard data structure - handle both direct and nested response formats
  let validData = flashcardData;
  
  // If the response is wrapped in a 'data' field, unwrap it
  if (flashcardData && (flashcardData as any).data && !flashcardData.cards) {
    validData = (flashcardData as any).data;
  }
  
  if (!validData || !validData.cards || !Array.isArray(validData.cards) || validData.cards.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>No Flashcards Available</Text>
        <Text style={styles.errorMessage}>
          Unable to load flashcards. The data may be corrupted or empty.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          // Reset to input state
          setCurrentCard(0);
          setIsFlipped(false);
          setKnownCards([]);
          setUnknownCards([]);
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = validData.cards[currentCard];

  const handleFlip = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCard < validData.cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const handleKnown = () => {
    if (!knownCards.includes(currentCard)) {
      setKnownCards([...knownCards, currentCard]);
      setUnknownCards(unknownCards.filter(id => id !== currentCard));
    }
    handleNext();
  };

  const handleUnknown = () => {
    if (!unknownCards.includes(currentCard)) {
      setUnknownCards([...unknownCards, currentCard]);
      setKnownCards(knownCards.filter(id => id !== currentCard));
    }
    handleNext();
  };

  const frontRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Text style={styles.title}>{flashcardData.title}</Text>
            <View style={styles.categoryBadge}>
              <MaterialIcons name="label" size={13} color={colors.primary} />
              <Text style={styles.categoryText}>{card.category}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(((currentCard + 1) / validData.cards.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentCard + 1) / validData.cards.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Card {currentCard + 1} of {validData.cards.length}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, styles.statBoxKnown]}>
          <MaterialIcons name="check-circle" size={18} color={colors.success} />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Known</Text>
            <Text style={styles.statValue}>{knownCards.length}</Text>
          </View>
        </View>
        <View style={[styles.statBox, styles.statBoxLearning]}>
          <MaterialIcons name="school" size={18} color={colors.warning} />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Learning</Text>
            <Text style={styles.statValue}>{unknownCards.length}</Text>
          </View>
        </View>
        <View style={[styles.statBox, styles.statBoxRemaining]}>
          <MaterialIcons name="pending-actions" size={18} color={colors.primary} />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>{validData.cards.length - knownCards.length - unknownCards.length}</Text>
          </View>
        </View>
      </View>

      {/* Card Viewer Section */}
      <View style={styles.cardViewerContainer}>
        <TouchableOpacity 
          style={styles.cardContainer} 
          onPress={handleFlip}
          activeOpacity={0.95}
        >
          {/* Front Side */}
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              {
                transform: [{ rotateY: frontRotation }],
                opacity: frontOpacity,
              },
            ]}
          >
            <View style={styles.cardIconSection}>
              <View style={styles.cardIconContainer}>
                <MaterialIcons name="contact-page" size={32} color={colors.primary} />
              </View>
              <Text style={styles.cardSideLabel}>Question</Text>
            </View>
            <Text style={styles.cardContent}>{card.question}</Text>
            <View style={styles.cardFooter}>
              <MaterialIcons name="touch-app" size={16} color={colors.textMuted} />
              <Text style={styles.tapHintText}>Tap to reveal answer</Text>
            </View>
          </Animated.View>

          {/* Back Side */}
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              {
                transform: [{ rotateY: backRotation }],
                opacity: backOpacity,
              },
            ]}
          >
            <View style={styles.cardIconSection}>
              <View style={[styles.cardIconContainer, styles.cardIconContainerAnswer]}>
                <MaterialIcons name="lightbulb" size={32} color={colors.success} />
              </View>
              <Text style={styles.cardSideLabel}>Answer</Text>
            </View>
            <Text style={styles.cardContent}>{card.answer}</Text>
            <View style={styles.cardFooter}>
              <MaterialIcons name="touch-app" size={16} color={colors.textMuted} />
              <Text style={styles.tapHintText}>Tap to see question</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Knowledge Assessment Buttons */}
        {isFlipped && (
          <View style={styles.knowledgeButtons}>
            <TouchableOpacity 
              style={[styles.knowledgeButton, styles.unknownButton]} 
              onPress={handleUnknown}
            >
              <MaterialIcons name="close" size={20} color={colors.white} />
              <Text style={styles.knowledgeButtonText}>Still Learning</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.knowledgeButton, styles.knownButton]} 
              onPress={handleKnown}
            >
              <MaterialIcons name="check" size={20} color={colors.white} />
              <Text style={styles.knowledgeButtonText}>I Know This</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Navigation Footer */}
      <View style={styles.navigationFooter}>
        <TouchableOpacity
          style={[styles.navButton, currentCard === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentCard === 0}
        >
          <MaterialIcons 
            name="arrow-back" 
            size={20} 
            color={currentCard === 0 ? colors.textMuted : colors.primary} 
          />
          <Text style={[styles.navButtonText, currentCard === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.cardCounter}>
          <Text style={styles.counterText}>{currentCard + 1}/{validData.cards.length}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.nextButton,
            currentCard === validData.cards.length - 1 && styles.navButtonDisabled
          ]}
          onPress={handleNext}
          disabled={currentCard === validData.cards.length - 1}
        >
          <Text style={[
            styles.navButtonText, 
            styles.nextButtonText,
            currentCard === validData.cards.length - 1 && styles.navButtonTextDisabled
          ]}>
            Next
          </Text>
          <MaterialIcons 
            name="arrow-forward" 
            size={20} 
            color={currentCard === validData.cards.length - 1 ? colors.textMuted : colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Summary on Last Card */}
      {currentCard === validData.cards.length - 1 && (
        <View style={styles.summaryBanner}>
          <View style={styles.summaryContent}>
            <MaterialIcons name="check-circle" size={24} color={colors.success} />
            <Text style={styles.summaryText}>
              Review complete! {knownCards.length} known, {unknownCards.length} learning
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  
  /* Empty State */
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Header */
  header: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...shadows.sm,
  },
  headerContent: {
    marginBottom: spacing.sm,
  },
  headerTitleSection: {
    gap: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.blue50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Progress Section */
  progressSection: {
    gap: spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  progressPercentage: {
    ...typography.h4,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '500',
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F9FAFB',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  statBoxKnown: {
    borderLeftColor: colors.success,
  },
  statBoxLearning: {
    borderLeftColor: colors.warning,
  },
  statBoxRemaining: {
    borderLeftColor: colors.primary,
  },
  statTextContainer: {
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statValue: {
    ...typography.h4,
    fontWeight: '700',
    color: colors.text,
  },

  /* Card Viewer */
  cardViewerContainer: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: isLargeScreen ? spacing.xl : spacing.lg,
    justifyContent: 'center',
  },
  cardContainer: {
    height: isLargeScreen ? 500 : isMobile ? 350 : 420,
    marginBottom: spacing.md,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    justifyContent: 'space-between',
    ...shadows.lg,
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  cardIconSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconContainerAnswer: {
    backgroundColor: '#F0FDF4',
  },
  cardSideLabel: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  cardContent: {
    ...typography.body,
    fontSize: isMobile ? 18 : 20,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text,
    lineHeight: isMobile ? 28 : 32,
    flex: 1,
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tapHintText: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '500',
  },

  /* Knowledge Buttons */
  knowledgeButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  knowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  unknownButton: {
    backgroundColor: colors.warning,
  },
  knownButton: {
    backgroundColor: colors.success,
  },
  knowledgeButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },

  /* Navigation Footer */
  navigationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...shadows.sm,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  navButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nextButtonText: {
    color: colors.white,
  },
  cardCounter: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.md,
  },
  counterText: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '700',
  },

  /* Summary Banner */
  summaryBanner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: colors.success,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },

  /* Top Input Container */
  topInputContainer: {
    width: '100%',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  inputTabsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  inputTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  inputTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  inputTabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '700',
  },
  inputTabTextActive: {
    color: colors.white,
  },
  inputArea: {
    width: '100%',
  },

  /* Error State */
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.error,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  retryButtonText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
});
