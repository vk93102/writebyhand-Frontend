import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { TextInputComponent } from './TextInput';
import { ImageUpload } from './ImageUpload';
import AnimatedLoader from './AnimatedLoader';
import LoadingWebm from './LoadingWebm';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

interface FlashcardItem {
  id: number;
  front: string;
  back: string;
  category: string;
}

interface FlashcardData {
  title: string;
  topic: string;
  cards: FlashcardItem[];
}

interface FlashcardProps {
  flashcardData: FlashcardData | null;
  loading: boolean;
  onTextSubmit?: (text: string) => void;
  onImageSubmit?: (imageUri: string) => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ flashcardData, loading, onTextSubmit, onImageSubmit }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [activeMethod, setActiveMethod] = useState<'text' | 'image'>('text');
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [unknownCards, setUnknownCards] = useState<number[]>([]);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingWebm visible={true} />
      </View>
    );
  }

  if (!flashcardData) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.inputCardFlash}>
            <View style={styles.cardTabsFlash}>
              <TouchableOpacity
                style={[styles.cardTabFlash, styles.cardTabLeftFlash, activeMethod === 'text' && styles.cardTabActiveFlash]}
                onPress={() => setActiveMethod('text')}
              >
                <MaterialIcons name="text-fields" size={20} color={activeMethod === 'text' ? colors.white : colors.textMuted} />
                <Text style={[styles.cardTabTextFlash, activeMethod === 'text' && styles.cardTabTextActiveFlash]}>Text Input</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cardTabFlash, styles.cardTabRightFlash, activeMethod === 'image' && styles.cardTabActiveFlash]}
                onPress={() => setActiveMethod('image')}
              >
                <MaterialIcons name="image" size={18} color={activeMethod === 'image' ? colors.white : colors.textMuted} />
                <Text style={[styles.cardTabTextFlash, activeMethod === 'image' && styles.cardTabTextActiveFlash]}>Image Upload</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardContentFlash}>
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
      </View>
    );
  }

  const card = flashcardData.cards[currentCard];

  const handleFlip = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCard < flashcardData.cards.length - 1) {
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{flashcardData.title}</Text>
        <View style={styles.categoryBadge}>
          <MaterialIcons name="label" size={14} color={colors.primary} />
          <Text style={styles.categoryText}>{card.category}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Card {currentCard + 1} of {flashcardData.cards.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentCard + 1) / flashcardData.cards.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <MaterialIcons name="check-circle" size={20} color={colors.success} />
          <Text style={styles.statText}>Known: {knownCards.length}</Text>
        </View>
        <View style={styles.statBox}>
          <MaterialIcons name="help" size={20} color={colors.warning} />
          <Text style={styles.statText}>Learning: {unknownCards.length}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.cardContainer} 
        onPress={handleFlip}
        activeOpacity={0.9}
      >
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
          <View style={styles.cardHeader}>
            <MaterialIcons name="contact-page" size={24} color={colors.primary} />
            <Text style={styles.cardLabel}>Question</Text>
          </View>
          <Text style={styles.cardText}>{card.front}</Text>
          <View style={styles.tapHint}>
            <MaterialIcons name="touch-app" size={20} color={colors.textMuted} />
            <Text style={styles.tapHintText}>Tap to reveal answer</Text>
          </View>
        </Animated.View>

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
          <View style={styles.cardHeader}>
            <MaterialIcons name="lightbulb" size={24} color={colors.success} />
            <Text style={styles.cardLabel}>Answer</Text>
          </View>
          <Text style={styles.cardText}>{card.back}</Text>
          <View style={styles.tapHint}>
            <MaterialIcons name="touch-app" size={20} color={colors.textMuted} />
            <Text style={styles.tapHintText}>Tap to see question</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {isFlipped && (
        <View style={styles.knowledgeButtons}>
          <TouchableOpacity 
            style={[styles.knowledgeButton, styles.unknownButton]} 
            onPress={handleUnknown}
          >
            <MaterialIcons name="close" size={24} color={colors.white} />
            <Text style={styles.knowledgeButtonText}>Still Learning</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.knowledgeButton, styles.knownButton]} 
            onPress={handleKnown}
          >
            <MaterialIcons name="check" size={24} color={colors.white} />
            <Text style={styles.knowledgeButtonText}>I Know This</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.navigationContainer}>
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

        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.nextButton,
            currentCard === flashcardData.cards.length - 1 && styles.navButtonDisabled
          ]}
          onPress={handleNext}
          disabled={currentCard === flashcardData.cards.length - 1}
        >
          <Text style={[
            styles.navButtonText, 
            styles.nextButtonText,
            currentCard === flashcardData.cards.length - 1 && styles.navButtonTextDisabled
          ]}>
            Next
          </Text>
          <MaterialIcons 
            name="arrow-forward" 
            size={20} 
            color={currentCard === flashcardData.cards.length - 1 ? colors.textMuted : colors.white} 
          />
        </TouchableOpacity>
      </View>

      {currentCard === flashcardData.cards.length - 1 && (
        <View style={styles.summaryContainer}>
          <MaterialIcons name="summarize" size={32} color={colors.primary} />
          <Text style={styles.summaryTitle}>Study Summary</Text>
          <Text style={styles.summaryText}>
            You've reviewed all {flashcardData.cards.length} cards!
          </Text>
          <View style={styles.summaryStats}>
            <Text style={styles.summaryStatText}>
              Known: {knownCards.length} ({Math.round((knownCards.length / flashcardData.cards.length) * 100)}%)
            </Text>
            <Text style={styles.summaryStatText}>
              Learning: {unknownCards.length} ({Math.round((unknownCards.length / flashcardData.cards.length) * 100)}%)
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'transparent',
    minHeight: 400,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
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
  progressContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  statText: {
    ...typography.body,
    fontWeight: '600',
  },
  cardContainer: {
    height: isWeb && !isMobile ? 450 : isMobile ? 350 : 400,
    margin: spacing.lg,
    marginHorizontal: isWeb && !isMobile ? spacing.xl * 3 : spacing.lg,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    justifyContent: 'space-between',
    ...shadows.lg,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardLabel: {
    ...typography.h4,
    color: colors.primary,
  },
  cardText: {
    fontSize: isWeb && !isMobile ? 24 : isMobile ? 18 : 22,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: isWeb && !isMobile ? 36 : isMobile ? 26 : 32,
    color: colors.text,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tapHintText: {
    ...typography.small,
    color: colors.textMuted,
  },
  knowledgeButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: isWeb && !isMobile ? spacing.xl * 3 : spacing.lg,
    marginBottom: spacing.md,
  },
  knowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  unknownButton: {
    backgroundColor: colors.warning,
  },
  knownButton: {
    backgroundColor: colors.success,
  },
  knowledgeButtonText: {
    ...typography.h4,
    color: colors.white,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: isWeb && !isMobile ? spacing.xl * 3 : spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  navButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  navButtonText: {
    ...typography.h4,
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    color: colors.white,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  summaryTitle: {
    ...typography.h2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summaryStats: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  summaryStatText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Empty state with tabs
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#DCFCE7',
    borderRadius: borderRadius.full,
  },
  onlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  scrollContent: {
    paddingVertical: spacing.xl,
  },
  questionSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  questionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  questionSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.white,
  },
  inputSection: {
    flex: 1,
  },
  // Horizontal layout for desktop
  horizontalWrapper: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  leftColumnFlash: {
    flex: 1.2,
  },
  rightColumnFlash: {
    flex: 1,
  },
  // Card styles for Flashcard input area
  inputCardFlash: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardTabsFlash: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardTabFlash: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg * 1.1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
  },
  cardTabLeftFlash: {
    flex: 1,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: 0,
  },
  cardTabRightFlash: {
    flex: 1,
    borderTopRightRadius: borderRadius.xl,
    borderBottomRightRadius: 0,
  },
  cardTabActiveFlash: {
    backgroundColor: colors.primary,
    ...shadows.lg,
    transform: [{ translateY: -2 }],
  },
  cardTabTextFlash: {
    ...typography.h4,
    color: colors.textMuted,
    fontWeight: '700',
  },
  cardTabTextActiveFlash: {
    color: colors.white,
  },
  cardContentFlash: {
    padding: spacing.lg,
  },
});
