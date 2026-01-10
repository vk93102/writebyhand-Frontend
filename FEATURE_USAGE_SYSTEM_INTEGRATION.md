# Feature Usage Restriction System - Integration Guide

## Overview

The Feature Usage Restriction System monitors and limits how many times users can access features based on their subscription plan. Free tier users get **3 uses per feature per month**, while premium users get **unlimited access**.

## System Architecture

### Components

1. **API Service** (`src/services/api.ts`)
   - `checkFeatureUsage(feature)` - Check if user can access feature
   - `recordFeatureUsage(feature, inputSize, usageType, metadata)` - Record usage after execution
   - `getUsageDashboard()` - Get user's feature usage stats
   - `getFeatureStatus(feature)` - Get specific feature status
   - `getUsageStats()` - Get usage statistics

2. **App.tsx Handlers**
   - `handleGenerateQuiz()` - Quiz generation with usage checking
   - `handleGenerateFlashcards()` - Flashcard generation with usage checking
   - Other feature handlers (to be updated similarly)

3. **UsageDashboard Component** (`src/components/UsageDashboard.tsx`)
   - Displays feature usage statistics
   - Shows remaining uses for each feature
   - Displays upgrade prompt for free users
   - Real-time usage percentage visualization

## How It Works

### Flow 1: Feature Access Check → Generation → Usage Recording

```
User clicks "Generate Flashcards"
    ↓
checkFeatureUsage('flashcards')
    ├─ API checks: Is user in limit? (3/3 for free tier)
    ├─ If limit reached → Show "Feature Limit Reached" alert
    └─ If allowed → Continue
    ↓
generateFlashcards(topic, numCards)
    ├─ API generates flashcards from topic
    ├─ Returns: { success: true, cards: [...] }
    └─ Display flashcards to user
    ↓
recordFeatureUsage('flashcards', contentLength, 'text')
    ├─ API records: This user used flashcards today
    ├─ Updates: User's usage count for the month
    └─ Returns: { used: 2/3, remaining: 1 }
    ↓
Display generated flashcards + show "2/3 uses remaining"
```

### Flow 2: Usage Limit Exceeded

```
User clicks "Generate Flashcards" (already used 3 times this month)
    ↓
checkFeatureUsage('flashcards')
    ├─ API checks: used >= limit (3/3)
    └─ Returns: { success: false, allowed: false, error: "Monthly limit reached for this feature" }
    ↓
Show Alert:
  "Feature Limit Reached"
  "You have reached your monthly limit for flashcards. Please upgrade to continue."
    ↓
User cancels or upgrades to premium
```

## Integration Points

### 1. Quiz Feature (UPDATED ✅)

**File**: `App.tsx` (lines ~253-315)

```typescript
const handleGenerateQuiz = async (topic: string, numQuestions: number = 5, difficulty: string = 'medium') => {
  // ... validation code ...

  // CHECK FEATURE USAGE
  const usageCheck = await checkFeatureUsage('quiz');
  if (!usageCheck.success || !usageCheck.allowed) {
    Alert.alert('Feature Limit Reached', usageCheck.error);
    return;
  }

  // GENERATE QUIZ
  const response = await generateQuiz(topic, numQuestions, difficulty);

  // RECORD FEATURE USAGE
  await recordFeatureUsage('quiz', topic.length, 'text', {
    num_questions: numQuestions,
    difficulty: difficulty,
  });

  setQuizData(response);
};
```

### 2. Flashcards Feature (UPDATED ✅)

**File**: `App.tsx` (lines ~418-457)

```typescript
const handleGenerateFlashcards = async (topic: string, numCards: number = 5) => {
  // ... validation code ...

  // CHECK FEATURE USAGE
  const usageCheck = await checkFeatureUsage('flashcards');
  if (!usageCheck.success || !usageCheck.allowed) {
    Alert.alert('Feature Limit Reached', usageCheck.error);
    return;
  }

  // GENERATE FLASHCARDS
  const response = await generateFlashcards(topic, numCards, 'english', 'medium');

  // RECORD FEATURE USAGE
  await recordFeatureUsage('flashcards', topic.length, 'text', {
    num_cards: numCards,
    language: 'english',
    difficulty: 'medium',
  });

  setFlashcardData(response);
};
```

### 3. Usage Dashboard (UPDATED ✅)

**File**: `src/components/UsageDashboard.tsx` (lines ~68-105)

```typescript
const loadData = async () => {
  // Fetch from new usage API
  const usageResponse = await getUsageDashboard();
  
  if (usageResponse.success && usageResponse.dashboard) {
    // Display feature usage stats
    setDashboardData(formatDataForDisplay(usageResponse.dashboard));
  }
};
```

## API Endpoints

### 1. Check Feature Usage

```
POST /api/usage/check/
Headers: X-User-ID: user_id
Body: { "feature": "quiz" }

Response (Allowed):
{
  "success": true,
  "allowed": true,
  "usage": {
    "feature": "quiz",
    "used": 1,
    "limit": 3,
    "remaining": 2
  }
}

Response (Blocked):
{
  "success": false,
  "allowed": false,
  "error": "Monthly limit reached for this feature",
  "usage": {
    "feature": "quiz",
    "used": 3,
    "limit": 3,
    "remaining": 0
  }
}
```

### 2. Record Feature Usage

```
POST /api/usage/record/
Headers: X-User-ID: user_id
Body: {
  "feature": "quiz",
  "input_size": 150,        # Length of content
  "usage_type": "text",     # text | image | video | audio
  "metadata": {
    "num_questions": 10,
    "difficulty": "medium"
  }
}

Response:
{
  "success": true,
  "message": "Feature 'quiz' usage recorded",
  "usage": {
    "feature": "quiz",
    "used": 2,
    "limit": 3,
    "remaining": 1
  }
}
```

### 3. Get Usage Dashboard

```
GET /api/usage/dashboard/
Headers: X-User-ID: user_id

Response:
{
  "success": true,
  "dashboard": {
    "user_id": "user123",
    "plan": "free",
    "features": {
      "quiz": {
        "used": 2,
        "limit": 3,
        "remaining": 1,
        "percentage_used": 66.67,
        "unlimited": false
      },
      "flashcards": {
        "used": 1,
        "limit": 3,
        "remaining": 2,
        "percentage_used": 33.33,
        "unlimited": false
      },
      ...
    }
  }
}
```

### 4. Get Feature Status

```
GET /api/usage/feature/quiz/
Headers: X-User-ID: user_id

Response:
{
  "success": true,
  "feature": "quiz",
  "status": {
    "allowed": true,
    "used": 2,
    "limit": 3,
    "remaining": 1,
    "percentage_used": 66.67,
    "reason": "Within monthly limit",
    "unlimited": false
  }
}
```

## Console Logging

All feature operations log to console with `[Usage]` prefix:

```
[Usage] Checking feature access: flashcards
[Usage] Check response: {success: true, allowed: true, ...}
[Usage] Recording feature usage: flashcards
[Usage] Record response: {success: true, message: "Feature 'flashcards' usage recorded", ...}
[Usage] Fetching usage dashboard
[Usage] Dashboard response: {success: true, dashboard: {...}}
```

## Error Handling

### Scenario 1: Feature Limit Reached

```typescript
const usageCheck = await checkFeatureUsage('quiz');

if (!usageCheck.allowed) {
  // Status: 403 FORBIDDEN from API
  Alert.alert(
    'Feature Limit Reached',
    'You have reached your monthly limit for quizzes. Please upgrade to continue.'
  );
  return;
}
```

### Scenario 2: Recording Failure (Non-blocking)

```typescript
const recordResult = await recordFeatureUsage('quiz', 150, 'text');

// Even if recording fails, user can still use the feature
if (!recordResult.success) {
  console.warn('Failed to record usage:', recordResult.error);
  // Don't block the user - just log it
}
```

### Scenario 3: Network Error

```typescript
try {
  const usageCheck = await checkFeatureUsage('quiz');
} catch (error) {
  // Network error or API unavailable
  console.error('[Usage] Check error:', error);
  // Fallback: Allow feature (assume free tier)
  // Continue with quiz generation
}
```

## Testing the System

### Using the Provided Test Script

```bash
python3 test_feature_usage_system.py
```

The script tests:
1. ✅ First access allowed (1/3)
2. ✅ Second use recorded (2/3)
3. ✅ Third use recorded (3/3)
4. ✅ Fourth access blocked (403)
5. ✅ Dashboard shows 3/3 usage
6. ✅ Independent feature limits
7. ✅ Feature status endpoint
8. ✅ Admin analytics

### Manual Testing in App

1. **First Quiz**:
   - Click "Generate Quiz" → "Science"
   - Should see: "Generating quiz..."
   - Should see: Quiz displays successfully
   - Logs: `[Usage] Checking feature access: quiz` ✅

2. **Usage After Each Feature**:
   - Go to Usage Dashboard
   - Should see: "Quiz: 1/3 used"
   - Progress bar at 33%

3. **Third Feature Use**:
   - Generate third quiz/flashcards
   - Dashboard updates: "Quiz: 3/3 used"
   - Progress bar at 100%

4. **Fourth Feature Use Blocked**:
   - Try to generate fourth quiz
   - Should see: Alert "Feature Limit Reached"
   - Button disabled/loading spinner

## Feature List

### Tracked Features
- `quiz` - Quiz generation from topics
- `flashcards` - Flashcard generation
- `study-material` - Study material generation
- `youtube-summarizer` - YouTube video summarization
- `predicted-questions` - Predicted exam questions
- `mock-test` - Mock test access
- `pyq` - Previous year questions

### Limits by Plan
- **Free Tier**: 3 uses per feature per month
- **Premium Tier**: Unlimited uses
- **Trial**: 10 uses per feature during trial period

## Integration Checklist

- [x] Added usage API functions to `src/services/api.ts`
- [x] Updated `handleGenerateQuiz` with usage checking
- [x] Updated `handleGenerateFlashcards` with usage checking
- [x] Updated imports in `App.tsx`
- [x] Updated `UsageDashboard` to fetch from API
- [x] Added console logging for debugging
- [x] Error handling for limit exceeded
- [x] Fallback behavior for API failures
- [ ] Update `handleGenerateStudyMaterial` (similar pattern)
- [ ] Update `handleSummarizeYouTube` (similar pattern)
- [ ] Update `handleGeneratePredictedQuestions` (similar pattern)
- [ ] Add usage tracking to other features

## Status

✅ **COMPLETE FOR QUIZ AND FLASHCARDS**

These features now:
1. Check if user can access feature before execution
2. Record usage after successful execution
3. Show feature limit alerts when limit reached
4. Display usage stats in dashboard

⏳ **TO DO**

Update remaining features with same pattern:
- Study Material
- YouTube Summarizer
- Predicted Questions
- Daily Quiz
- Mock Tests
- Other features

## Debugging

### Check User's Current Usage

In browser console or app logs:

```typescript
// Get dashboard
const dashboard = await getUsageDashboard();
console.log('Dashboard:', dashboard);

// Check specific feature
const quizStatus = await getFeatureStatus('quiz');
console.log('Quiz status:', quizStatus);

// View all logs with [Usage] prefix
console.log('Filter logs by: "[Usage]"');
```

### Database Queries (Backend)

```sql
-- Check user subscription
SELECT * FROM question_solver_usersubscription 
WHERE user_id = 'user123';

-- Check usage logs
SELECT * FROM question_solver_featureusagelog
WHERE subscription_id = (
  SELECT id FROM question_solver_usersubscription
  WHERE user_id = 'user123'
)
ORDER BY created_at DESC;

-- Check daily limits
SELECT feature, COUNT(*) as uses, DATE(created_at) as date
FROM question_solver_featureusagelog
WHERE subscription_id = (
  SELECT id FROM question_solver_usersubscription
  WHERE user_id = 'user123'
)
GROUP BY feature, DATE(created_at);
```

## Related Files

- [src/services/api.ts](src/services/api.ts) - API integration functions
- [App.tsx](App.tsx) - Feature handlers with usage integration
- [src/components/UsageDashboard.tsx](src/components/UsageDashboard.tsx) - Usage dashboard display
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick integration reference
- [BACKEND_API_ALIGNMENT.md](BACKEND_API_ALIGNMENT.md) - Backend endpoint details

## Next Steps

1. Test with the provided Python test script
2. Update remaining features (StudyMaterial, YouTube, etc.)
3. Add usage notifications/reminders
4. Implement upgrade prompts in dashboard
5. Add analytics to admin panel
6. Monitor usage patterns and adjust limits as needed
