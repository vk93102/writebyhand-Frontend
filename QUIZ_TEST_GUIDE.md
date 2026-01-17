# Quick Test Checklist - Quiz Session Cookie Fix

## ✅ What Was Fixed

Added automatic session cookie management to handle Django's session-based authentication:
- Response interceptor extracts `Set-Cookie: sessionid=...` header from GET responses
- Request interceptor automatically adds `Cookie: sessionid=...` header to POST requests
- Session cookie is stored in AsyncStorage and persists across app navigation

## 🧪 How to Test

### Test 1: Basic Quiz Submission
1. Run the app
2. Navigate to Daily Quiz
3. Select a language (English/Hindi/etc)
4. Click "Start Quiz"
5. Answer all questions
6. Click "Submit"
7. **Expected:** See results with coins earned (not "Quiz session expired" error)

### Test 2: Check Console Logs
When submitting a quiz, you should see in console:
```
[API] Storing session cookie: g0uy5krkjebgpnz39rez81z2bempy9mh
[API] Adding session cookie to request
```

### Test 3: Multiple Quizzes
1. Submit one quiz successfully
2. Navigate away and back
3. Start another quiz (same or different language)
4. Submit it
5. **Expected:** Both submit successfully

### Test 4: Different Languages
Test with multiple languages to ensure sessionid works across languages:
- English Daily Quiz ✓
- Hindi Daily Quiz ✓
- Other languages if available ✓

## 🔍 Debugging If Issues Persist

### Check if interceptors are running:
```typescript
// In any component after making a quiz request
import { getDailyQuiz } from './src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sessionId = await AsyncStorage.getItem('QUIZ_SESSION_COOKIE');
console.log('Current Session ID:', sessionId);
```

### Monitor network requests:
- Enable network debugging in Expo DevTools
- Look for `Cookie:` header in POST request to `/quiz/daily-quiz/submit/`
- Verify it contains `sessionid=...`

### Check AsyncStorage:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const keys = await AsyncStorage.getAllKeys();
const sessionKey = keys.find(k => k.includes('QUIZ_SESSION'));
if (sessionKey) {
  const value = await AsyncStorage.getItem(sessionKey);
  console.log('Session Cookie:', value);
}
```

## 📋 Expected Behavior

**Before Fix:**
```
POST /api/quiz/daily-quiz/submit/
Status: 400
Response: {"error": "Quiz session expired"}
```

**After Fix:**
```
GET /api/quiz/daily-quiz/
Response Headers: Set-Cookie: sessionid=abc123...
↓ Interceptor saves sessionid ↓

POST /api/quiz/daily-quiz/submit/
Request Headers: Cookie: sessionid=abc123
Status: 200
Response: {
  "success": true,
  "message": "Quiz submitted! You got 3/5 correct and earned 30 coins.",
  "correct_count": 3,
  "results": [...]
}
```

## 🚀 Next Steps

1. Rebuild and run the app
2. Test quiz submission with the checklist above
3. Monitor console for `[API]` logs
4. If successful, quiz feature is complete!

## 📝 Changes Made

**File:** `src/services/api.ts`
- Lines 12-53: Session cookie management with interceptors
- Added constants and AsyncStorage integration
- Automatic session extraction from responses
- Automatic session injection into requests

**Documentation:** `QUIZ_COOKIES_FIX.md`
- Complete explanation of the fix
- How session management works
- Testing results and verification

---

✅ **Ready to Test!**