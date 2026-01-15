import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { usePremium } from '../context/PremiumContext';
import PremiumGate from '../components/PremiumGate';

/**
 * Example: HighValueChart Component
 * This would be your actual chart/feature component
 */
const HighValueChart: React.FC = () => {
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>📊 Advanced Analytics</Text>
      </View>

      <View style={styles.chartContent}>
        {/* Sample chart visualization */}
        <View style={styles.barChart}>
          <View style={[styles.bar, { height: '80%' }]}>
            <Text style={styles.barLabel}>70%</Text>
          </View>
          <View style={[styles.bar, { height: '60%' }]}>
            <Text style={styles.barLabel}>45%</Text>
          </View>
          <View style={[styles.bar, { height: '85%' }]}>
            <Text style={styles.barLabel}>75%</Text>
          </View>
          <View style={[styles.bar, { height: '50%' }]}>
            <Text style={styles.barLabel}>35%</Text>
          </View>
        </View>

        {/* Chart metadata */}
        <View style={styles.chartMetadata}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Average Score</Text>
            <Text style={styles.metaValue}>67.5%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Improvement</Text>
            <Text style={styles.metaValue}>+12%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Rank</Text>
            <Text style={styles.metaValue}>#1</Text>
          </View>
        </View>

        {/* Advanced insights (visible but locked) */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightTitle}>💡 Detailed Insights</Text>
          <Text style={styles.insightText}>
            • Your strongest performance area: Science (85%)
          </Text>
          <Text style={styles.insightText}>
            • Area for improvement: Math (50%)
          </Text>
          <Text style={styles.insightText}>
            • Recommended focus: Geometry fundamentals
          </Text>
          <Text style={styles.insightText}>
            • Personalized study plan ready
          </Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Example: Premium Features Section
 * Shows how to wrap different features with PremiumGate
 */
export const PremiumFeaturesExample: React.FC = () => {
  const { isPremium, isLoading, unlockPremium } = usePremium();
  const [isUnlocking, setIsUnlocking] = useState(false);

  /**
   * Simulate payment and unlock premium
   */
  const handlePayment = async () => {
    try {
      setIsUnlocking(true);
      await unlockPremium();
      alert('✅ Premium unlocked! Enjoy all features.');
    } catch (error) {
      alert('❌ Payment failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Premium Features</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {isPremium ? '✅ Premium' : '🔓 Free'}
          </Text>
        </View>
      </View>

      {/* Demo: Unlock Button */}
      {!isPremium && (
        <TouchableOpacity
          disabled={isLoading || isUnlocking}
          onPress={handlePayment}
          style={[
            styles.demoButton,
            (isLoading || isUnlocking) && styles.demoButtonDisabled,
          ]}
        >
          <Text style={styles.demoButtonText}>
            {isUnlocking ? 'Processing Payment...' : 'Demo: Unlock Premium'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Feature 1: Advanced Analytics - LOCKED */}
      <View style={styles.featureSection}>
        <Text style={styles.featureLabel}>Feature 1: Advanced Analytics</Text>
        <Text style={styles.featureDescription}>
          View detailed performance charts and insights
        </Text>
        <PremiumGate
          featureName="Advanced Analytics"
          description="Unlock detailed performance insights and charts"
          lockIcon="📊"
          buttonText="Upgrade Now"
        >
          <HighValueChart />
        </PremiumGate>
      </View>

      {/* Feature 2: Study Recommendations - LOCKED */}
      <View style={styles.featureSection}>
        <Text style={styles.featureLabel}>Feature 2: AI Study Recommendations</Text>
        <Text style={styles.featureDescription}>
          Personalized learning paths based on your performance
        </Text>
        <PremiumGate
          featureName="AI Study Recommendations"
          description="Get personalized learning paths powered by AI"
          lockIcon="🤖"
          buttonText="See Recommendations"
        >
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationTitle}>Your AI-Generated Study Plan</Text>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>📚 Focus on Algebra (Week 1)</Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>📚 Master Geometry (Week 2)</Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>📚 Advanced Calculus (Week 3)</Text>
            </View>
            <Text style={styles.estimatedTime}>⏱️ Estimated completion: 21 days</Text>
          </View>
        </PremiumGate>
      </View>

      {/* Feature 3: Offline Mode - LOCKED */}
      <View style={styles.featureSection}>
        <Text style={styles.featureLabel}>Feature 3: Offline Mode</Text>
        <Text style={styles.featureDescription}>
          Download and study without internet connection
        </Text>
        <PremiumGate
          featureName="Offline Mode"
          description="Download all courses and study offline"
          lockIcon="📲"
        >
          <View style={styles.offlineModeContainer}>
            <Text style={styles.offlineModeTitle}>Offline Features</Text>
            <View style={styles.offlineModeItem}>
              <Text style={styles.offlineText}>✓ Download all courses</Text>
            </View>
            <View style={styles.offlineModeItem}>
              <Text style={styles.offlineText}>✓ Access without Wi-Fi</Text>
            </View>
            <View style={styles.offlineModeItem}>
              <Text style={styles.offlineText}>✓ Sync when connected</Text>
            </View>
            <Text style={styles.offlineStorage}>💾 Storage used: 2.5 GB</Text>
          </View>
        </PremiumGate>
      </View>

      {/* Premium Status Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How PremiumGate Works</Text>
        <Text style={styles.infoBullet}>1️⃣ Free users see locked content with 35% opacity</Text>
        <Text style={styles.infoBullet}>2️⃣ Lock icon overlay prevents interactions</Text>
        <Text style={styles.infoBullet}>3️⃣ Tap overlay to navigate to SubscriptionScreen</Text>
        <Text style={styles.infoBullet}>4️⃣ Premium users see content normally</Text>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  } as TextStyle,

  statusBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  } as ViewStyle,

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  } as TextStyle,

  demoButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  } as ViewStyle,

  demoButtonDisabled: {
    opacity: 0.6,
  } as ViewStyle,

  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,

  featureSection: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  } as ViewStyle,

  featureLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  } as TextStyle,

  featureDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  } as TextStyle,

  // Chart Styles
  chartContainer: {
    marginTop: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    overflow: 'hidden',
  } as ViewStyle,

  chartHeader: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  } as ViewStyle,

  chartTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,

  chartContent: {
    padding: 16,
  } as ViewStyle,

  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    marginBottom: 16,
  } as ViewStyle,

  bar: {
    width: '18%',
    backgroundColor: '#6C63FF',
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  } as ViewStyle,

  barLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  } as TextStyle,

  chartMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  } as ViewStyle,

  metaItem: {
    alignItems: 'center',
  } as ViewStyle,

  metaLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  } as TextStyle,

  metaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  } as TextStyle,

  insightsContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  } as ViewStyle,

  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  } as TextStyle,

  insightText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  } as TextStyle,

  // Recommendation Styles
  recommendationContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F0EBFF',
    borderRadius: 10,
  } as ViewStyle,

  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  } as TextStyle,

  recommendationItem: {
    paddingVertical: 8,
  } as ViewStyle,

  recommendationBullet: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  } as TextStyle,

  estimatedTime: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: 12,
  } as TextStyle,

  // Offline Mode Styles
  offlineModeContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
  } as ViewStyle,

  offlineModeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  } as TextStyle,

  offlineModeItem: {
    paddingVertical: 6,
  } as ViewStyle,

  offlineText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  } as TextStyle,

  offlineStorage: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '600',
    marginTop: 10,
  } as TextStyle,

  // Info Card
  infoCard: {
    marginHorizontal: 20,
    marginVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  } as ViewStyle,

  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  } as TextStyle,

  infoBullet: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
    lineHeight: 18,
  } as TextStyle,

  footer: {
    height: 40,
  } as ViewStyle,
});

export default PremiumFeaturesExample;
