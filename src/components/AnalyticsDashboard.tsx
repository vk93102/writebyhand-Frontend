import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  onClose: () => void;
}

// Mock data - replace with real data from your API
const mockAnalyticsData = {
  overallStats: {
    totalQuizzes: 47,
    averageScore: 78,
    totalQuestions: 1240,
    correctAnswers: 967,
    streak: 12,
    studyTime: 156, // hours
  },
  performanceBySubject: [
    { subject: 'Mathematics', score: 85, quizzes: 15, color: '#3B82F6' },
    { subject: 'Physics', score: 76, quizzes: 12, color: '#8B5CF6' },
    { subject: 'Chemistry', score: 72, quizzes: 10, color: '#EC4899' },
    { subject: 'Biology', score: 81, quizzes: 10, color: '#10B981' },
  ],
  weeklyProgress: [
    { day: 'Mon', score: 72, questions: 25 },
    { day: 'Tue', score: 78, questions: 30 },
    { day: 'Wed', score: 75, questions: 28 },
    { day: 'Thu', score: 82, questions: 35 },
    { day: 'Fri', score: 85, questions: 32 },
    { day: 'Sat', score: 88, questions: 40 },
    { day: 'Sun', score: 90, questions: 38 },
  ],
  difficultyBreakdown: [
    { level: 'Easy', percentage: 65, color: '#10B981' },
    { level: 'Medium', percentage: 25, color: '#F59E0B' },
    { level: 'Hard', percentage: 10, color: '#EF4444' },
  ],
  recentActivity: [
    { title: 'JEE Physics Quiz', score: 85, date: '2 hours ago', coins: 42 },
    { title: 'NEET Biology Test', score: 92, date: '1 day ago', coins: 55 },
    { title: 'Class 12 Chemistry', score: 78, date: '2 days ago', coins: 38 },
    { title: 'Math Practice Set', score: 88, date: '3 days ago', coins: 48 },
  ],
  monthlyTrend: [
    { month: 'Jul', score: 68 },
    { month: 'Aug', score: 72 },
    { month: 'Sep', score: 75 },
    { month: 'Oct', score: 78 },
    { month: 'Nov', score: 82 },
    { month: 'Dec', score: 85 },
  ],
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const isTablet = screenDimensions.width >= 768;
  const isDesktop = screenDimensions.width >= 1024;

  const maxWeeklyScore = Math.max(...mockAnalyticsData.weeklyProgress.map(d => d.score));

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Performance Analytics</Text>
            <Text style={styles.headerSubtitle}>Track your learning journey</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedTimeRange === 'week' && styles.filterButtonActive]}
            onPress={() => setSelectedTimeRange('week')}
          >
            <Text style={[styles.filterButtonText, selectedTimeRange === 'week' && styles.filterButtonTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedTimeRange === 'month' && styles.filterButtonActive]}
            onPress={() => setSelectedTimeRange('month')}
          >
            <Text style={[styles.filterButtonText, selectedTimeRange === 'month' && styles.filterButtonTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedTimeRange === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedTimeRange('all')}
          >
            <Text style={[styles.filterButtonText, selectedTimeRange === 'all' && styles.filterButtonTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards Grid */}
        <View style={[styles.statsGrid, !isTablet && styles.statsGridMobile]}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.statGradient}
            >
              <MaterialIcons name="emoji-events" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{mockAnalyticsData.overallStats.totalQuizzes}</Text>
              <Text style={styles.statLabel}>Quizzes Completed</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statGradient}
            >
              <MaterialIcons name="trending-up" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{mockAnalyticsData.overallStats.averageScore}%</Text>
              <Text style={styles.statLabel}>Average Score</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statGradient}
            >
              <MaterialIcons name="local-fire-department" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{mockAnalyticsData.overallStats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.statGradient}
            >
              <MaterialIcons name="access-time" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{mockAnalyticsData.overallStats.studyTime}h</Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Main Content Grid */}
        <View style={[styles.mainGrid, !isDesktop && styles.mainGridMobile]}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Weekly Performance Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartTitle}>Weekly Performance</Text>
                  <Text style={styles.chartSubtitle}>Last 7 days trend</Text>
                </View>
                <View style={styles.trendBadge}>
                  <MaterialIcons name="trending-up" size={16} color="#10B981" />
                  <Text style={styles.trendText}>+12%</Text>
                </View>
              </View>

              <View style={styles.chartContainer}>
                {mockAnalyticsData.weeklyProgress.map((day, index) => {
                  const barHeight = (day.score / maxWeeklyScore) * 180;
                  return (
                    <View key={index} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        <LinearGradient
                          colors={['#3B82F6', '#8B5CF6']}
                          style={[styles.bar, { height: barHeight }]}
                        >
                          <View style={styles.barGlow} />
                        </LinearGradient>
                      </View>
                      <Text style={styles.barLabel}>{day.day}</Text>
                      <Text style={styles.barValue}>{day.score}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Subject Performance */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Subject-wise Performance</Text>
                <Text style={styles.chartSubtitle}>Your strengths & areas to improve</Text>
              </View>

              <View style={styles.subjectList}>
                {mockAnalyticsData.performanceBySubject.map((subject, index) => (
                  <View key={index} style={styles.subjectItem}>
                    <View style={styles.subjectInfo}>
                      <View style={[styles.subjectIcon, { backgroundColor: subject.color + '20' }]}>
                        <MaterialIcons
                          name={
                            subject.subject === 'Mathematics' ? 'calculate' :
                            subject.subject === 'Physics' ? 'science' :
                            subject.subject === 'Chemistry' ? 'biotech' :
                            'eco'
                          }
                          size={24}
                          color={subject.color}
                        />
                      </View>
                      <View style={styles.subjectDetails}>
                        <Text style={styles.subjectName}>{subject.subject}</Text>
                        <Text style={styles.subjectQuizzes}>{subject.quizzes} quizzes</Text>
                      </View>
                    </View>

                    <View style={styles.subjectScore}>
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                          <LinearGradient
                            colors={[subject.color, subject.color + 'CC']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${subject.score}%` }]}
                          />
                        </View>
                      </View>
                      <Text style={[styles.scoreText, { color: subject.color }]}>{subject.score}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Monthly Trend */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Monthly Trend</Text>
                <Text style={styles.chartSubtitle}>6-month overview</Text>
              </View>

              <View style={styles.lineChartContainer}>
                <View style={styles.lineChart}>
                  {/* Y-axis labels */}
                  <View style={styles.yAxis}>
                    <Text style={styles.yAxisLabel}>100</Text>
                    <Text style={styles.yAxisLabel}>75</Text>
                    <Text style={styles.yAxisLabel}>50</Text>
                    <Text style={styles.yAxisLabel}>25</Text>
                    <Text style={styles.yAxisLabel}>0</Text>
                  </View>

                  {/* Chart area */}
                  <View style={styles.chartArea}>
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <View key={i} style={styles.gridLine} />
                    ))}

                    {/* Line path */}
                    <View style={styles.linePath}>
                      {mockAnalyticsData.monthlyTrend.map((month, index) => {
                        const left = (index / (mockAnalyticsData.monthlyTrend.length - 1)) * 100;
                        const bottom = (month.score / 100) * 100;
                        return (
                          <View
                            key={index}
                            style={[
                              styles.dataPoint,
                              { left: `${left}%`, bottom: `${bottom}%` }
                            ]}
                          >
                            <LinearGradient
                              colors={['#3B82F6', '#8B5CF6']}
                              style={styles.dataPointInner}
                            />
                            <View style={styles.dataPointGlow} />
                          </View>
                        );
                      })}
                    </View>

                    {/* X-axis labels */}
                    <View style={styles.xAxis}>
                      {mockAnalyticsData.monthlyTrend.map((month, index) => (
                        <Text key={index} style={styles.xAxisLabel}>{month.month}</Text>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Difficulty Breakdown */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Difficulty Distribution</Text>
                <Text style={styles.chartSubtitle}>Question complexity</Text>
              </View>

              <View style={styles.donutChartContainer}>
                {mockAnalyticsData.difficultyBreakdown.map((item, index) => {
                  const size = 140;
                  const strokeWidth = 20;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = 2 * Math.PI * radius;

                  return (
                    <View key={index} style={styles.difficultyItem}>
                      <View style={[styles.difficultyBar, { backgroundColor: item.color + '20' }]}>
                        <View style={[styles.difficultyFill, { 
                          width: `${item.percentage}%`,
                          backgroundColor: item.color 
                        }]} />
                      </View>
                      <View style={styles.difficultyInfo}>
                        <View style={[styles.difficultyDot, { backgroundColor: item.color }]} />
                        <Text style={styles.difficultyLabel}>{item.level}</Text>
                        <Text style={[styles.difficultyPercentage, { color: item.color }]}>
                          {item.percentage}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.accuracyCard}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.accuracyGradient}
                >
                  <MaterialIcons name="check-circle" size={32} color="#FFFFFF" />
                  <Text style={styles.accuracyValue}>
                    {Math.round((mockAnalyticsData.overallStats.correctAnswers / 
                      mockAnalyticsData.overallStats.totalQuestions) * 100)}%
                  </Text>
                  <Text style={styles.accuracyLabel}>Overall Accuracy</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Recent Activity</Text>
                <Text style={styles.chartSubtitle}>Latest quiz attempts</Text>
              </View>

              <View style={styles.activityList}>
                {mockAnalyticsData.recentActivity.map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <LinearGradient
                        colors={['#3B82F6', '#8B5CF6']}
                        style={styles.activityIconGradient}
                      >
                        <MaterialIcons name="assignment" size={20} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDate}>{activity.date}</Text>
                    </View>
                    <View style={styles.activityStats}>
                      <View style={styles.activityScore}>
                        <MaterialIcons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.activityScoreText}>{activity.score}%</Text>
                      </View>
                      <View style={styles.activityCoins}>
                        <MaterialIcons name="monetization-on" size={16} color="#10B981" />
                        <Text style={styles.activityCoinsText}>+{activity.coins}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Insights & Recommendations</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightCard}>
              <MaterialIcons name="trending-up" size={24} color="#10B981" />
              <Text style={styles.insightText}>
                Your performance improved by <Text style={styles.insightHighlight}>15%</Text> this week!
              </Text>
            </View>
            <View style={styles.insightCard}>
              <MaterialIcons name="lightbulb" size={24} color="#F59E0B" />
              <Text style={styles.insightText}>
                Focus on <Text style={styles.insightHighlight}>Chemistry</Text> to boost overall score
              </Text>
            </View>
            <View style={styles.insightCard}>
              <MaterialIcons name="local-fire-department" size={24} color="#EF4444" />
              <Text style={styles.insightText}>
                Keep your <Text style={styles.insightHighlight}>12-day streak</Text> going!
              </Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statsGridMobile: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  mainGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  mainGridMobile: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 2,
    gap: spacing.lg,
  },
  rightColumn: {
    flex: 1,
    gap: spacing.lg,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: borderRadius.full,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
    paddingVertical: spacing.md,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '70%',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 20,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  barValue: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subjectList: {
    gap: spacing.lg,
  },
  subjectItem: {
    gap: spacing.md,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  subjectQuizzes: {
    fontSize: 13,
    color: colors.textMuted,
  },
  subjectScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  lineChartContainer: {
    marginTop: spacing.md,
  },
  lineChart: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  yAxisLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  linePath: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    marginBottom: -6,
  },
  dataPointInner: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  dataPointGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: -4,
    left: -4,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    opacity: 0.2,
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xAxisLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  donutChartContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  difficultyItem: {
    gap: spacing.sm,
  },
  difficultyBar: {
    height: 32,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  difficultyFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  difficultyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  difficultyPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  accuracyCard: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  accuracyGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  accuracyValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  activityList: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.lg,
  },
  activityIcon: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  activityIconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activityStats: {
    gap: spacing.xs,
  },
  activityScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityScoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  activityCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityCoinsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  insightsContainer: {
    marginTop: spacing.lg,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  insightsList: {
    gap: spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
});
