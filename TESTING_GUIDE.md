# Testing Guide: Subscription System & Predicted Questions

## Pre-Testing Setup

### 1. Backend Verification
Ensure these endpoints are available and working:

```bash
# Check subscription plans endpoint
curl -X GET "http://your-backend/api/subscriptions/plans/" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check subscription status endpoint
curl -X GET "http://your-backend/api/subscriptions/status/?user_id=test_user" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check predicted questions endpoint (FIXED)
curl -X POST "http://your-backend/api/predicted-questions/generate/" \
  -F "document=@test_image.jpg" \
  -F "exam_type=physics" \
  -F "num_questions=5" \
  -F "language=english" \
  -F "user_id=test_user" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Data Setup

Create test users with different subscription states:

| User ID | State | Expected Behavior |
|---------|-------|-------------------|
| `test_free_user` | No subscription | Blocked from flashcards/predicted questions |
| `test_trial_user` | Active trial (days_remaining > 0) | Can access features |
| `test_expired_trial` | Expired trial (days_remaining = 0) | Blocked from features |
| `test_paid_user` | Active paid subscription | Can access all features |

## Test Scenarios

### Scenario 1: Unsubscribed User Blocked

**Steps**:
1. Login as `test_free_user` (no subscription)
2. Navigate to Flashcards section
3. Click "Generate from Image"
4. Select an image
5. Observe: **Alert should appear** "Flashcard generation is a premium feature. Please subscribe to access it."
6. Click "View Plans" → Should navigate to pricing page

**Expected Result**: ✅ User cannot generate flashcards, sees premium alert

**Logs Expected**:
```
[Subscription] Checking subscription status for user: test_free_user
[Subscription] Checking status for user: test_free_user
[Subscription] Status response: {is_active: false, is_trial: false, ...}
[Subscription] Premium feature access for test_free_user: false
```

### Scenario 2: Trial User Can Access

**Steps**:
1. Login as `test_trial_user` (7-day trial, days_remaining: 5)
2. Navigate to Predicted Questions section
3. Click "Generate from Image"
4. Upload an image
5. Observe: **Request should proceed** (no blocking alert)

**Expected Result**: ✅ User can generate predictions, processing begins

**Logs Expected**:
```
[Subscription] Premium feature access for test_trial_user: true
[Subscription] Status response: {is_trial: true, days_remaining: 5, ...}
[PredictedQuestions] Starting image-based generation from: ...
[PredictedQuestions] POST /predicted-questions/generate/ with FormData - exam_type: general num_questions: 3
```

### Scenario 3: Expired Trial Blocked

**Steps**:
1. Login as `test_expired_trial` (trial ended, days_remaining: 0)
2. Navigate to Flashcards
3. Click "Generate from Text"
4. Enter topic
5. Observe: **Alert should appear** (same as unsubscribed)

**Expected Result**: ✅ User blocked despite being past trial period

**Logs Expected**:
```
[Subscription] Premium feature access for test_expired_trial: false
[Subscription] Status response: {is_trial: true, days_remaining: 0, ...}
```

### Scenario 4: Predicted Questions Endpoint Fixed

**Steps**:
1. Login as `test_trial_user`
2. Go to Predicted Questions
3. Upload an image
4. Observe network request in DevTools

**Expected FormData**:
```
document: [File object or URI]
exam_type: "general"              ← FIXED (was "difficulty")
num_questions: "3"
language: "english"               ← ADDED (was missing)
user_id: "test_trial_user"
```

**Expected Response**:
```json
{
  "success": true,
  "title": "Predicted Important Questions - ...",
  "exam_type": "physics",
  "key_definitions": [...],
  "topic_outline": {...},
  "questions": [...],
  "total_questions": 5
}
```

**Expected Result**: ✅ Questions generated without "Invalid parameter" error

### Scenario 5: Flashcards Response Parsing

**Steps**:
1. Login as paid user
2. Generate flashcards from image
3. Check response in network tab
4. Verify UI displays cards correctly

**Expected Network Response**:
```json
{
  "success": true,
  "data": {
    "title": "Flashcard Set - Biology",
    "topic": "Photosynthesis",
    "language": "english",
    "total_cards": 3,
    "cards": [
      {
        "id": 1,
        "question": "What is photosynthesis?",
        "answer": "Process of converting light energy to chemical energy",
        "category": "Basics",
        "difficulty": "easy"
      }
    ]
  }
}
```

**Expected Result**: ✅ Cards display in UI without parsing errors

### Scenario 6: Subscription Cache

**Steps**:
1. Login as `test_trial_user`
2. Go offline (disconnect network)
3. Try to generate flashcards
4. Observe alert behavior

**Expected Result**: ✅ Should use cached subscription status (or show network error gracefully)

**Logs Expected**:
```
[Subscription] Using cached status for test_trial_user
```

### Scenario 7: Logout Clears Cache

**Steps**:
1. Login as `test_trial_user` (generates cache)
2. Navigate around app
3. Click Logout
4. Login as `test_free_user`
5. Try to generate flashcards

**Expected Result**: ✅ Should use new user's subscription status (not old cache)

**Logs Expected**:
```
[Subscription] Cleared cache for test_trial_user
[Subscription] Checking status for user: test_free_user
```

## Edge Case Tests

### Edge Case 1: Network Error During Status Check

**Simulate**: Backend returns 500 error

**Expected Behavior**:
- Logs error but doesn't crash
- Defaults to blocking access (safe default)
- Shows alert: "Failed to check subscription status"

**Code Path**:
```typescript
catch (error) {
  console.error('[Subscription] Error checking premium access:', error);
  return false;  // ← Deny access on error
}
```

### Edge Case 2: Guest User

**Setup**: User as 'guest_user' (no account)

**Expected Behavior**:
- Should be blocked from premium features
- Clicking "View Plans" navigates to pricing
- After login, access is restored

### Edge Case 3: Missing Response Fields

**Simulate**: Backend returns incomplete status

**Expected Behavior**:
- Check if critical fields exist: `is_active`, `is_trial`, `days_remaining`
- Should not crash if `features` or `message` missing
- Logs warning but continues

## Performance Tests

### Test 1: Caching Response Time

**Steps**:
1. Login and trigger subscription check (populates cache)
2. Open DevTools network tab
3. Generate flashcards (should use cache, no network call)
4. Verify API call is NOT made on second generation

**Expected**: ✅ No `/subscriptions/status/` API call on cached check

### Test 2: Timeout Handling

**Steps**:
1. Slow down network in DevTools (2G/slow 4G)
2. Try to generate predicted questions
3. Wait for 120-second timeout
4. Should show error alert after 120 seconds

**Expected**: ✅ Respects 120-second timeout without hanging

## Integration Tests

### Test 1: Full Premium Feature Flow

**Steps**:
1. Login as free user
2. Try to generate flashcards → Blocked ✓
3. Click "View Plans"
4. Complete subscription flow (mock payment)
5. Logout and login
6. Try to generate flashcards → Works ✓

### Test 2: Trial Expiry Flow

**Steps**:
1. Login as trial user with 1 day remaining
2. Generate flashcards → Works ✓
3. Admin/backend: Advance time to expire trial
4. Refresh subscription status
5. Try to generate flashcards → Blocked ✓

### Test 3: Subscription Confirmation

**Steps**:
1. Login as free user
2. Click "View Plans" → Pricing page
3. Select plan → Payment modal
4. Complete payment (mock Razorpay)
5. Confirm payment
6. Back to app
7. Try to generate flashcards → Works ✓

## Manual Verification Checklist

### Code Changes
- [ ] `subscriptionService.ts` - No TypeScript errors
- [ ] `App.tsx` - No TypeScript errors in modified handlers
- [ ] `api.ts` - Predicted questions uses `exam_type` not `difficulty`
- [ ] All 6 handlers check subscription before API call
- [ ] All handlers show premium alert if not subscribed

### Runtime Behavior
- [ ] Unsubscribed users blocked from flashcards
- [ ] Unsubscribed users blocked from predicted questions
- [ ] Trial users with remaining days can access features
- [ ] Expired trial users blocked from features
- [ ] "View Plans" button navigates to pricing
- [ ] Subscription status cached in AsyncStorage
- [ ] Cache cleared on logout
- [ ] No crashes on network errors

### API Contracts
- [ ] Predicted questions FormData has: document, exam_type, num_questions, language, user_id
- [ ] Predicted questions response NOT wrapped (top-level `success`, `questions[]`)
- [ ] Flashcards response IS wrapped (`data: {cards[]}`)
- [ ] No "Invalid parameter" errors from backend

### User Experience
- [ ] Clear alert messages for blocked features
- [ ] Easy navigation to pricing from alert
- [ ] No UI glitches during feature gating checks
- [ ] Smooth handling of slow network
- [ ] No loading spinners that hang indefinitely

## Debug Commands

### Check Subscription Status
```typescript
// In browser console
import { canAccessPremiumFeature } from './src/services/subscriptionService';
await canAccessPremiumFeature('user123');
// Returns: true/false
```

### View Cached Status
```typescript
// In browser console
import AsyncStorage from '@react-native-async-storage/async-storage';
const cached = await AsyncStorage.getItem('subscription_status_user123');
console.log(JSON.parse(cached));
```

### Clear Cache
```typescript
import { clearSubscriptionCache } from './src/services/subscriptionService';
await clearSubscriptionCache('user123');
```

### Monitor API Calls
```bash
# In DevTools Network tab, filter by:
/subscriptions/status/
/subscriptions/plans/
/predicted-questions/generate/
/flashcards/generate/
```

## Reporting Issues

If tests fail, collect:

1. **Console logs** - Look for `[Subscription]`, `[PredictedQuestions]`, `[Flashcards]` prefixes
2. **Network tab** - Check request/response payloads
3. **AsyncStorage** - Check cached data
4. **Error stack trace** - Full error message with line numbers
5. **Device info** - Platform (web/iOS/Android), browser, OS version

---

**Status**: Ready for comprehensive testing
**Test Duration**: Estimate 2-3 hours for full coverage
**Priority**: Critical path is Scenarios 1-4, Edge Cases 1-2
