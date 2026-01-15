/**
 * Premium Features Configuration
 * All learning/content features are PREMIUM
 * Only Profile, Pricing, Usage Dashboard are FREE
 */

export const PREMIUM_FEATURES = {
  // PREMIUM FEATURES (All learning content)
  'daily-quiz': {
    name: 'Play & Win',
    description: 'Daily quizzes with prizes',
    icon: 'emoji-events',
    requires_premium: true
  },
  'mock-test': {
    name: 'Mock Test',
    description: 'Full-length mock tests',
    icon: 'quiz',
    requires_premium: true
  },
  'quiz': {
    name: 'Quiz',
    description: 'Take subject-wise quizzes',
    icon: 'school',
    requires_premium: true
  },
  'pair-quiz': {
    name: 'Pair Quiz',
    description: 'Compete with friends in real-time quizzes',
    icon: 'people',
    requires_premium: true
  },
  'flashcards': {
    name: 'Flashcards',
    description: 'Create and study digital flashcards',
    icon: 'style',
    requires_premium: true
  },
  'ask': {
    name: 'Ask Question',
    description: 'Get expert answers to your questions',
    icon: 'help',
    requires_premium: true
  },
  'predicted-questions': {
    name: 'Predicted Questions',
    description: 'AI-powered predicted questions for your exams',
    icon: 'psychology',
    requires_premium: true
  },
  'previous-papers': {
    name: 'Previous Papers',
    description: 'Previous year exam papers',
    icon: 'description',
    requires_premium: true
  },
  'trends': {
    name: 'PYQ Features',
    description: 'Advanced PYQ analysis and trends',
    icon: 'analytics',
    requires_premium: true
  },
  'withdrawal': {
    name: 'Withdraw Coins',
    description: 'Withdraw your earned coins',
    icon: 'account-balance-wallet',
    requires_premium: true
  },

  // FREE FEATURES (Non-learning)
  'usage': {
    name: 'Usage Dashboard',
    description: 'Track your usage and progress',
    icon: 'dashboard',
    requires_premium: false
  },
  'profile': {
    name: 'Profile',
    description: 'View and manage your profile',
    icon: 'person',
    requires_premium: false
  },
  'pricing': {
    name: 'Pricing',
    description: 'Subscribe to premium features',
    icon: 'local-offer',
    requires_premium: false
  }
};

export const isPremiumFeature = (featureId: string): boolean => {
  return PREMIUM_FEATURES[featureId as keyof typeof PREMIUM_FEATURES]?.requires_premium ?? true;
};

export const getPremiumFeatureInfo = (featureId: string) => {
  return PREMIUM_FEATURES[featureId as keyof typeof PREMIUM_FEATURES] || null;
};

export const FREE_FEATURES = ['usage', 'profile', 'pricing'];

export const isFreeFeature = (featureId: string): boolean => {
  return FREE_FEATURES.includes(featureId);
};
