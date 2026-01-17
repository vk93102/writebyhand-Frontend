# Quiz Submission Session Cookie Fix

## Problem: "Quiz session expired" 400 Error

The quiz submission was failing with **"Quiz session expired"** despite:
- ✅ Correct endpoint URL: `/api/quiz/daily-quiz/submit/`
- ✅ Correct payload format
- ✅ Valid quiz_id from GET response
- ✅ Valid JWT token
- ✅ Proper user_id and answers

**Root Cause:** Backend uses Django sessions with HTTP-only cookies. The flow is:
1. GET `/api/quiz/daily-quiz/` → Backend returns `Set-Cookie: sessionid=...`
2. POST `/api/quiz/daily-quiz/submit/` → Backend requires `Cookie: sessionid=...` header

React Native doesn't automatically manage cookies like browsers do, so we needed to manually handle them.

## Solution Implemented

**File:** `src/services/api.ts` (Lines 12-48)

### 1. Enable Credentials
```typescript
const api = axios.create({
  // ...
  withCredentials: true, // Enable cookie handling
});
```

### 2. Extract & Store Session Cookie from Responses
```typescript
api.interceptors.response.use((response) => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie && typeof setCookie === 'string') {
    const sessionMatch = setCookie.match(/sessionid=([^;]+)/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      // Store in AsyncStorage for later use
      AsyncStorage.setItem(SESSION_COOKIE_KEY, sessionId);
    }
  }
  return response;
});
```

### 3. Add Stored Session Cookie to Requests
```typescript
api.interceptors.request.use(async (config) => {
  const sessionId = await AsyncStorage.getItem(SESSION_COOKIE_KEY);
  if (sessionId) {
    // Add to Cookie header on all requests
    config.headers['Cookie'] = `sessionid=${sessionId}`;
  }
  return config;
});
```

## How It Works

**Flow:** 
1. App calls `getDailyQuiz()` (GET)
   - Backend returns quiz data + `Set-Cookie: sessionid=abc123`
   - Response interceptor extracts and saves sessionid to AsyncStorage
   
2. User answers questions and calls `submitDailyQuiz()` (POST)
   - Request interceptor retrieves sessionid from AsyncStorage
   - Adds `Cookie: sessionid=abc123` header to request
   - Backend validates session and accepts submission
   - Response returns results and coins earned

## Testing & Verification

Tested with curl:
```bash
# GET with session capture
curl -D headers.txt https://ed-tech-backend-tzn8.onrender.com/api/quiz/daily-quiz/
# Extract: sessionid=g0uy5krkjebgpnz39rez81z2bempy9mh

# POST with session cookie
curl -H "Cookie: sessionid=g0uy5krkjebgpnz39rez81z2bempy9mh" \
     -d "{...quiz submission...}" \
     https://ed-tech-backend-tzn8.onrender.com/api/quiz/daily-quiz/submit/

# Result: ✅ SUCCESS - returns scores and coins
```

## Key Features

✅ **Automatic Session Management**
- No manual cookie handling needed in components
- Interceptors handle it transparently

✅ **Persistent Sessions**
- Session stored in AsyncStorage
- Survives app navigation and background

✅ **React Native Compatible**
- Works in Expo and native React Native
- No browser-specific cookie APIs

✅ **Logging**
- Console logs for debugging
- Easy to trace session issues

## Troubleshooting

If still getting "Quiz session expired":

1. **Check AsyncStorage**
   ```typescript
   const sessionId = await AsyncStorage.getItem('QUIZ_SESSION_COOKIE');
   console.log('Stored Session:', sessionId);
   ```

2. **Verify Interceptors Running**
   - Check console for `[API]` log messages
   - Confirm "Adding session cookie to request" appears

3. **Check Backend Logs**
   - Verify session is created on GET
   - Check if session expires too quickly
   - Verify POST request includes Cookie header

## Related Code

- **GET Quiz:** `getDailyQuiz()` in api.ts
- **Submit Quiz:** `submitDailyQuiz()` in api.ts  
- **Quiz Screen:** `src/components/DailyQuizScreen.tsx`

## Dependencies

- `axios` - HTTP client with interceptor support
- `@react-native-async-storage/async-storage` - Session storage
- React Native/Expo platform

---

**Status:** ✅ COMPLETE - Ready for testing
