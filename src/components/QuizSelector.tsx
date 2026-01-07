import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface QuizSelectorProps {
  onStartQuiz: (config: QuizConfig) => void;
  onClose: () => void;
  userCoins?: number;
  isPremium?: boolean;
  dailyQuizCount?: number;
  quizType?: 'regular' | 'mock-test';
}

interface QuizConfig {
  subject: string;
  topics: string[];
  difficulty: string;
  examLevel: string;
  timeLimit: number;
  numQuestions: number;
}

interface Subject {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface ExamLevel {
  id: string;
  name: string;
  description: string;
}

export const QuizSelector: React.FC<QuizSelectorProps> = ({ 
  onStartQuiz, 
  onClose, 
  userCoins = 1250,
  isPremium = false,
  dailyQuizCount = 0,
  quizType = 'regular'
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('maths');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [selectedExamLevel, setSelectedExamLevel] = useState<string>('jee-mains');
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState<boolean>(false);
  const [numQuestions, setNumQuestions] = useState<number>(20);
  const [screenWidth, setScreenWidth] = useState(width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const subjects: Subject[] = [
    {
      id: 'maths',
      name: 'Maths',
      icon: require('../../assets/maths.png'),
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      id: 'physics',
      name: 'Physics',
      icon: require('../../assets/physics.png'),
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: require('../../assets/chemistry.png'),
      color: '#06B6D4',
      bgColor: '#ECFEFF',
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: require('../../assets/biology.png'),
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
  ];

  const examLevels: ExamLevel[] = [
    { id: 'jee-mains', name: 'JEE', description: 'Previous Year Questions' },
    { id: 'neet', name: 'NEET', description: 'Previous Year Questions' },
    { id: 'class-10', name: 'Class 10', description: 'CBSE Board' },
    { id: 'class-12', name: 'Class 12', description: 'CBSE Board' },
    { id: 'gate', name: 'GATE', description: 'Previous Year Questions' },
  ];

  const topicsByExamAndSubject: { [key: string]: { [key: string]: string[] } } = {
    'jee-mains': {
      maths: ['Algebra', 'Calculus', 'Coordinate Geometry', 'Trigonometry', 'Vectors', 'Probability', 'Complex Numbers', '3D Geometry', 'Matrices', 'Differential Equations'],
      physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics', 'Waves', 'Current Electricity', 'Rotational Motion', 'SHM', 'Ray Optics'],
      chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'Thermodynamics', 'Electrochemistry', 'Solutions', 'Chemical Kinetics', 'Equilibrium', 'Atomic Structure'],
      biology: ['Genetics', 'Ecology', 'Cell Biology', 'Evolution', 'Biotechnology', 'Human Physiology', 'Plant Physiology', 'Molecular Biology', 'Diversity', 'Reproduction'],
    },
    'jee-advanced': {
      maths: ['Complex Numbers', 'Calculus', 'Vectors & 3D Geometry', 'Matrices & Determinants', 'Differential Equations', 'Probability', 'Quadratic Equations', 'Sequences & Series', 'Conic Sections', 'Functions'],
      physics: ['Modern Physics', 'Electrodynamics', 'Mechanics', 'Thermodynamics', 'Optics', 'Waves', 'Magnetism', 'Quantum Physics', 'Nuclear Physics', 'Semiconductors'],
      chemistry: ['Organic Chemistry', 'Physical Chemistry', 'Inorganic Chemistry', 'Coordination Compounds', 'Chemical Bonding', 'Thermodynamics', 'Electrochemistry', 'Solutions', 'Transition Elements', 'GOC'],
      biology: ['Genetics', 'Molecular Biology', 'Biotechnology', 'Evolution', 'Ecology', 'Cell Biology', 'Human Physiology', 'Plant Physiology', 'Immunology', 'Biomolecules'],
    },
    'neet': {
      maths: [], // NEET doesn't have math
      physics: ['Mechanics', 'Thermodynamics', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Optics', 'Modern Physics', 'Waves', 'SHM', 'Ray Optics'],
      chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Chemistry', 'Environmental Chemistry', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life', 'Surface Chemistry', 'Solid State'],
      biology: ['Human Physiology', 'Plant Physiology', 'Genetics', 'Molecular Biology', 'Ecology', 'Biotechnology', 'Evolution', 'Cell Biology', 'Reproduction', 'Health & Diseases'],
    },
    'class-10': {
      maths: ['Real Numbers', 'Polynomials', 'Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Trigonometry', 'Circles', 'Statistics & Probability'],
      physics: ['Light', 'Electricity', 'Magnetic Effects', 'Energy Sources', 'Human Eye', 'Reflection & Refraction', 'Electric Current', 'Circuits', 'Magnets', 'Energy'],
      chemistry: ['Chemical Reactions', 'Acids & Bases', 'Metals & Non-metals', 'Carbon Compounds', 'Periodic Classification', 'Chemical Equations', 'Redox Reactions', 'Ionic Compounds', 'Salts', 'pH Scale'],
      biology: ['Life Processes', 'Control & Coordination', 'Reproduction', 'Heredity & Evolution', 'Respiration', 'Transportation', 'Excretion', 'Nervous System', 'Hormones', 'Genetics'],
    },
    'class-12': {
      maths: ['Relations & Functions', 'Inverse Trigonometry', 'Matrices', 'Determinants', 'Continuity & Differentiability', 'Integrals', 'Applications of Integrals', 'Differential Equations', 'Vectors', '3D Geometry'],
      physics: ['Electrostatics', 'Current Electricity', 'Magnetism', 'Electromagnetic Induction', 'Alternating Current', 'Optics', 'Dual Nature', 'Atoms & Nuclei', 'Semiconductors', 'Communication Systems'],
      chemistry: ['Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'd & f Block', 'Coordination Compounds', 'Haloalkanes', 'Alcohols & Phenols', 'Aldehydes & Ketones'],
      biology: ['Reproduction', 'Genetics', 'Evolution', 'Human Health', 'Food Production', 'Microbes', 'Biotechnology', 'Organisms & Populations', 'Ecosystem', 'Biodiversity'],
    },
    'gate': {
      maths: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability', 'Statistics', 'Numerical Methods', 'Discrete Mathematics', 'Graph Theory', 'Combinatorics', 'Complex Analysis'],
      physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Mechanics', 'Optics', 'Statistical Mechanics', 'Solid State Physics', 'Nuclear Physics', 'Electronics', 'Waves'],
      chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Analytical Chemistry', 'Spectroscopy', 'Thermodynamics', 'Quantum Chemistry', 'Electrochemistry', 'Kinetics', 'Catalysis'],
      biology: ['Molecular Biology', 'Biochemistry', 'Cell Biology', 'Genetics', 'Microbiology', 'Immunology', 'Biotechnology', 'Plant Science', 'Animal Science', 'Ecology'],
    },
    'cat': {
      maths: ['Number Systems', 'Algebra', 'Geometry', 'Mensuration', 'Trigonometry', 'Arithmetic', 'Data Interpretation', 'Percentages', 'Profit & Loss', 'Time & Work'],
      physics: [], // CAT doesn't typically have physics
      chemistry: [], // CAT doesn't typically have chemistry
      biology: [], // CAT doesn't typically have biology
    },
    'other': {
      maths: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 'Probability', 'Number Theory', 'Matrices', 'Vectors', 'Differential Equations'],
      physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics', 'Waves', 'Kinematics', 'Dynamics', 'Energy', 'Oscillations'],
      chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Bonding', 'Thermodynamics', 'Electrochemistry', 'Solutions', 'Kinetics', 'Equilibrium', 'Acids & Bases'],
      biology: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Physiology', 'Plant Physiology', 'Molecular Biology', 'Biotechnology', 'Microbiology', 'Biochemistry'],
    },
  };

  const difficulties = [
    { id: 'easy', name: 'Easy', coinMultiplier: 1, perQuestion: 3 },
    { id: 'medium', name: 'Medium', coinMultiplier: 1.5, perQuestion: 5 },
    { id: 'hard', name: 'Hard', coinMultiplier: 2, perQuestion: 8 },
  ];

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const getTopicsForCurrentSelection = () => {
    const topics = topicsByExamAndSubject[selectedExamLevel]?.[selectedSubject] || [];
    return topics;
  };

  const calculateCoinsPerQuestion = () => {
    const difficulty = difficulties.find(d => d.id === selectedDifficulty);
    return difficulty?.perQuestion || 5;
  };

  const calculateTotalCoins = () => {
    return numQuestions * calculateCoinsPerQuestion();
  };

  const calculateTime = () => {
    return Math.round(numQuestions * 1.5);
  };

  const canStartQuiz = () => {
    // Free users can only take 1 quiz per day
    if (!isPremium && dailyQuizCount >= 1) {
      return false;
    }
    // For mock tests, no need to select topics
    if (quizType === 'mock-test') {
      return true;
    }
    return selectedTopics.length > 0;
  };

  const handleStartQuiz = () => {
    if (!canStartQuiz()) {
      if (!isPremium && dailyQuizCount >= 1) {
        Alert.alert(
          'Daily Limit Reached',
          'Free users can take 1 quiz per day. Upgrade to Premium for unlimited quizzes!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: () => {/* Navigate to pricing */} }
          ]
        );
      } else {
        Alert.alert('Missing Topics', 'Please select at least one topic to continue.');
      }
      return;
    }

    const config: QuizConfig = {
      subject: selectedSubject,
      topics: selectedTopics,
      difficulty: selectedDifficulty,
      examLevel: selectedExamLevel,
      timeLimit: timeLimitEnabled ? timeLimit : 0,
      numQuestions: numQuestions,
    };
    onStartQuiz(config);
  };

  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, !isDesktop && styles.headerMobile]}>
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>Home</Text>
            <Text style={styles.breadcrumbSeparator}>/</Text>
            <Text style={styles.breadcrumbText}>Practice</Text>
            <Text style={styles.breadcrumbSeparator}>/</Text>
            <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>Test Generator</Text>
          </View>
        </View>

        <View style={[styles.titleSection, !isDesktop && styles.titleSectionMobile]}>
          <Text style={[styles.pageTitle, !isDesktop && styles.pageTitleMobile]}>Generate Your Custom Mock Test</Text>
          <Text style={[styles.pageSubtitle, !isDesktop && styles.pageSubtitleMobile]}>
            Select your preferences below to create a targeted practice session tailored to your learning goals.
          </Text>
          
          {/* Free Account Warning */}
          {!isPremium && (
            <View style={styles.limitWarning}>
              <MaterialIcons name="info" size={18} color={colors.warning} />
              <Text style={styles.limitWarningText}>
                Free Account: {1 - dailyQuizCount} quiz remaining today. 
                <Text style={styles.limitWarningLink}> Upgrade for unlimited access</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Main Content - Full Width */}
        <View style={[styles.mainContent, isDesktop ? styles.mainContentDesktop : styles.mainContentMobile]}>
          <View style={[styles.leftColumn, !isDesktop && styles.leftColumnFull]}>
            {/* Section 1: Select Subject */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionTitle}>Select Subject</Text>
              </View>

              <View style={[styles.subjectsGrid, !isTablet && styles.subjectsGridMobile]}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectCard,
                      !isTablet && styles.subjectCardMobile,
                      selectedSubject === subject.id && styles.subjectCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedSubject(subject.id);
                      setSelectedTopics([]);
                    }}
                  >
                    {selectedSubject === subject.id && (
                      <View style={styles.selectedBadge}>
                        <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                      </View>
                    )}
                    <View style={[styles.subjectIconContainer, { backgroundColor: subject.bgColor }]}>
                      <Image source={subject.icon} style={styles.subjectImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section 2: Configure Test */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionTitle}>Configure Test</Text>
              </View>

              {/* Exam Level Selection */}
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Exam Level / Board</Text>
                <View style={[styles.examLevelsGrid, !isTablet && styles.examLevelsGridMobile]}>
                  {examLevels.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.examLevelCard,
                        selectedExamLevel === level.id && styles.examLevelCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedExamLevel(level.id);
                        setSelectedTopics([]); // Clear topics when switching exam level
                      }}
                    >
                      <Text style={[
                        styles.examLevelName,
                        selectedExamLevel === level.id && styles.examLevelNameSelected,
                      ]}>
                        {level.name}
                      </Text>
                      <Text style={[
                        styles.examLevelDesc,
                        selectedExamLevel === level.id && styles.examLevelDescSelected,
                      ]}>
                        {level.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Topics - Checkbox Grid */}
              {quizType !== 'mock-test' && (
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Select Topics (PYQ)</Text>
                  {getTopicsForCurrentSelection().length === 0 ? (
                    <View style={styles.noTopicsContainer}>
                      <MaterialIcons name="info-outline" size={24} color={colors.textMuted} />
                      <Text style={styles.noTopicsText}>
                        No topics available for {selectedSubject} in {examLevels.find(e => e.id === selectedExamLevel)?.name}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.topicsGrid, !isTablet && styles.topicsGridMobile]}>
                      {getTopicsForCurrentSelection().map((topic, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.topicCheckbox,
                            selectedTopics.includes(topic) && styles.topicCheckboxSelected,
                          ]}
                          onPress={() => toggleTopic(topic)}
                        >
                          <MaterialIcons 
                            name={selectedTopics.includes(topic) ? 'check-box' : 'check-box-outline-blank'} 
                            size={20} 
                            color={selectedTopics.includes(topic) ? colors.primary : colors.textMuted} 
                          />
                          <Text style={[
                            styles.topicCheckboxText,
                            selectedTopics.includes(topic) && styles.topicCheckboxTextSelected,
                          ]}>
                            {topic}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Difficulty Level & Number of Questions */}
              <View style={[styles.configRow, !isTablet && styles.configRowMobile]}>
                <View style={[styles.configItem, { flex: 1 }]}>
                  <Text style={styles.configLabel}>Difficulty Level</Text>
                  <View style={[styles.difficultyButtons, !isTablet && styles.difficultyButtonsMobile]}>
                    {difficulties.map((difficulty) => (
                      <TouchableOpacity
                        key={difficulty.id}
                        style={[
                          styles.difficultyButton,
                          !isTablet && styles.difficultyButtonSmall,
                          selectedDifficulty === difficulty.id && styles.difficultyButtonSelected,
                        ]}
                        onPress={() => setSelectedDifficulty(difficulty.id)}
                      >
                        <Text
                          style={[
                            styles.difficultyButtonText,
                            !isTablet && styles.difficultyButtonTextSmall,
                            selectedDifficulty === difficulty.id && styles.difficultyButtonTextSelected,
                          ]}
                        >
                          {difficulty.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.rewardInfo}>
                    <MaterialIcons name="stars" size={16} color={colors.warning} />
                    <Text style={styles.rewardInfoText}>
                      {calculateCoinsPerQuestion()} coins per correct answer
                    </Text>
                  </View>
                </View>

                <View style={[styles.configItem, { flex: 1 }]}>
                  <View style={styles.questionsHeader}>
                    <Text style={styles.configLabel}>Number of Questions</Text>
                    <TextInput
                      style={styles.questionsValueInput}
                      value={numQuestions.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 5;
                        setNumQuestions(Math.min(50, Math.max(5, num)));
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.sliderContainer}>
                    <TouchableOpacity onPress={() => setNumQuestions(Math.max(5, numQuestions - 1))}>
                      <MaterialIcons name="remove-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderFill, { width: `${((numQuestions - 5) / 45) * 100}%` }]} />
                      <View style={[styles.sliderThumb, { left: `${((numQuestions - 5) / 45) * 100}%` }]} />
                    </View>
                    <TouchableOpacity onPress={() => setNumQuestions(Math.min(50, numQuestions + 1))}>
                      <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>5</Text>
                    <Text style={styles.sliderLabel}>25</Text>
                    <Text style={styles.sliderLabel}>50</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Right Sidebar - Test Summary */}
          <View style={[styles.rightColumn, !isDesktop && styles.rightColumnMobile]}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="assignment" size={20} color={colors.primary} />
                <Text style={styles.summaryTitle}>Test Summary</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Subject</Text>
                <Text style={styles.summaryValue}>
                  {subjects.find(s => s.id === selectedSubject)?.name}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Exam Level</Text>
                <Text style={styles.summaryValue}>
                  {examLevels.find(l => l.id === selectedExamLevel)?.name}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Topics</Text>
                <Text style={styles.summaryValue}>
                  {selectedTopics.length > 0 
                    ? `${selectedTopics.length} selected`
                    : 'None selected'}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Difficulty</Text>
                <Text style={[styles.summaryValue, styles.summaryBadge]}>
                  {difficulties.find(d => d.id === selectedDifficulty)?.name}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Questions</Text>
                <Text style={styles.summaryValue}>{numQuestions}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Estimated Time</Text>
                <View style={styles.estimatedTime}>
                  <MaterialIcons name="access-time" size={16} color={colors.primary} />
                  <Text style={styles.estimatedTimeText}>{calculateTime()} mins</Text>
                </View>
              </View>

              <View style={styles.coinReward}>
                <Image source={require('../../assets/coins.png')} style={styles.coinIcon} resizeMode="contain" />
                <View style={styles.coinRewardText}>
                  <Text style={styles.coinRewardLabel}>Potential Reward</Text>
                  <Text style={styles.coinRewardValue}>
                    {calculateCoinsPerQuestion()} coins/question
                  </Text>
                  <Text style={styles.coinRewardTotal}>
                    Total: {calculateTotalCoins()} coins
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.startButton, !canStartQuiz() && styles.startButtonDisabled]} 
                onPress={handleStartQuiz}
                disabled={!canStartQuiz()}
              >
                <Text style={styles.startButtonText}>Start Test Now</Text>
              </TouchableOpacity>



              <View style={styles.proTip}>
                <View style={styles.proTipHeader}>
                  <MaterialIcons name="lightbulb" size={16} color={colors.primary} />
                  <Text style={styles.proTipTitle}>Pro Tip</Text>
                </View>
                <Text style={styles.proTipText}>
                  All questions are from Previous Year Papers (PYQ) of {examLevels.find(l => l.id === selectedExamLevel)?.name} exams.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerMobile: {
    paddingHorizontal: spacing.md,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breadcrumbText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: colors.textMuted,
  },
  breadcrumbActive: {
    color: colors.text,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  titleSectionMobile: {
    paddingHorizontal: spacing.md,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  pageTitleMobile: {
    fontSize: 24,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  pageSubtitleMobile: {
    fontSize: 13,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  limitWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  limitWarningLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  mainContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  mainContentDesktop: {
    flexDirection: 'row',
  },
  mainContentMobile: {
    flexDirection: 'column',
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  leftColumn: {
    flex: 2,
    width: '100%',
  },
  leftColumnFull: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    minWidth: 320,
  },
  rightColumnMobile: {
    width: '100%',
    minWidth: 'auto',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  subjectsGridMobile: {
    gap: spacing.sm,
  },
  subjectCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  subjectCardMobile: {
    width: '48%',
    padding: spacing.md,
  },
  subjectCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  subjectIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  subjectImage: {
    width: 48,
    height: 48,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  configItem: {
    marginBottom: spacing.md,
  },
  configRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  configRowMobile: {
    flexDirection: 'column',
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  examLevelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  examLevelsGridMobile: {
    gap: spacing.xs,
  },
  examLevelCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 100,
  },
  examLevelCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  examLevelName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  examLevelNameSelected: {
    color: colors.primary,
  },
  examLevelDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  examLevelDescSelected: {
    color: colors.primary + 'CC',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicsGridMobile: {
    gap: spacing.xs,
  },
  noTopicsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noTopicsText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  topicCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '48%',
  },
  topicCheckboxSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  topicCheckboxText: {
    fontSize: 13,
    color: colors.text,
  },
  topicCheckboxTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  difficultyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  difficultyButtonsMobile: {
    gap: spacing.xs,
  },
  difficultyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  difficultyButtonSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  difficultyButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  difficultyButtonTextSmall: {
    fontSize: 12,
  },
  difficultyButtonTextSelected: {
    color: colors.white,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.sm,
  },
  rewardInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  timeLimitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  toggle: {
    padding: 4,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  timeLimitInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 100,
  },
  timeLimitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  timeLimitValueDisabled: {
    color: colors.textMuted,
  },
  timeLimitUnit: {
    fontSize: 14,
    color: colors.textMuted,
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  questionsValueInput: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
    minWidth: 150,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryItem: {
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    alignSelf: 'flex-start',
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estimatedTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  coinReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  coinIcon: {
    width: 32,
    height: 32,
  },
  coinRewardText: {
    flex: 1,
  },
  coinRewardLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 2,
  },
  coinRewardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  coinRewardTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  startButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  proTip: {
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  proTipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  proTipText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
});
