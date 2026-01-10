# Frontend API Implementation - Quick Reference

## Updated System Summary

Your frontend has been **updated to match the actual API responses** from your running backend. All endpoints now work correctly with the real response formats.

---

## API Endpoint Reference

### 1. Check Feature Availability (BEFORE execution)
```typescript
POST /api/usage/check/
Headers: X-User-ID: user_id or Authorization: Bearer token
Body: { "feature": "quiz" }

Response (Success - Allowed):
{
  "success": true,
  "message": "Feature available",
  "status": {
    "allowed": true,
    "reason": "Within limit (0/3)",
    "limit": 3,
    "used": 0,
    "remaining": 3
  }
}

Response (Blocked - Limit Reached):
{
  "success": false,
  "error": "Monthly limit reached (3/3 used)",
  "status": {
    "allowed": false,
    "limit": 3,
    "used": 3,
    "remaining": 0
  }
}
```

### 2. Record Feature Usage (AFTER successful execution)
```typescript
POST /api/usage/record/
Headers: X-User-ID: user_id or Authorization: Bearer token
Body: {
  "feature": "quiz",
  "input_size": 100,        // Actual content size in bytes
  "usage_type": "text",     // text | image | video | audio
  "metadata": {...}         // Optional
}

Response:
{
  "success": true,
  "message": "Feature \"quiz\" usage recorded",
  "usage": {
    "feature": "quiz",
    "limit": 3,
    "used": 1,
    "remaining": 2
  }
}
```

### 3. Get Dashboard (NEW - Recommended)
```typescript
GET /api/usage/dashboard/
Headers: X-User-ID: user_id or Authorization: Bearer token

Response:
{
  "success": true,
  "dashboard": {
    "user_id": "user123",
    "plan": "FREE",
    "subscription_id": "uuid-xxx",
    "features": {
      "quiz": {
        "display_name": "Quiz",
        "limit": 3,
        "used": 1,
        "remaining": 2,
        "unlimited": false,
        "percentage_used": 33
      },
      "flashcards": { ... },
      "mock_test": { ... }
      // ... 8 more features
    },
    "billing": {
      "first_month_price": 0.0,
      "recurring_price": 99.0,
      "is_trial": false,
      "trial_end_date": null,
      "subscription_status": "active",
      "subscription_start_date": "2026-01-09T21:30:38Z",
      "next_billing_date": null,
      "last_payment_date": null
    }
  }
}
```

### 4. Get Feature Status (Single Feature)
```typescript
GET /api/usage/feature/{feature}/
Headers: X-User-ID: user_id or Authorization: Bearer token

Response:
{
  "success": true,
  "feature": "quiz",
  "status": {
    "allowed": false,
    "reason": "Monthly limit reached (3/3 used)",
    "limit": 3,
    "used": 3,
    "remaining": 0
  }
}
```

---

## Frontend Usage - Code Examples

### Example 1: Basic Feature Usage (Quiz)
```typescript
import { useFeatureAvailability } from '../services/useFeatureAvailability';

export const QuizScreen = () => {
  const { checkFeature, recordUsage, error, loading } = useFeatureAvailability();
  
  const handleStartQuiz = async () => {
    // Step 1: Check if user can use quiz feature
    const allowed = await checkFeature('quiz');
    
    if (!allowed) {
      // User hit limit - show upgrade dialog
      showUpgradePrompt();
      return;
    }
    
    // Step 2: Execute quiz
    try {
      const quizResult = await runQuiz();
      
      // Step 3: Record usage (ONLY if successful)
      const inputSize = JSON.stringify(quizResult).length;
      await recordUsage(
        'quiz',
        inputSize,      // How many bytes of content
        'text',         // Type of content
        { topic: 'Biology' }  // Extra metadata
      );
      
      showResults(quizResult);
    } catch (e) {
      // Don't record if quiz failed
      showError(e.message);
    }
  };
  
  return (
    <Button 
      title="Start Quiz"
      onPress={handleStartQuiz}
      disabled={loading}
    />
  );
};
```

### Example 2: Using Dashboard Data
```typescript
import { subscriptionService, DashboardData } from '../services/subscriptionService';

export const UsageDashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  
  useEffect(() => {
    const loadDashboard = async () => {
      const data = await subscriptionService.getDashboard();
      setDashboard(data);
    };
    loadDashboard();
  }, []);
  
  if (!dashboard) return <Loader />;
  
  return (
    <View>
      {/* Show plan */}
      <Text>Plan: {dashboard.plan}</Text>
      
      {/* Show subscription status */}
      <Text>Status: {dashboard.billing.subscription_status}</Text>
      
      {/* Show features */}
      {Object.entries(dashboard.features).map(([key, feature]) => (
        <FeatureCard 
          key={key}
          name={feature.display_name}
          used={feature.used}
          limit={feature.limit}
          unlimited={feature.unlimited}
          percentageUsed={feature.percentage_used}
        />
      ))}
    </View>
  );
};
```

### Example 3: Check Individual Feature
```typescript
// Check single feature status
const status = await subscriptionService.getFeatureStatus('quiz');

if (status.status.allowed) {
  // User can use quiz
} else {
  // Show: "Monthly limit reached (3/3 used)"
  console.log(status.status.reason);
}
```

### Example 4: Flashcards Feature
```typescript
const { checkFeature, recordUsage } = useFeatureAvailability();

const handleCreateFlashcard = async (flashcardData) => {
  // Check before creating
  const allowed = await checkFeature('flashcards');
  if (!allowed) {
    showUpgradeModal();
    return;
  }
  
  // Create flashcard
  await createFlashcardInDB(flashcardData);
  
  // Record usage
  await recordUsage(
    'flashcards',
    flashcardData.content.length,  // inputSize
    'text',                          // usageType
    { category: flashcardData.category }
  );
};
```

---

## Available Features (API Field Names)

| Feature Name | API Key | Display Name | Free Limit | Premium |
|---|---|---|---|---|
| Quiz | `quiz` | Quiz | 3/month | Unlimited |
| Mock Test | `mock_test` | Mock Test | 3/month | Unlimited |
| Flashcards | `flashcards` | Flashcards | 3/month | Unlimited |
| Previous Year Questions | `pyqs` | Previous Year Questions | 3/month | Unlimited |
| Ask Question | `ask_question` | Ask Question | 3/month | Unlimited |
| Predicted Questions | `predicted_questions` | Predicted Questions | 3/month | Unlimited |
| YouTube Summarizer | `youtube_summarizer` | YouTube Summarizer | 3/month | Unlimited |
| Pair Quiz | `pair_quiz` | Pair Quiz | 0/month | Unlimited |
| Previous Papers | `previous_papers` | Previous Papers | 0/month | Unlimited |
| Daily Quiz | `daily_quiz` | Daily Quiz | 0/month | Unlimited |

---

## Usage Type Options

When recording usage, use one of these:
- `'text'` - Quiz, flashcards, ask question, etc.
- `'image'` - Image-based content
- `'video'` - YouTube summarizer
- `'audio'` - Audio content
- `'document'` - PDFs, papers

---

## Error Handling

### Feature Not Found
```json
{
  "success": false,
  "error": "Feature \"invalid_feature\" not found",
  "status": {
    "allowed": false,
    "reason": "Feature \"invalid_feature\" not found",
    "limit": 0,
    "used": 0
  }
}
```

### Missing Headers
```json
{
  "success": false,
  "error": "Missing or invalid authorization header. Use \"Authorization: Bearer <token>\" or \"X-User-ID: <user_id>\""
}
```

### Handle in Your Code
```typescript
try {
  const allowed = await checkFeature('quiz');
  if (!allowed) {
    // Show appropriate message based on reason
    if (error.includes('limit reached')) {
      showUpgradePrompt();
    } else if (error.includes('not found')) {
      showError('Feature not available');
    }
  }
} catch (e) {
  // Network error
  showError('Connection error. Please try again.');
}
```

---

## Feature Limits Reset

- **Free Plan**: Limits reset on the **1st of every month** at 00:00 UTC
- **Premium Plan**: No limits - unlimited access
- **Trial Users**: Limits don't apply if `is_trial: true` in billing

---

## Updated Components

### 1. subscriptionService
**New Methods**:
- `getDashboard()` - Get all dashboard data (recommended)
- `getFeatureStatus(feature)` - Get status of single feature

**Updated Methods**:
- `recordFeatureUsage(feature, inputSize?, usageType?, metadata?)` - Now requires input_size and usage_type

### 2. useFeatureAvailability Hook
**Updated Hook**:
- `recordUsage(feature, inputSize?, usageType?, metadata?)` - New parameters

### 3. UsageDashboard Component
**Now Uses**:
- `getDashboard()` for single API call
- Shows correct `percentage_used` from API
- Displays all billing information

---

## Migration from Old Code

If you have existing code using the old system:

### Before
```typescript
// Old way - 2 API calls
const status = await subscriptionService.getSubscriptionStatus();
const stats = await subscriptionService.getUsageStatistics();
```

### After
```typescript
// New way - 1 API call
const dashboard = await subscriptionService.getDashboard();

// Access same data:
dashboard.plan                    // plan name
dashboard.billing.subscription_status  // status
dashboard.features.quiz.used      // usage count
dashboard.features.quiz.limit     // limit
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Request successful (check `success` field) |
| 400 | Invalid JSON or missing field |
| 401 | Missing or invalid auth header |
| 404 | User or resource not found |
| 500 | Server error |

---

## Complete Example: Multiple Features

```typescript
export const MainScreen = () => {
  const { checkFeature, recordUsage } = useFeatureAvailability();
  
  const handleFeature = async (featureName: string) => {
    // BEFORE: Check availability
    const allowed = await checkFeature(featureName);
    if (!allowed) {
      showUpgradeDialog();
      return;
    }
    
    // DURING: Execute feature
    try {
      const result = await executeFeature(featureName);
      
      // AFTER: Record usage
      await recordUsage(
        featureName,
        calculateSize(result),
        'text',
        { timestamp: new Date() }
      );
      
      showSuccess('Feature used successfully');
    } catch (error) {
      showError(error.message);
    }
  };
  
  return (
    <ScrollView>
      <Button onPress={() => handleFeature('quiz')} title="Quiz" />
      <Button onPress={() => handleFeature('flashcards')} title="Flashcards" />
      <Button onPress={() => handleFeature('mock_test')} title="Mock Test" />
      <Button onPress={() => handleFeature('ask_question')} title="Ask Question" />
    </ScrollView>
  );
};
```

---

## Checklist for Integration

- [ ] Update all feature execution code to check before and record after
- [ ] Replace old `getSubscriptionStatus()` + `getUsageStatistics()` with `getDashboard()`
- [ ] Pass `input_size` and `usage_type` when recording usage
- [ ] Test with all features (quiz, flashcards, etc.)
- [ ] Verify upgrade dialog shows when limit is reached
- [ ] Test independent feature limits (quiz limit shouldn't affect flashcards)
- [ ] Test unlimited user can access all features
- [ ] Monitor console for any API errors

---

## Support

For issues or questions:
1. Check API_ALIGNMENT_UPDATE.md for detailed changes
2. Review console logs for specific error messages
3. Verify backend is returning correct response format
4. Check authentication headers are being sent correctly

