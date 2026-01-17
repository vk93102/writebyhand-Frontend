import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Platform,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/theme';
import { 
  createPaymentOrder, 
  openRazorpayCheckout, 
  pollSubscriptionStatus,
  checkSubscriptionStatus 
} from '../services/subscriptionService';

const isWeb = Platform.OS === 'web';

interface Feature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: Feature[];
  highlighted: boolean;
  buttonText: string;
  badge?: string;
}

interface ComparisonRow {
  feature: string;
  free: string;
  scholar: string;
  genius: string;
}

interface PricingProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  onSubscriptionComplete?: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ userId, userEmail, userName, onSubscriptionComplete }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('scholar');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [processing, setProcessing] = useState(false);

  const { width } = dimensions;
  const isLarge = isWeb && width >= 900;
  const isMobile = width < 768 && !isWeb;

  // Dynamic card width based on screen size
  const getCardWidth = () => {
    if (isWeb) return 320; // Fixed width for web
    if (width >= 768) return width * 0.8; // Tablet
    if (width >= 480) return width * 0.85; // Large mobile
    return width * 0.9; // Small mobile
  };

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '/mo',
      description: 'For casual learners',
      highlighted: false,
      buttonText: 'Start for Free',
      features: [
        { name: '2 Mock Tests per month', included: true },
        { name: '5 Quizzes per month', included: true },
        { name: '20 Flashcards', included: true },
        { name: '10 Previous Year Questions', included: true },
        { name: '2 YouTube Summaries', included: true },
        { name: 'Ask Questions', included: false },
        { name: 'Predicted Questions', included: false },
      ],
    },
    {
      id: 'scholar',
      name: 'Scholar',
      price: '₹1',
      period: ' first month',
      description: 'For serious students',
      highlighted: true,
      badge: 'MOST POPULAR',
      buttonText: 'Get Scholar',
      features: [
        { name: 'Unlimited Mock Tests', included: true },
        { name: 'Unlimited Quizzes', included: true },
        { name: 'Unlimited Flashcards', included: true },
        { name: 'Unlimited PYQs', included: true },
        { name: 'Unlimited YouTube Summaries', included: true },
        { name: 'Ask Questions (AI Tutor)', included: true },
        { name: 'Predicted Questions', included: true },
      ],
    },
    {
      id: 'genius',
      name: 'Genius',
      price: '₹1',
      period: ' first month',
      description: 'For power users & teams',
      highlighted: false,
      buttonText: 'Get Genius',
      features: [
        { name: 'Everything in Scholar', included: true },
        { name: 'Priority Support 24/7', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'Team Collaboration', included: true },
        { name: 'Custom Study Plans', included: true },
        { name: 'Early Access to Features', included: true },
      ],
    },
  ];

  const comparisonData: ComparisonRow[] = [
    { feature: 'Mock Tests', free: '2 / month', scholar: 'Unlimited', genius: 'Unlimited' },
    { feature: 'Quizzes', free: '5 / month', scholar: 'Unlimited', genius: 'Unlimited' },
    { feature: 'Flashcards', free: '20 total', scholar: 'Unlimited', genius: 'Unlimited' },
    { feature: 'Previous Year Questions', free: '10 total', scholar: 'Unlimited', genius: 'Unlimited' },
    { feature: 'YouTube Summarizer', free: '2 videos', scholar: 'Unlimited', genius: 'Unlimited' },
    { feature: 'Ask Questions (AI)', free: '', scholar: '✓ Unlimited', genius: '✓ Unlimited' },
    { feature: 'Predicted Questions', free: '', scholar: '✓ Unlimited', genius: '✓ Unlimited' },
    { feature: 'Support', free: 'Community', scholar: 'Email', genius: '24/7 Priority' },
  ];

  const faqData = [
    {
      question: 'How does the ₹1 trial work?',
      answer: 'Pay just ₹1 for the first month to access all Scholar features. After 30 days, you\'ll be charged ₹99/month automatically. Cancel anytime before the trial ends.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We use Razorpay for secure payments. You can pay via UPI, Credit/Debit Cards, Net Banking, and more. All subscriptions support auto-debit for hassle-free renewals.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes! Cancel anytime from your account settings. Your subscription stays active until the end of your paid period. No refunds, but you keep full access until then.',
    },
    {
      question: 'What\'s the difference between Scholar and Genius?',
      answer: 'Scholar (₹99/mo) gives you unlimited access to all study features. Genius (₹499/mo) adds priority support, team collaboration, and advanced analytics for power users.',
    },
  ];

  const animValues = useRef(
    plans.reduce((acc, p) => {
      acc[p.id] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => subscription?.remove?.();
  }, []);

  const handleHoverIn = (id: string) => {
    Animated.spring(animValues[id], {
      toValue: 1.05,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = (id: string) => {
    Animated.spring(animValues[id], {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  /**
   * PRODUCTION-LEVEL SUBSCRIPTION HANDLER
   * Handles the complete payment flow with proper error handling and feature unlocking
   */
  const handleSubscribe = async (planId: string) => {
    // Validation
    if (planId === 'free') {
      Alert.alert('Free Plan', 'You\'re already on the free plan! Upgrade to unlock more features.');
      return;
    }

    if (!userId) {
      Alert.alert('Login Required', 'Please login to subscribe to a plan.');
      return;
    }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const pricingInfo = planId === 'scholar' 
      ? '₹1 for first month, then ₹99/month'
      : '₹1 for first month, then ₹499/month';

    // Map plan IDs to backend plan names matching backend test results
    const planName = planId === 'scholar' ? 'premium' : 'premium_annual';

    Alert.alert(
      `Subscribe to ${plan.name}`,
      `You'll be charged ${pricingInfo}. Continue to payment?`,
      [
        {
          text: 'Continue',
          onPress: async () => {
            try {
              setProcessing(true);
              console.log('[Pricing] 🚀 Production-level subscription flow initiated', { 
                userId, 
                planId, 
                planName, 
                platform: Platform.OS,
                timestamp: new Date().toISOString()
              });

              // ==================== STEP 1: CREATE PAYMENT ORDER ====================
              console.log('[Pricing] 📦 Step 1: Creating payment order...');
              const orderResponse = await createPaymentOrder(userId, planName);

              if (!orderResponse.success) {
                setProcessing(false);
                
                // Handle duplicate subscription (409 Conflict from backend)
                if (orderResponse.error === 'Already Subscribed' || orderResponse.error?.includes('subscribed')) {
                  console.log('[Pricing] ℹ️ Duplicate subscription detected, showing current plan info');
                  Alert.alert(
                    'Already Subscribed',
                    orderResponse.message || 'You already have an active subscription.',
                    [
                      {
                        text: 'View Subscription Details',
                        onPress: async () => {
                          try {
                            const status = await checkSubscriptionStatus(userId);
                            const currentPlan = status.plan?.charAt(0).toUpperCase() + status.plan?.slice(1) || 'Unknown';
                            const statusText = status.subscription_status.toUpperCase();
                            const dateToShow = status.is_trial 
                              ? `Trial ends: ${new Date(status.trial_end_date || '').toLocaleDateString()}`
                              : `Next billing: ${new Date(status.next_billing_date || '').toLocaleDateString()}`;
                            
                            Alert.alert(
                              'Current Subscription',
                              `Plan: ${currentPlan}\nStatus: ${statusText}\n${dateToShow}\nAuto-renewal: ${status.auto_renewal ? 'Enabled' : 'Disabled'}`
                            );
                          } catch (err) {
                            Alert.alert('Current Subscription', JSON.stringify(orderResponse, null, 2));
                          }
                        },
                      },
                      {
                        text: 'Upgrade Plan',
                        onPress: () => {
                          // Allow upgrade by creating new order with different plan
                          console.log('[Pricing] 📈 User proceeding to upgrade plan');
                          handleSubscribe('genius'); // Upgrade to higher plan
                        },
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                  return;
                }

                // Handle other errors
                console.error('[Pricing] ❌ Order creation failed:', orderResponse);
                Alert.alert(
                  'Order Creation Failed',
                  orderResponse.error || 'Failed to create payment order. Please try again.'
                );
                return;
              }

              console.log('[Pricing] ✅ Step 1 Complete - Order created:', {
                orderId: orderResponse.order_id,
                amount: `₹${orderResponse.amount}`,
                plan: orderResponse.plan
              });

              // ==================== STEP 2: HANDLE PLATFORM-SPECIFIC PAYMENT ====================
              if (Platform.OS === 'web') {
                console.log('[Pricing] 💻 Web Platform: Opening Razorpay checkout modal');
                
                try {
                  await openRazorpayCheckout(
                    orderResponse,
                    userId,
                    userEmail || 'user@example.com',
                    userName || 'User',
                    async (paymentResponse) => {
                      console.log('[Pricing] 💳 Step 2 Complete - Payment received from Razorpay:', {
                        paymentId: paymentResponse.razorpay_payment_id,
                        orderId: paymentResponse.razorpay_order_id,
                        hasSignature: !!paymentResponse.razorpay_signature
                      });

                      try {
                        // ==================== STEP 3: POLL FOR SUBSCRIPTION ACTIVATION ====================
                        console.log('[Pricing] 🔄 Step 3: Polling subscription status after payment...');
                        const isPremium = await pollSubscriptionStatus(userId, 15, 1000);
                        
                        setProcessing(false);

                        if (isPremium) {
                          console.log('[Pricing] 🎉 SUCCESS - Premium status confirmed!');
                          Alert.alert(
                            'Success! 🎉',
                            'Your subscription has been activated!\n\n✅ All premium features are now unlocked\n✅ Your trial period starts today\n✅ You can start learning immediately',
                            [
                              {
                                text: 'Start Using Features',
                                onPress: () => {
                                  console.log('[Pricing] User proceeding to use premium features');
                                  onSubscriptionComplete?.();
                                },
                              },
                            ]
                          );
                        } else {
                          console.log('[Pricing] ⏱️ Polling timeout - showing refresh prompt');
                          Alert.alert(
                            'Payment Successful ✅',
                            'Your payment has been processed! Your subscription will be activated in a few seconds.\n\nPlease refresh the page to see your premium features.',
                            [
                              {
                                text: 'Refresh Now',
                                onPress: () => {
                                  console.log('[Pricing] User requested page refresh');
                                  if (Platform.OS === 'web') {
                                    (window as any).location.reload();
                                  }
                                },
                              },
                              {
                                text: 'Refresh Later',
                                onPress: () => {
                                  console.log('[Pricing] User will refresh later');
                                  onSubscriptionComplete?.();
                                },
                              },
                            ]
                          );
                        }
                      } catch (pollError: any) {
                        setProcessing(false);
                        console.error('[Pricing] ❌ Polling error:', pollError);
                        Alert.alert(
                          'Processing Subscription',
                          'Payment was successful! Please wait a moment and refresh the page to activate your subscription.'
                        );
                      }
                    },
                    (error) => {
                      console.log('[Pricing] ❌ Payment cancelled by user:', error.message);
                      setProcessing(false);
                      Alert.alert(
                        'Payment Cancelled',
                        'No charges have been made. You can try again anytime.'
                      );
                    }
                  );
                } catch (razorpayError: any) {
                  setProcessing(false);
                  console.error('[Pricing] ❌ Razorpay error:', razorpayError);
                  Alert.alert(
                    'Payment Gateway Error',
                    razorpayError.message || 'Failed to open payment gateway. Please try again.'
                  );
                }
              } else {
                // ==================== MOBILE PLATFORM ====================
                console.log('[Pricing] 📱 Mobile Platform: Opening external Razorpay link');
                
                try {
                  if (orderResponse.order_id) {
                    // Generate Razorpay short URL for mobile
                    const paymentUrl = `https://rzp.io/${orderResponse.order_id}`;
                    const supported = await Linking.canOpenURL(paymentUrl);
                    
                    if (supported) {
                      await Linking.openURL(paymentUrl);
                      setProcessing(false);
                      
                      console.log('[Pricing] ✅ Razorpay link opened on mobile');
                      Alert.alert(
                        'Payment Initiated',
                        'Please complete the payment in the opened window.\n\nThe app will automatically refresh after successful payment to unlock your premium features.'
                      );

                      // Auto-check subscription status after a delay for mobile
                      setTimeout(async () => {
                        console.log('[Pricing] 📱 Auto-checking subscription after payment on mobile');
                        try {
                          const status = await checkSubscriptionStatus(userId);
                          if (status.subscription_active) {
                            console.log('[Pricing] ✅ Mobile: Subscription activated, calling callback');
                            onSubscriptionComplete?.();
                          }
                        } catch (checkError) {
                          console.warn('[Pricing] Mobile auto-check failed (non-critical):', checkError);
                        }
                      }, 3000);
                    } else {
                      setProcessing(false);
                      Alert.alert(
                        'Cannot Open Payment Link',
                        'Please ensure you have a browser installed to complete the payment.'
                      );
                    }
                  } else {
                    setProcessing(false);
                    Alert.alert('Error', 'Order ID not received from backend');
                  }
                } catch (mobileError: any) {
                  setProcessing(false);
                  console.error('[Pricing] ❌ Mobile payment error:', mobileError);
                  Alert.alert('Payment Error', mobileError.message || 'Failed to process payment');
                }
              }
            } catch (error: any) {
              setProcessing(false);
              console.error('[Pricing] ❌ CRITICAL ERROR in subscription flow:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
              });

              Alert.alert(
                'Subscription Error',
                error.message || 'An unexpected error occurred. Please try again.',
                [
                  { text: 'Try Again', onPress: () => handleSubscribe(planId) },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }
          },
        },
        { text: 'Cancel', style: 'cancel', onPress: () => console.log('[Pricing] User cancelled subscription') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
        <Text style={styles.heroTitle}>Unlock your full learning potential</Text>
        <Text style={styles.heroSubtitle}>
          Turn your notes into quizzes instantly. Start generating AI quizzes and flashcards for free, or upgrade for unlimited power.
        </Text>
      </Animated.View>

      {/* Pricing Cards */}
      <View style={[styles.cardsWrapper, { paddingHorizontal: isMobile ? 16 : 24 }]}>
        {isLarge ? (
          <View style={[styles.cardsGrid, { paddingHorizontal: isMobile ? 16 : 24 }]}>
            {plans.map((plan) => (
              <Animated.View
                key={plan.id}
                style={(() => {
                  const transforms: any[] = [{ scale: animValues[plan.id] }];
                  if (plan.highlighted || selectedPlan === plan.id) transforms.push({ translateY: -6 });
                  return [
                    styles.card,
                    {
                      width: isWeb ? 340 : getCardWidth(),
                      maxWidth: 360,
                      padding: isWeb ? 28 : isMobile ? 16 : 20,
                      marginHorizontal: isWeb ? 10 : 8,
                    },
                    (plan.highlighted || selectedPlan === plan.id) && styles.cardSelected,
                    hoveredPlan === plan.id && !(selectedPlan === plan.id) && styles.cardHover,
                    { transform: transforms, opacity: fadeAnim, cursor: isWeb ? 'pointer' : undefined },
                  ];
                })()}
                onTouchStart={() => setSelectedPlan(plan.id)}
                onMouseDown={() => isWeb && setSelectedPlan(plan.id)}
                onMouseEnter={() => {
                  if (isWeb) {
                    setHoveredPlan(plan.id);
                    handleHoverIn(plan.id);
                  }
                }}
                onMouseLeave={() => {
                  if (isWeb) {
                    setHoveredPlan(null);
                    handleHoverOut(plan.id);
                  }
                }}
              >
                {plan.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={[styles.planName, isMobile && styles.planNameMobile]}>{plan.name}</Text>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.price, isMobile && styles.priceMobile]}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cta,
                    processing && styles.ctaDisabled,
                  ]}
                  onPress={() => {
                    setSelectedPlan(plan.id);
                    handleSubscribe(plan.id);
                  }}
                  activeOpacity={0.9}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.ctaText}>
                      {plan.buttonText}
                    </Text>
                  )}
                </TouchableOpacity>

                {plan.id === 'scholar' && (
                  <Text style={styles.recurringPrice}>Then ₹99/month</Text>
                )}
                {plan.id === 'genius' && (
                  <Text style={styles.recurringPrice}>Then ₹499/month</Text>
                )}

                <View style={styles.divider} />

                <View style={styles.features}>
                  <Text style={styles.includesLabel}>{plan.id === 'free' ? 'INCLUDES' : 'EVERYTHING IN FREE, PLUS'}:</Text>
                  {plan.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <MaterialIcons
                        name={feat.included ? 'check-circle' : 'cancel'}
                        size={16}
                        color={feat.included ? colors.primary : '#D1D5DB'}
                      />
                      <Text style={[styles.featureText, !feat.included && styles.featureDisabled]}>
                        {feat.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            snapToInterval={getCardWidth() + spacing.lg}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {plans.map((plan) => (
              <Animated.View
                key={plan.id}
                style={(() => {
                  const transforms: any[] = [{ scale: animValues[plan.id] }];
                  if (plan.highlighted || selectedPlan === plan.id) transforms.push({ translateY: -6 });
                  return [
                    styles.card,
                    {
                      width: getCardWidth(),
                      padding: isMobile ? 16 : 20,
                      marginHorizontal: 8,
                    },
                    (plan.highlighted || selectedPlan === plan.id) && styles.cardHighlighted,
                    hoveredPlan === plan.id && ! (selectedPlan === plan.id) && styles.cardHover,
                    { transform: transforms, opacity: fadeAnim, cursor: isWeb ? 'pointer' : undefined },
                  ];
                })()}
                onTouchStart={() => setSelectedPlan(plan.id)}
                onMouseDown={() => isWeb && setSelectedPlan(plan.id)}
                onMouseEnter={() => {
                  if (isWeb) {
                    setHoveredPlan(plan.id);
                    handleHoverIn(plan.id);
                  }
                }}
                onMouseLeave={() => {
                  if (isWeb) {
                    setHoveredPlan(null);
                    handleHoverOut(plan.id);
                  }
                }}
              >
                {plan.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={[styles.planName, isMobile && styles.planNameMobile]}>{plan.name}</Text>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.price, isMobile && styles.priceMobile]}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cta,
                    processing && styles.ctaDisabled,
                  ]}
                  onPress={() => {
                    setSelectedPlan(plan.id);
                    handleSubscribe(plan.id);
                  }}
                  activeOpacity={0.9}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.ctaText}>
                      {plan.buttonText}
                    </Text>
                  )}
                </TouchableOpacity>

                {plan.id === 'scholar' && (
                  <Text style={styles.recurringPrice}>Then ₹99/month</Text>
                )}
                {plan.id === 'genius' && (
                  <Text style={styles.recurringPrice}>Then ₹499/month</Text>
                )}

                <View style={styles.divider} />

                <View style={styles.features}>
                  <Text style={styles.includesLabel}>{plan.id === 'free' ? 'INCLUDES' : 'EVERYTHING IN FREE, PLUS'}:</Text>
                  {plan.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <MaterialIcons
                        name={feat.included ? 'check-circle' : 'cancel'}
                        size={16}
                        color={feat.included ? colors.primary : '#D1D5DB'}
                      />
                      <Text style={[styles.featureText, !feat.included && styles.featureDisabled]}>
                        {feat.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyNote}>
        <MaterialIcons name="lock" size={16} color="#6B7280" />
        <Text style={styles.privacyText}>
          Your documents are private and secure. We do not use your data to train our models.
        </Text>
      </View>

      {/* Comparison Table */}
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>Compare features in detail</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader, styles.tableCellFirst]}>Feature</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>Free</Text>
            <Text style={[styles.tableCell, styles.tableHeader, styles.tableHighlight]}>Scholar</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>Genius</Text>
          </View>

          {/* Rows */}
          {comparisonData.map((row, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.tableCellFirst, styles.tableCellBold]}>{row.feature}</Text>
              <Text style={styles.tableCell}>{row.free}</Text>
              <Text style={[styles.tableCell, styles.tableDataHighlight]}>{row.scholar}</Text>
              <Text style={styles.tableCell}>{row.genius}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        {faqData.map((faq, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.faqItem}
            onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <MaterialIcons
                name={expandedFaq === idx ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color="#111827"
              />
            </View>
            {expandedFaq === idx && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Banner */}
      <View style={styles.ctaBanner}>
        <Text style={styles.ctaBannerTitle}>Ready to ace your exams?</Text>
        <Text style={styles.ctaBannerSubtitle}>
          Join over 10,000 students who are studying smarter, not harder.
        </Text>
        {/* Buttons removed per request */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: '#F5F7FB',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 540,
  },
  cardsWrapper: {
    marginVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F7FB',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cardsContainer: {
    paddingHorizontal: 12,
    gap: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingRight: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 12,
    gap: 16,
    maxWidth: 1100,
    alignSelf: 'center',
    flexWrap: 'wrap',
  },
  // Make cards stretch and occupy available width on large screens
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    overflow: 'visible',
    paddingTop: 22,
    paddingBottom: 24,
    paddingHorizontal: 22,
    minHeight: 430,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 30px rgba(17, 24, 39, 0.08)',
      },
      default: {
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  cardHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F5F7FF',
    shadowColor: colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  cardHover: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    backgroundColor: '#F7F9FF',
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F5F7FF',
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ translateY: -6 } as any],
  },
  badge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardHeader: {
    marginBottom: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  planNameMobile: {
    fontSize: 17,
  },
  planDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 14,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceMobile: {
    fontSize: 30,
  },
  period: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  cta: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 8,
    minHeight: 48,
  },
  ctaHighlighted: {
    backgroundColor: colors.primary,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaTextHighlighted: {
    color: '#FFFFFF',
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  recurringPrice: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  features: {
    gap: 8,
  },
  includesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  featureDisabled: {
    color: '#D1D5DB',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#EEF2F7',
    marginHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  comparisonSection: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  comparisonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  tableCellFirst: {
    textAlign: 'left',
    fontWeight: '500',
  },
  tableHeader: {
    fontWeight: '700',
    backgroundColor: '#F5F7FF',
    borderBottomWidth: 1,
    paddingVertical: 10,
    fontSize: 12,
    color: '#0F172A',
  },
  tableHighlight: {
    backgroundColor: '#EEF2FF',
    color: colors.primary,
  },
  tableDataHighlight: {
    fontWeight: '600',
    color: colors.primary,
  },
  tableCellBold: {
    fontWeight: '600',
  },
  faqSection: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
    lineHeight: 18,
  },
  ctaBanner: {
    backgroundColor: colors.primary,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  ctaBannerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaBannerSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: 24,
  },
  ctaBannerButtons: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 12,
    width: '100%',
    maxWidth: 500,
  },
  ctaBannerBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaBannerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  ctaBannerBtnSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaBannerBtnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
