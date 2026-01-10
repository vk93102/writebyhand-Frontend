# Complete Subscription & Usage Management System

## Overview

This is a production-ready subscription and feature usage management system for your EdTech application. It provides:

- ✅ Subscription status tracking (Active, Trial, Past Due, Cancelled)
- ✅ Feature usage monitoring with limits
- ✅ Upgrade flows with Razorpay payment integration
- ✅ User-friendly modals and prompts
- ✅ Real-time usage statistics
- ✅ Trial countdown warnings
- ✅ Comprehensive error handling

## Architecture

```
services/
├── subscriptionService.ts       # Main subscription API client
└── useFeatureAvailability.ts   # React hook for feature checking

components/
├── UsageDashboard.tsx           # User's usage overview
├── SubscriptionStatusModal.tsx  # Subscription details
├── UpgradePromptModal.tsx       # Limit reached upgrade prompt
└── PlanComparisonModal.tsx      # Plan selection modal
```

## Core Components

### 1. subscriptionService

Main service for all subscription operations:

```typescript
import { subscriptionService } from './src/services/subscriptionService';

// Get subscription status
const status = await subscriptionService.getSubscriptionStatus();

// Check feature availability BEFORE execution
const available = await subscriptionService.checkFeatureAvailability('quiz');

// Record usage AFTER successful execution
await subscriptionService.recordFeatureUsage('quiz', { duration: 300 });

// Get available plans
const plans = await subscriptionService.getAvailablePlans();

// Create subscription (initiates payment)
const result = await subscriptionService.createSubscription('basic');

// Cancel subscription
await subscriptionService.cancelSubscription('too-expensive');
```

### 2. useFeatureAvailability Hook

React hook for easy feature availability checking:

```typescript
import { useFeatureAvailability } from './src/services/useFeatureAvailability';

function MyComponent() {
  const { checkFeature, recordUsage, lastFeatureStatus } = useFeatureAvailability();

  const handleStartQuiz = async () => {
    // Check BEFORE executing
    const allowed = await checkFeature('quiz');
    if (!allowed) {
      showUpgradePrompt(lastFeatureStatus);
      return;
    }

    // Execute feature
    await executeQuiz();

    // Record AFTER success
    await recordUsage('quiz');
  };
}
```

### 3. UI Components

#### UsageDashboard
Displays user's subscription and feature usage:
- Subscription status overview
- Feature usage progress bars
- Upgrade button for free users
- Tab-based navigation (Overview/Features)

#### SubscriptionStatusModal
Shows detailed subscription information:
- Plan name and status badge
- Trial end date / Next billing date
- Feature access details
- Manage/Upgrade buttons

#### UpgradePromptModal
Triggered when user hits feature limit:
- Feature name and usage (X/Y)
- Upgrade benefits list
- Price and trial info
- Call-to-action button

#### PlanComparisonModal
Shows all available plans:
- Side-by-side plan comparison
- Feature list for each plan
- Current plan indicator
- Select/Upgrade button per plan

## Integration Steps

### Step 1: Import Components and Services

```typescript
import { subscriptionService } from './src/services/subscriptionService';
import { SubscriptionStatusModal } from './src/components/SubscriptionStatusModal';
import { UpgradePromptModal } from './src/components/UpgradePromptModal';
import { PlanComparisonModal } from './src/components/PlanComparisonModal';
```

### Step 2: Add State

```typescript
const [subscriptionStatusModal, setSubscriptionStatusModal] = useState(false);
const [upgradePromptModal, setUpgradePromptModal] = useState(false);
const [planComparisonModal, setPlanComparisonModal] = useState(false);
const [currentFeatureCheck, setCurrentFeatureCheck] = useState({
  feature: '',
  used: 0,
  limit: 0,
});
```

### Step 3: Feature Availability Check Pattern

```typescript
const handleStartQuiz = async () => {
  // 1. Check availability
  const response = await subscriptionService.checkFeatureAvailability('quiz');

  if (!response.status.allowed) {
    // Show upgrade prompt
    setCurrentFeatureCheck({
      feature: 'Quiz',
      used: response.status.used,
      limit: response.status.limit,
    });
    setUpgradePromptModal(true);
    return;
  }

  // 2. Execute feature
  try {
    const quiz = await generateQuiz(config);
    setQuizData(quiz);

    // 3. Record usage (only after success)
    await subscriptionService.recordFeatureUsage('quiz', {
      subject: config.subject,
      questions: config.numQuestions,
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to generate quiz');
  }
};
```

### Step 4: Upgrade Flow

```typescript
const handleSelectPlan = async (plan) => {
  // Create subscription (shows Razorpay)
  const result = await subscriptionService.createSubscription(plan.id);

  if (result.short_url) {
    // Redirect to payment
    window.location.href = result.short_url;
  }
};

const handlePaymentSuccess = async () => {
  // Validate subscription
  const validation = await subscriptionService.validateSubscription();

  if (validation.checks.unlimited_access) {
    Alert.alert('Success!', 'Your subscription is now active!');
    // Retry the original feature action
  }
};
```

### Step 5: Render Modals

```typescript
<SubscriptionStatusModal
  visible={subscriptionStatusModal}
  onClose={() => setSubscriptionStatusModal(false)}
  onUpgrade={() => setPlanComparisonModal(true)}
/>

<UpgradePromptModal
  visible={upgradePromptModal}
  onClose={() => setUpgradePromptModal(false)}
  onUpgrade={() => {
    setUpgradePromptModal(false);
    setPlanComparisonModal(true);
  }}
  featureName={currentFeatureCheck.feature}
  used={currentFeatureCheck.used}
  limit={currentFeatureCheck.limit}
/>

<PlanComparisonModal
  visible={planComparisonModal}
  onClose={() => setPlanComparisonModal(false)}
  onSelectPlan={handleSelectPlan}
/>
```

## API Endpoints Required

Your backend should implement these endpoints:

```
GET  /api/subscriptions/status/              - Get subscription status
GET  /api/subscriptions/plans/               - Get available plans
POST /api/usage/check/                       - Check feature availability
POST /api/usage/record/                      - Record feature usage
GET  /api/usage/statistics/                  - Get usage statistics
POST /api/subscriptions/create/              - Create subscription
GET  /api/subscriptions/validate/            - Validate subscription
POST /api/subscriptions/cancel/              - Cancel subscription
POST /api/subscriptions/upgrade/             - Upgrade plan
GET  /api/subscriptions/razorpay-key/        - Get Razorpay key
GET  /api/subscriptions/payment-history/     - Get payment history
```

## Response Formats

### Subscription Status
```typescript
{
  "plan": "basic",
  "status": "active",                    // active | trial | past_due | cancelled
  "unlimited_access": true,
  "is_trial": true,
  "trial_end_date": "2026-02-09T...",
  "next_billing_date": "2026-02-09T...",
  "last_payment_date": "2026-01-09T...",
  "features_unlocked": ["quiz", "flashcards"],
}
```

### Feature Check Response
```typescript
{
  "success": true,
  "status": {
    "allowed": true,                     // Can use feature
    "unlimited": false,                  // Has unlimited access
    "reason": "Within limit (2/3)",
    "limit": 3,
    "used": 2,
    "remaining": 1,
  }
}
```

### Plans List
```typescript
[
  {
    "id": "free",
    "name": "Free Plan",
    "first_month_price": 0,
    "recurring_price": 0,
    "features": {
      "quiz": 3,
      "flashcards": 3,
    }
  },
  {
    "id": "basic",
    "name": "Basic Plan",
    "first_month_price": 1.00,
    "recurring_price": 99.00,
    "trial_days": 30,
    "features": {
      "quiz": "unlimited",
      "flashcards": "unlimited",
    }
  }
]
```

## User Flows

### Flow 1: Free User Hits Limit

1. User clicks "Start Quiz"
2. App calls `checkFeatureAvailability('quiz')`
3. Backend returns `{ allowed: false, used: 3, limit: 3 }`
4. App shows `UpgradePromptModal` with "Limit Reached"
5. User clicks "Upgrade Now"
6. App shows `PlanComparisonModal`
7. User selects a plan
8. App calls `createSubscription(planId)`
9. Backend returns payment URL
10. App redirects to Razorpay
11. User completes payment
12. App redirects back with success
13. App validates subscription
14. User has unlimited access

### Flow 2: Trial User Gets Warning

1. App loads subscription status on startup
2. `subscription.is_trial = true`
3. `subscription.trial_end_date = "2026-02-09"`
4. App calculates days remaining: 7 days
5. App shows alert: "Trial ends in 7 days. Subscribe now!"
6. User clicks "Subscribe"
7. App shows `PlanComparisonModal`
8. ... (payment flow continues)

### Flow 3: Past Due Payment

1. App loads subscription status
2. `subscription.status = "past_due"`
3. App shows warning alert
4. When user tries feature:
   - `checkFeatureAvailability` returns `{ allowed: false }`
   - App shows message: "Payment failed. Update payment method."
   - User clicks "Update Payment"
   - App shows `PlanComparisonModal`

## Testing

### Test Cases

```typescript
// Free user - can execute 3 features
for (let i = 0; i < 3; i++) {
  const available = await checkFeatureAvailability('quiz');
  expect(available).toBe(true);
}

// Free user - 4th attempt blocked
const blocked = await checkFeatureAvailability('quiz');
expect(blocked).toBe(false);

// Paid user - unlimited
const status = await getSubscriptionStatus();
expect(status.unlimited_access).toBe(true);

// Record usage works
await recordFeatureUsage('quiz', { duration: 300 });

// Subscription can be cancelled
await cancelSubscription();
```

### Debug Mode

Add logging to understand the flow:

```typescript
const handleStartQuiz = async () => {
  console.log('1. Checking feature availability...');
  const response = await subscriptionService.checkFeatureAvailability('quiz');
  console.log('2. Response:', response);

  if (!response.status.allowed) {
    console.log('3. Feature blocked, showing upgrade prompt');
    return;
  }

  console.log('4. Executing quiz...');
  // ...execute feature...

  console.log('5. Recording usage...');
  await subscriptionService.recordFeatureUsage('quiz');
  console.log('6. Done!');
};
```

## Troubleshooting

### Issue: "Feature not allowed" when user is on trial

**Solution:** Make sure trial status is checked correctly:
```typescript
if (status.unlimited_access) {
  // User can use feature
}
```

### Issue: Payment redirects but doesn't return

**Solution:** Implement deep linking handler:
```typescript
useEffect(() => {
  const handleDeepLink = ({ url }) => {
    if (url.includes('payment-success')) {
      handlePaymentSuccess();
    }
  };

  Linking.addEventListener('url', handleDeepLink);
  return () => Linking.removeEventListener('url', handleDeepLink);
}, []);
```

### Issue: Usage not recording after feature execution

**Solution:** Make sure to call `recordFeatureUsage` AFTER success:
```typescript
try {
  const result = await executeFeature();
  // ✅ CORRECT: Record after success
  await recordFeatureUsage('feature');
} catch {
  // ❌ WRONG: Don't record if failed
}
```

### Issue: Modals not closing after selection

**Solution:** Reset state after handling:
```typescript
const handleSelectPlan = async (plan) => {
  await createSubscription(plan.id);
  setPlanComparisonModal(false);  // ✅ Close modal
};
```

## Customization

### Change API Base URL

Edit `subscriptionService.ts`:
```typescript
private getApiUrl(): string {
  return 'https://your-backend-url.com/api';
}
```

### Change Plan Pricing

Update `subscriptionService.getAvailablePlans()` response structure

### Customize Modal Colors

Edit component styles in each modal file

### Add More Features

Add to feature list in `UsageDashboard.tsx`:
```typescript
const features: UsageFeature[] = [
  // ... existing ...
  { name: 'New Feature', key: 'new_feature', icon: 'star', color: '#FF5722' },
];
```

## Performance Optimization

### Caching

```typescript
// Cache subscription status for 5 minutes
private lastStatusCheck: number = 0;
private cachedStatus: SubscriptionStatus | null = null;

async getSubscriptionStatus() {
  const now = Date.now();
  if (now - this.lastStatusCheck < 5 * 60 * 1000 && this.cachedStatus) {
    return this.cachedStatus;
  }

  const status = await this.apiClient.get('/subscriptions/status/');
  this.lastStatusCheck = now;
  this.cachedStatus = status.data;
  return status.data;
}
```

### Reduce API Calls

```typescript
// Check availability once per app session
const { lastFeatureStatus } = useFeatureAvailability();

// Only check when needed
if (lastFeatureStatus === null) {
  await checkFeature('quiz');
}
```

## Security

- Always validate user identity before API calls
- Store subscription status in secure local storage
- Never log sensitive payment information
- Use HTTPS for all API calls
- Validate signatures on payment callbacks

## Support

For questions or issues, refer to:
- Backend subscription implementation guide
- API documentation
- Payment provider documentation (Razorpay)
