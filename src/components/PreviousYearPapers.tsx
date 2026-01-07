import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

interface Paper {
  id: string;
  subject: string;
  year: number;
  examType: string;
  class: string;
  code: string;
  pdfUrl?: string;
  solutionUrl?: string;
  zipUrl?: string;
}

const SAMPLE_PAPERS: Paper[] = [
  // Class 10 - Science
  {
    id: 'c10-sci-2025',
    subject: 'Science',
    year: 2025,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2025-COMPTT/X/Science.zip',
  },
  {
    id: 'c10-sci-2024',
    subject: 'Science',
    year: 2024,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2024-COMPTT/X/Science.zip',
  },
  {
    id: 'c10-sci-2023',
    subject: 'Science',
    year: 2023,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2023-COMPTT/X/Science.zip',
  },
  {
    id: 'c10-sci-2022',
    subject: 'Science',
    year: 2022,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2022-COMPTT/X/Science.zip',
  },
  {
    id: 'c10-sci-2021',
    subject: 'Science',
    year: 2021,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2021-COMPTT/X/Science.zip',
  },

  // Class 10 - Social Science
  {
    id: 'c10-sst-2025',
    subject: 'Social Science',
    year: 2025,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Social Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2025-COMPTT/X/Social_Science.zip',
  },
  {
    id: 'c10-sst-2024',
    subject: 'Social Science',
    year: 2024,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Social Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2024-COMPTT/X/Social_Science.zip',
  },
  {
    id: 'c10-sst-2023',
    subject: 'Social Science',
    year: 2023,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Social Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2023-COMPTT/X/Social_Science.zip',
  },
  {
    id: 'c10-sst-2022',
    subject: 'Social Science',
    year: 2022,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Social Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2022-COMPTT/X/Social_Science.zip',
  },
  {
    id: 'c10-sst-2021',
    subject: 'Social Science',
    year: 2021,
    examType: 'Compartment',
    class: 'Class 10',
    code: 'Social Science • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2021-COMPTT/X/Social_Science.zip',
  },

  // Class 12 - Physics
  {
    id: 'c12-phy-2025',
    subject: 'Physics',
    year: 2025,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Physics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2025-COMPTT/XII/Physics.zip',
  },
  {
    id: 'c12-phy-2024',
    subject: 'Physics',
    year: 2024,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Physics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2024-COMPTT/XII/Physics.zip',
  },
  {
    id: 'c12-phy-2023',
    subject: 'Physics',
    year: 2023,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Physics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2023-COMPTT/XII/Physics.zip',
  },
  {
    id: 'c12-phy-2022',
    subject: 'Physics',
    year: 2022,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Physics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2022-COMPTT/XII/Physics.zip',
  },
  {
    id: 'c12-phy-2021',
    subject: 'Physics',
    year: 2021,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Physics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2021-COMPTT/XII/Physics.zip',
  },

  // Class 12 - Chemistry
  {
    id: 'c12-chem-2025',
    subject: 'Chemistry',
    year: 2025,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Chemistry • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2025-COMPTT/XII/Chemistry.zip',
  },
  {
    id: 'c12-chem-2024',
    subject: 'Chemistry',
    year: 2024,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Chemistry • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2024-COMPTT/XII/Chemistry.zip',
  },
  {
    id: 'c12-chem-2023',
    subject: 'Chemistry',
    year: 2023,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Chemistry • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2023-COMPTT/XII/Chemistry.zip',
  },
  {
    id: 'c12-chem-2022',
    subject: 'Chemistry',
    year: 2022,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Chemistry • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2022-COMPTT/XII/Chemistry.zip',
  },
  {
    id: 'c12-chem-2021',
    subject: 'Chemistry',
    year: 2021,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Chemistry • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2021-COMPTT/XII/Chemistry.zip',
  },

  // Class 12 - Mathematics
  {
    id: 'c12-math-2025',
    subject: 'Mathematics',
    year: 2025,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Mathematics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2025-COMPTT/XII/Mathematics.zip',
  },
  {
    id: 'c12-math-2024',
    subject: 'Mathematics',
    year: 2024,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Mathematics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2024-COMPTT/XII/Mathematics.zip',
  },
  {
    id: 'c12-math-2023',
    subject: 'Mathematics',
    year: 2023,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Mathematics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2023-COMPTT/XII/Mathematics.zip',
  },
  {
    id: 'c12-math-2022',
    subject: 'Mathematics',
    year: 2022,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Mathematics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2022-COMPTT/XII/Mathematics.zip',
  },
  {
    id: 'c12-math-2021',
    subject: 'Mathematics',
    year: 2021,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Mathematics • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2021-COMPTT/XII/Mathematics.zip',
  },

  // Class 12 - Biology
  {
    id: 'c12-bio-2025',
    subject: 'Biology',
    year: 2025,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Biology • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2025-COMPTT/XII/Biology.zip',
  },
  {
    id: 'c12-bio-2024',
    subject: 'Biology',
    year: 2024,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Biology • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2024-COMPTT/XII/Biology.zip',
  },
  {
    id: 'c12-bio-2023',
    subject: 'Biology',
    year: 2023,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Biology • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2023-COMPTT/XII/Biology.zip',
  },
  {
    id: 'c12-bio-2022',
    subject: 'Biology',
    year: 2022,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Biology • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2022-COMPTT/XII/Biology.zip',
  },
  {
    id: 'c12-bio-2021',
    subject: 'Biology',
    year: 2021,
    examType: 'Compartment',
    class: 'Class 12',
    code: 'Biology • COMPTT',
    zipUrl: 'https://www.cbse.gov.in/cbsenew/question-paper/2021-COMPTT/XII/Biology.zip',
  },
];

export const PreviousYearPapers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const filteredPapers = SAMPLE_PAPERS.filter(paper =>
    paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.examType.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => sortBy === 'newest' ? b.year - a.year : a.year - b.year);

  const handleDownload = async (url: string | undefined, type: string) => {
    if (!url) {
      Alert.alert('Coming Soon', `${type} download will be available soon!`);
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${type} URL`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to download ${type}`);
    }
  };

  const renderPaperCard = (paper: Paper) => (
    <View key={paper.id} style={styles.paperCard}>
      {/* PDF Icon and Year Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.pdfIcon}>
          <MaterialIcons name="picture-as-pdf" size={24} color={colors.error} />
        </View>
        <View style={styles.yearBadge}>
          <Text style={styles.yearText}>{paper.year}</Text>
        </View>
      </View>

      {/* Subject Title */}
      <Text style={styles.subjectTitle}>{paper.subject}</Text>

      {/* Exam Info */}
      <Text style={styles.examInfo}>
        {paper.class} • {paper.examType}
      </Text>

      {/* Code */}
      <Text style={styles.codeText}>Code: {paper.code}</Text>

      {/* Download ZIP Button */}
      {paper.zipUrl && (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownload(paper.zipUrl, 'ZIP file')}
        >
          <MaterialIcons name="download" size={20} color={colors.white} />
          <Text style={styles.downloadButtonText}>Download ZIP</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by paper code, topic, or subject..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Info and Sort */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          Showing <Text style={styles.resultsBold}>1-{Math.min(12, filteredPapers.length)}</Text> of{' '}
          <Text style={styles.resultsBold}>{filteredPapers.length} papers</Text>
        </Text>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={styles.sortDropdown}
            onPress={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
          >
            <Text style={styles.sortText}>
              {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Papers Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.papersGrid}>
          {filteredPapers.map(paper => renderPaperCard(paper))}
        </View>

        {filteredPapers.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No papers found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  resultsBar: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultsBold: {
    fontWeight: '700',
    color: colors.text,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  papersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  paperCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: isMobile ? '100%' : '30%',
    minWidth: isMobile ? '100%' : 280,
    ...shadows.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  yearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  examInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.xs,
  },
  codeText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: spacing.lg,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  downloadButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
