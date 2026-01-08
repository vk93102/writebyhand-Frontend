import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import {
  createRazorpaySubscription,
  getSubscriptionStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
} from '../services/api';

// Import promo code functions (added inline for now)
const validatePromoCode = async (code: string, userId: string, plan: string, amount: number) => {
  const response = await fetch(`https://ed-tech-backend-tzn8.onrender.com/api/promo/validate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, user_id: userId, plan, amount }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
};

const applyPromoCode = async (code: string, userId: string, subscriptionId: string | null, originalAmount: number, discountedAmount: number) => {
  const response = await fetch(`https://ed-tech-backend-tzn8.onrender.com/api/promo/apply/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, user_id: userId, subscription_id: subscriptionId, original_amount: originalAmount, discounted_amount: discountedAmount }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface ComparisonRow {
  feature: string;
  free: string;
  scholar: string;
  genius: string;
}

interface SubscriptionStatus {
  user_id: string;
  plan: string;
  subscription_status: string;
}

interface SubscriptionPricingProps {
  userId: string;
  onBack: () => void;
  usage?: {
    mock_tests: number;
    quizzes: number;
    flash_cards: number;
    pyqs: number;
    ask_questions: number;
    predicted_questions: number;
    youtube_summarizer: number;
  };
  limits?: Record<string, number | null>;
}

interface PricingPlan {
  id: 'free' | 'scholar' | 'genius';
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  subLabel?: string;
}

export const SubscriptionPricing: React.FC<SubscriptionPricingProps> = ({ userId, onBack, usage, limits }) => {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'scholar' | 'genius'>('scholar');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<any>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start visible

  // Animated scale refs for each plan to drive selection animation
  const animRefs = useRef<Record<'free'|'scholar'|'genius', Animated.Value>>({
    free: new Animated.Value(1),
    scholar: new Animated.Value(1),
    genius: new Animated.Value(1),
  }).current;

  // Animate selection when `selectedPlan` changes
  useEffect(() => {
    (Object.keys(animRefs) as Array<'free'|'scholar'|'genius'>).forEach((id) => {
      Animated.spring(animRefs[id], {
        toValue: selectedPlan === id ? 1.0112 : 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }).start();
    });
  }, [selectedPlan]);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '/mo',
      description: 'For casual learners',
      features: [
        '✓ Unlimited Mock Tests',
        '⚠️ 5 Quizzes/month (Limited)',
        '⚠️ 20 Flashcards/month (Limited)',
        '10 PYQs',
        '2 YouTube Summaries',
        'Ask Questions (Upgrade)',
        'Predicted Questions (Upgrade)',
      ],
      cta: 'Start for Free',
    },
    {
      id: 'scholar',
      name: 'Scholar',
      price: '₹1',
      period: ' first month',
      description: 'Best for serious students',
      badge: 'MOST POPULAR',
      highlighted: true,
      features: [
        'Unlimited Mock Tests',
        'Unlimited Quizzes',
        'Unlimited Flashcards',
        'Unlimited PYQs',
        'Unlimited YouTube Summaries',
        'Ask Questions (AI Tutor)',
        'Predicted Questions',
      ],
      cta: 'Get Scholar',
      subLabel: 'Then ₹99/month',
    },
    // {
    //   id: 'genius',
    //   name: 'Genius',
    //   price: '₹1',
    //   period: ' first month',
    //   description: 'For power users & teams',
    //   features: [
    //     'Everything in Scholar',
    //     'Priority Support 24/7',
    //     'Advanced Analytics',
    //     'Team Collaboration',
    //     'Custom Study Plans',
    //     'Early Access to Features',
    //   ],
    //   cta: 'Get Genius',
    //   subLabel: 'Then ₹499/month',
    // },
  ];

  const comparisonData: ComparisonRow[] = [
    { feature: 'Mock Tests', free: '♾️ Unlimited', scholar: '♾️ Unlimited', genius: '♾️ Unlimited' },
    { feature: 'Quizzes', free: '5 / month ⚠️', scholar: '♾️ Unlimited', genius: '♾️ Unlimited' },
    { feature: 'Flashcards', free: '20 / month ⚠️', scholar: '♾️ Unlimited', genius: '♾️ Unlimited' },
    { feature: 'Previous Year Questions', free: '10 total', scholar: '♾️ Unlimited', genius: '♾️ Unlimited' },
    { feature: 'YouTube Summarizer', free: '2 videos', scholar: '♾️ Unlimited', genius: '♾️ Unlimited' },
    { feature: 'Ask Questions (AI)', free: '❌ Upgrade', scholar: '✅ Included', genius: '✅ Included' },
    { feature: 'Predicted Questions', free: '❌ Upgrade', scholar: '✅ Included', genius: '✅ Included' },
    { feature: 'Support', free: 'Community', scholar: 'Email', genius: '24/7 Priority' },
  ];

  const faqData = [
    {
      question: 'How does the ₹1 trial work?',
      answer: 'Pay just ₹1 for the first month. After 30 days, it is ₹99/month. Cancel anytime before the trial ends to avoid renewal.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We use Razorpay for secure payments: UPI, cards, net banking, wallets. Auto-debit supported for renewals.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes. Cancel anytime from your account. Access remains until the end of the current paid period. No refunds for partial periods.',
    },
    {
      question: 'What do I get with Genius?',
      answer: 'All Scholar benefits plus priority support, team collaboration, advanced analytics, custom study plans, and early feature access.',
    },
  ];

  useEffect(() => {
    // Animation removed for better web compatibility
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getSubscriptionStatus(userId);
      setStatus({
        user_id: data.user_id,
        plan: data.plan,
        subscription_status: data.subscription_status,
      });
    } catch {
      // Silent, keep UI functional without status
    }
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setPromoValidating(true);
    setPromoError('');
    
    try {
      const planName = selectedPlan === 'scholar' ? 'scholar' : 'genius';
      const amount = selectedPlan === 'scholar' ? 99 : 499;
      
      const result = await validatePromoCode(promoCode.trim().toUpperCase(), userId, planName, amount);
      
      if (result.valid) {
        setPromoApplied(result);
        setPromoError('');
        Alert.alert('Success!', result.message || 'Promo code applied successfully');
      } else {
        setPromoError(result.error || 'Invalid promo code');
        setPromoApplied(null);
      }
    } catch (error: any) {
      setPromoError(error.message || 'Failed to validate promo code');
      setPromoApplied(null);
    } finally {
      setPromoValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoApplied(null);
    setPromoError('');
  };

  // Load Razorpay checkout script on web when needed
  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleSubscribe = async (planId: 'free' | 'scholar' | 'genius') => {
    if (planId === 'free') {
      Alert.alert('Free Plan', 'You are already on the free plan. Upgrade to unlock more features.');
      return;
    }

    if (!userId) {
      Alert.alert('Login Required', 'Please login to subscribe.');
      return;
    }

    const planName = planId === 'scholar' ? 'basic' : 'premium';
    const originalAmount = 1; // ₹1 for first month for both plans
    const finalAmount = promoApplied ? promoApplied.discounted_amount : originalAmount;

    try {
      setProcessing(true);
      
      // Web: use Razorpay Checkout with production key and order
      if (isWeb) {
        // Load Razorpay script
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) {
          Alert.alert('Error', 'Unable to load Razorpay checkout. Please check your internet connection and try again.');
          setProcessing(false);
          return;
        }

        try {
          // Get Razorpay key
          const keyId = await getRazorpayKey();
          
          // Create order with retry logic
          let order;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              order = await createRazorpayOrder(finalAmount, userId, { 
                plan: planName, 
                type: 'subscription',
                promo_code: promoApplied?.code,
                original_amount: originalAmount,
                discount_applied: promoApplied?.discount_applied
              });
              break;
            } catch (err: any) {
              retryCount++;
              if (retryCount >= maxRetries) {
                throw new Error('Failed to create order after multiple attempts. Please try again.');
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
          
          if (!order) {
            throw new Error('Failed to create payment order');
          }

        const razorpay = new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'EdTech Premium',
          description: `${planName.toUpperCase()} Subscription${promoApplied ? ` (${promoApplied.discount_value}% OFF)` : ''}`,
          image: 'https://cdn-icons-png.flaticon.com/512/3976/3976625.png', // Education icon
          order_id: order.order_id,
          notes: { 
            plan: planName, 
            user_id: userId, 
            promo_code: promoApplied?.code || '',
            original_amount: originalAmount,
            discount_applied: promoApplied?.discount_applied || 0
          },
          handler: async (resp: any) => {
            try {
              setProcessing(true);
              
              // Show verification in progress
              if (Platform.OS === 'web') {
                const processingDiv = document.createElement('div');
                processingDiv.id = 'razorpay-processing';
                processingDiv.style.cssText = `
                  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(0,0,0,0.8); z-index: 99999;
                  display: flex; align-items: center; justify-content: center;
                `;
                processingDiv.innerHTML = `
                  <div style="background: white; padding: 40px; border-radius: 16px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                    <div style="font-size: 18px; font-weight: 600; color: #1E293B; margin-bottom: 8px;">
                      Verifying Payment...
                    </div>
                    <div style="font-size: 14px; color: #64748B;">
                      Please wait while we confirm your payment
                    </div>
                  </div>
                `;
                document.body.appendChild(processingDiv);
              }
              
              // Verify payment with backend
              await verifyRazorpayPayment(resp.razorpay_order_id, resp.razorpay_payment_id, resp.razorpay_signature);
              
              // Apply promo code if used
              if (promoApplied) {
                await applyPromoCode(
                  promoApplied.code,
                  userId,
                  null,
                  originalAmount,
                  finalAmount
                );
              }
              
              // Remove processing overlay
              if (Platform.OS === 'web') {
                const processingDiv = document.getElementById('razorpay-processing');
                if (processingDiv) processingDiv.remove();
              }
              
              // Show success message with confetti effect
              if (Platform.OS === 'web') {
                const successDiv = document.createElement('div');
                successDiv.id = 'razorpay-success';
                successDiv.style.cssText = `
                  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(16, 185, 129, 0.95); z-index: 99999;
                  display: flex; align-items: center; justify-content: center;
                  animation: fadeIn 0.3s ease-in;
                `;
                successDiv.innerHTML = `
                  <div style="background: white; padding: 48px; border-radius: 20px; text-align: center; max-width: 400px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                    <div style="font-size: 24px; font-weight: 700; color: #047857; margin-bottom: 12px;">
                      Payment Successful!
                    </div>
                    <div style="font-size: 16px; color: #64748B; margin-bottom: 8px;">
                      Your ${planName.toUpperCase()} subscription is now active
                    </div>
                    ${promoApplied ? `
                      <div style="background: #ECFDF5; padding: 12px; border-radius: 8px; margin-top: 16px;">
                        <div style="font-size: 14px; color: #059669; font-weight: 600;">
                          💰 Saved ₹${promoApplied.discount_applied.toFixed(0)} with ${promoApplied.code}
                        </div>
                      </div>
                    ` : ''}
                    <div style="font-size: 14px; color: #94A3B8; margin-top: 16px;">
                      Refreshing your account...
                    </div>
                  </div>
                `;
                document.body.appendChild(successDiv);
                
                // Auto close after 3 seconds
                setTimeout(() => {
                  successDiv.remove();
                }, 3000);
              } else {
                Alert.alert(
                  '🎉 Payment Successful!',
                  `Your ${planName.toUpperCase()} subscription is now active.${promoApplied ? `\n\nYou saved ₹${promoApplied.discount_applied.toFixed(0)} with ${promoApplied.code}!` : ''}`,
                  [{ text: 'Great!', style: 'default' }]
                );
              }
              
              await loadStatus();
              
            } catch (e: any) {
              // Remove processing overlay
              if (Platform.OS === 'web') {
                const processingDiv = document.getElementById('razorpay-processing');
                if (processingDiv) processingDiv.remove();
              }
              
              Alert.alert(
                'Verification Failed',
                e.message || 'Could not verify payment. Please contact support if amount was deducted.',
                [{ text: 'OK', style: 'cancel' }]
              );
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            email: `${userId}@example.com`,
            contact: '',
          },
          theme: { color: colors.primary },
          modal: {
            ondismiss: () => {
              setProcessing(false);
            },
          },
        });

        razorpay.open();
        
        } catch (orderError: any) {
          setProcessing(false);
          throw new Error(orderError.message || 'Failed to initialize Razorpay checkout');
        }
        
      } else {
        // Mobile: use payment link
        const response = await createRazorpaySubscription(userId, planName);
        const paymentUrl = response.payment_url || response.short_url;
        if (paymentUrl) {
          const supported = await Linking.canOpenURL(paymentUrl);
          if (supported) {
            await Linking.openURL(paymentUrl);
            Alert.alert('Payment Initiated', response.message || 'Complete the payment to activate your subscription.');

            // Poll subscription status for confirmation. Poll for up to 10 attempts every 3 seconds.
            try {
              for (let i = 0; i < 10; i++) {
                await new Promise((res) => setTimeout(res, 3000));
                try {
                  const s = await getSubscriptionStatus(userId);
                  setStatus({ user_id: s.user_id, plan: s.plan, subscription_status: s.subscription_status });
                  if (s.subscription_status === 'active' && s.plan === planName) {
                    Alert.alert('Success', 'Subscription activated. Enjoy premium features!');
                    break;
                  }
                } catch (e) {
                  // continue polling silently
                }
              }
            } catch (e) {
              // ignore polling errors
            }
          } else {
            Alert.alert('Error', 'Cannot open payment link');
          }
        } else {
          Alert.alert('Error', 'No payment link returned.');
        }
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      let errorMessage = 'Failed to create subscription. Please try again.';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Payment Error',
        errorMessage,
        [
          { text: 'Retry', onPress: () => handleSubscribe(planId) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setProcessing(false);
      await loadStatus();
    }
  };

  const PillToggle = () => (
    <View style={styles.togglePill}>
    </View>
  );

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const renderPlanCard = (plan: PricingPlan) => {
    const isCurrent = status?.plan === (plan.id === 'scholar' ? 'basic' : plan.id === 'genius' ? 'premium' : 'free');
    const isSelected = selectedPlan === plan.id;
    const smallScreen = width < 420 && !isWeb;

    // Use regular TouchableOpacity on web for better compatibility
    const CardComponent = isWeb ? TouchableOpacity : AnimatedTouchable;
    const animatedStyle = isWeb ? {} : {
      transform: [{ scale: animRefs[plan.id] }],
      opacity: fadeAnim,
    };

    return (
      <CardComponent
        key={plan.id}
        activeOpacity={0.95}
        onPress={() => {
          if (!isWeb) {
            // immediate feedback spring (mobile only)
            Animated.spring(animRefs[plan.id], {
              toValue: 1.0224,
              useNativeDriver: true,
              speed: 20,
              bounciness: 8,
            }).start(() => {
              setSelectedPlan(plan.id);
            });
          } else {
            setSelectedPlan(plan.id);
          }
        }}
        style={[
          styles.planCard,
          plan.highlighted && styles.planCardHighlighted,
          isSelected && styles.planCardSelected,
          smallScreen && styles.planCardMobile,
          animatedStyle,
        ]}
      >
        {plan.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{plan.badge}</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDesc}>{plan.description}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.price, smallScreen && styles.priceMobile]}>{plan.price}</Text>
          <Text style={styles.pricePeriod}>{plan.period}</Text>
        </View>
        {plan.subLabel && <Text style={styles.subLabel}>{plan.subLabel}</Text>}

        <TouchableOpacity
          style={[styles.cta, plan.highlighted && styles.ctaDark]}
          activeOpacity={0.9}
          disabled={processing}
          onPress={() => {
            // ensure the plan is selected before subscribing
            setSelectedPlan(plan.id);
            handleSubscribe(plan.id);
          }}
        >
          {processing && selectedPlan === plan.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.ctaText}>{isCurrent ? 'Current Plan' : plan.cta}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.featuresWrap}>
          {plan.features.map((feature, idx) => {
            const isRestricted = feature.includes('⚠️');
            const isUnlimited = feature.includes('✓');
            const needsUpgrade = feature.toLowerCase().includes('upgrade');
            
            return (
              <View key={idx} style={styles.featureRow}>
                <MaterialIcons
                  name={needsUpgrade ? 'cancel' : isRestricted ? 'warning' : 'check-circle'}
                  size={16}
                  color={needsUpgrade ? '#D1D5DB' : isRestricted ? '#F59E0B' : colors.primary}
                />
                <Text style={[
                  styles.featureText,
                  needsUpgrade && styles.featureTextMuted,
                  isRestricted && styles.featureTextWarning,
                  isUnlimited && styles.featureTextUnlimited
                ]}>
                  {feature}
                </Text>
              </View>
            );
          })}
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        )}
      </CardComponent>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscription Plans</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={true}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Unlock your full learning potential</Text>
          <Text style={styles.heroSubtitle}>
            Turn your notes into quizzes instantly. Start generating AI quizzes and flashcards for free, or upgrade for unlimited power.
          </Text>
          <PillToggle />
        </View>

        {/* Usage Alert for Free Users */}
        {status?.plan === 'free' && usage && limits && (
          <View style={styles.usageAlert}>
            <MaterialIcons name="info" size={20} color="#D97706" />
            <View style={styles.usageAlertContent}>
              <Text style={styles.usageAlertTitle}>Your Current Usage (Free Plan)</Text>
              <Text style={styles.usageAlertText}>
                ✓ Mock Tests: {usage.mock_tests} (Unlimited) • ⚠️ Quizzes: {usage.quizzes}/{limits.quiz || 5} • ⚠️ Flashcards: {usage.flash_cards}/{limits.flashcards || 20}
              </Text>
              <Text style={styles.usageAlertUpgrade}>💡 Upgrade to unlock unlimited Quizzes & Flashcards</Text>
            </View>
          </View>
        )}




        {/* Plans */}
        <View style={styles.plansWrapper}>
          <View style={[styles.plansGrid, !isWeb && styles.plansGridMobile]}>
            {plans.map(renderPlanCard)}
          </View>
          <Text style={styles.noteText}>* Pay ₹1 for the first month. We will auto-debit every month unless you cancel.</Text>
        </View>

        {/* Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Compare features in detail</Text>
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.tableCell, styles.tableHeader, styles.tableCellFirst]}>Feature</Text>
              <Text style={[styles.tableCell, styles.tableHeader]}>Free</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.tableHighlight]}>Scholar</Text>
              <Text style={[styles.tableCell, styles.tableHeader]}>Genius</Text>
            </View>
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
                  size={22}
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
          <View style={styles.ctaButtonsRow}>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 560,
    marginBottom: 18,
    fontWeight: '500',
  },
  usageAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  usageAlertContent: {
    flex: 1,
  },
  usageAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  usageAlertText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  usageAlertUpgrade: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 6,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginTop: 6,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#1D4ED8',
  },
  toggleActiveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  toggleOptionDisabled: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  toggleInactiveText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  plansWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    minHeight: 700,
    marginBottom: 20,
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 1100,
    marginBottom: 20, // Add bottom margin for visibility
  },
  plansGridMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16, // Increased gap for better spacing
    width: '100%',
    paddingBottom: 20, // Add padding at bottom
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: isWeb ? 340 : Math.min(width * 0.92, 380),
    maxWidth: 380,
    minHeight: 520,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 8,
  },
  planCardMobile: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  planCardHighlighted: {
    borderColor: '#3B82F6',
    borderWidth: 3,
    backgroundColor: '#F0F9FF',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    // transform removed for web compatibility - handled in component
  },
  planCardSelected: {
    borderColor: 'rgb(59,130,246)',
    borderWidth: 3,
    shadowColor: 'rgb(59,130,246)',
    shadowOpacity: 0.3,
  },
  selectedBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgb(59,130,246)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  badge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  planDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: -1,
  },
  priceMobile: {
    fontSize: 36,
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  cta: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaDark: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuresWrap: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    gap: 10,
    minHeight: 200,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  featureTextMuted: {
    color: '#D1D5DB',
  },
  featureTextWarning: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  featureTextUnlimited: {
    color: '#059669',
    fontWeight: '600',
  },
  noteText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
  },
  comparisonSection: {
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  tableCellFirst: {
    textAlign: 'left',
    fontWeight: '600',
  },
  tableHeader: {
    fontWeight: '700',
    fontSize: 12,
    color: '#0F172A',
  },
  tableHighlight: {
    backgroundColor: '#EEF2FF',
    color: colors.primary,
  },
  tableDataHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  tableCellBold: {
    fontWeight: '700',
  },
  faqSection: {
    paddingHorizontal: 16,
    paddingVertical: 26,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    lineHeight: 18,
  },
  ctaBanner: {
    backgroundColor: '#1D4ED8',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  ctaBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  ctaBannerSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaButtonsRow: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 10,
    width: '100%',
    maxWidth: 420,
    justifyContent: 'center',
  },
  ctaPrimary: {
    backgroundColor: '#E5F0FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 14,
  },
  ctaSecondary: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D9FF',
  },
  ctaSecondaryText: {
    color: '#E0E7FF',
    fontWeight: '700',
    fontSize: 14,
  },
  // Promo Code Styles
  promoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: isWeb ? 40 : 16,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  promoInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  promoButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  promoButtonDisabled: {
    opacity: 0.6,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  promoAppliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  promoAppliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  promoAppliedText: {
    flex: 1,
  },
  promoAppliedCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 2,
  },
  promoAppliedDiscount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  promoRemoveButton: {
    padding: 8,
  },
  promoErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  promoErrorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  promoPriceBreakdown: {
    marginTop: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  promoPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoPriceLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  promoPriceOriginal: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  promoPriceDiscount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  promoPriceFinal: {
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 12,
    marginTop: 8,
  },
  promoPriceFinalLabel: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '700',
  },
  promoPriceFinalValue: {
    fontSize: 20,
    color: '#047857',
    fontWeight: '800',
  },
});
