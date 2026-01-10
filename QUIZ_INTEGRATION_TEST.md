# Quiz Integration Testing Guide

**Date:** January 10, 2026  
**Status:** Ready for Testing  
**Backend:** ed-tech-backend-tzn8.onrender.com/api

## Integration Changes Made

### 1. Fixed Imports in App.tsx
**Before:**
```typescript
import { generateQuiz, ... } from './src/services/api';
```

**After:**
```typescript
import { generateQuiz, createQuiz, getQuizQuestions, submitQuiz, getQuizResults } from './src/services/quiz';
```

### 2. Updated quiz.ts Service
- Removed separate axios instance
- Now uses shared `api` instance from `api.ts`
- Automatically includes:
  - X-User-ID header via interceptor
  - Bearer token authentication
  - Proper error handling
  - Response/error logging

### 3. Enhanced handleGenerateQuiz in App.tsx
- Added console logging for debugging
- Proper response parsing
- Correct error handling

### 4. Key Features
✅ X-User-ID header auto-injected by api.ts interceptor  
✅ Console logging for debugging  
✅ Proper response data extraction  
✅ Extended timeout (120s) for AI operations  
✅ Comprehensive error messages  

---

## Testing Steps

### Step 1: Verify X-User-ID Header

**Test:** Login and check Network tab

```
1. Open DevTools (F12)
2. Go to Network tab
3. Login to the app
4. Make any API call
5. Check request headers for X-User-ID
```

**Expected:**
- Request Headers include: `X-User-ID: user_123`
- Response status: 200 (not 401)

**Console Output Should Show:**
```
[Quiz] Generating quiz from topic: "Python basics"...
[Quiz Service] generateQuiz called with: {topic, numQuestions, difficulty}
```

---

### Step 2: Test Generate Quiz Endpoint

**Test:** Generate a simple quiz

```
1. Navigate to Quiz section
2. Enter topic: "Python basics"
3. Click "Solve Question" button
4. Observe Network tab and Console
```

**Network Tab Should Show:**
```
POST /quiz/generate/
Headers:
  - X-User-ID: user_123
  - Authorization: Bearer [token]
  - Content-Type: application/json

Body:
  {
    "topic": "Python basics",
    "num_questions": 5,
    "difficulty": "medium"
  }

Response Status: 200 OK
Response Body:
  {
    "success": true,
    "questions": [...]
  }
```

**Console Output Should Show:**
```
[Quiz] Generating quiz from topic: "Python basics" with 5 questions, difficulty: medium
[Quiz Service] generateQuiz called with: {
  topic: "Python basics",
  numQuestions: 5,
  difficulty: "medium"
}
[Quiz Service] generateQuiz response: {
  success: true,
  questions: [...]
}
```

---

### Step 3: Test Create Quiz (Document Upload)

**Test:** Upload a document and generate quiz

```
1. Navigate to Quiz section
2. Click "Document Upload" tab
3. Upload a text file with content
4. Click "Solve Question" button
5. Check Network tab and Console
```

**Network Tab Should Show:**
```
POST /quiz/create/
Headers:
  - X-User-ID: user_123
  - Authorization: Bearer [token]

Body:
  {
    "transcript": "[file content...]",
    "title": "Quiz from document.txt",
    "source_type": "text",
    "source_id": "file_[timestamp]",
    "num_questions": 5,
    "difficulty": "medium"
  }

Response Status: 200 OK
Response Body:
  {
    "success": true,
    "quiz_id": "quiz_xyz123",
    "questions": [...]
  }
```

---

### Step 4: Manual API Testing with cURL

**Test 1: Generate Quiz**
```bash
curl -X POST https://ed-tech-backend-tzn8.onrender.com/api/quiz/generate/ \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test_user_123" \
  -d '{
    "topic": "Python programming basics",
    "num_questions": 3,
    "difficulty": "easy"
  }' \
  -w "\nStatus: %{http_code}\n"
```

**Expected Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q1",
      "question": "What is Python?",
      "options": [...],
      "correct_answer": "opt1",
      "explanation": "...",
      "difficulty": "easy"
    }
  ]
}
Status: 200
```

**Test 2: Create Quiz**
```bash
curl -X POST https://ed-tech-backend-tzn8.onrender.com/api/quiz/create/ \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test_user_123" \
  -d '{
    "transcript": "Photosynthesis is the process by which plants convert light energy into chemical energy...",
    "title": "Photosynthesis Quiz",
    "source_type": "text",
    "source_id": "test_doc_001",
    "num_questions": 3,
    "difficulty": "medium"
  }' \
  -w "\nStatus: %{http_code}\n"
```

**Expected Response:**
```json
{
  "success": true,
  "quiz_id": "quiz_abc123",
  "title": "Photosynthesis Quiz",
  "questions": [...]
}
Status: 200
```

**Test 3: Get Quiz Details**
```bash
curl -X GET https://ed-tech-backend-tzn8.onrender.com/api/quiz/quiz_abc123/ \
  -H "X-User-ID: test_user_123" \
  -w "\nStatus: %{http_code}\n"
```

**Expected Response:**
```json
{
  "quiz_id": "quiz_abc123",
  "title": "Photosynthesis Quiz",
  "questions": [...]
}
Status: 200
```

**Test 4: Submit Quiz**
```bash
curl -X POST https://ed-tech-backend-tzn8.onrender.com/api/quiz/quiz_abc123/submit/ \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test_user_123" \
  -d '{
    "session_id": "session_1234567890",
    "responses": {
      "q1": "opt1",
      "q2": "opt2",
      "q3": "opt1"
    }
  }' \
  -w "\nStatus: %{http_code}\n"
```

**Expected Response:**
```json
{
  "response_id": "resp_xyz789",
  "score": 2,
  "correct_answers": 2,
  "total_questions": 3,
  "percentage": 67,
  "analysis": {
    "by_difficulty": {...}
  }
}
Status: 200
```

**Test 5: Get Results**
```bash
curl -X GET https://ed-tech-backend-tzn8.onrender.com/api/quiz/resp_xyz789/results/ \
  -H "X-User-ID: test_user_123" \
  -w "\nStatus: %{http_code}\n"
```

---

## Console Logging Reference

### When generating quiz, you should see:

```
[Quiz] Generating quiz from topic: "Python basics" with 5 questions, difficulty: medium
[Quiz Service] generateQuiz called with: {topic: "Python basics", numQuestions: 5, difficulty: "medium"}
[Quiz Service] generateQuiz response: {success: true, data: {...}, questions: Array(5)}
[Quiz] Setting quiz data: {title: "Quiz: Python basics", topic: "Python basics", difficulty: "medium", questions: Array(5)}
```

### If there's an error:

```
[Quiz] Error generating quiz: Error: Request failed with status code 400
[Quiz Service] generateQuiz error: Topic must be at least 10 characters {error: "...", details: "..."}
```

---

## Debugging Checklist

### If endpoints are not being hit:

- [ ] Check Network tab shows POST requests to `/quiz/generate/`
- [ ] Check request headers include `X-User-ID`
- [ ] Check response status (should be 200, 201, or 4xx/5xx with details)
- [ ] Check console for error messages
- [ ] Verify backend is running: curl https://ed-tech-backend-tzn8.onrender.com/api/health

### If data is not showing in quiz component:

- [ ] Check console for "Setting quiz data:"
- [ ] Verify response.data contains "questions" array
- [ ] Check quiz component error state displays

### If answers not submitting:

- [ ] Ensure quiz_id is captured from create/get response
- [ ] Verify responses object format: `{ "q1": "opt1", "q2": "opt2" }`
- [ ] Check response status on submit
- [ ] Look for response_id in response

---

## Performance Metrics Expected

| Endpoint | Time | Status |
|----------|------|--------|
| Generate | 2-3s | 200 |
| Create | 3-5s | 200 |
| Get Details | <500ms | 200 |
| Submit | 1-2s | 200 |
| Get Results | <500ms | 200 |

---

## Common Issues & Solutions

### Issue: `[Quiz Service] generateQuiz error: Topic must be at least 10 characters`

**Solution:** Backend requires topic to be at least 10 characters  
**Test with:** "Python programming basics" instead of "Python"

### Issue: `[Quiz] Setting quiz data: {... questions: []}`

**Solution:** Response format may be wrapped  
**Check:** Response should have `data.questions` or direct `questions` array

### Issue: Status 401 Unauthorized

**Solution:** X-User-ID header not being sent  
**Verify:** Login successful, setUserId() was called  
**Check:** Network tab shows X-User-ID header on request

### Issue: Status 429 - AI Quota Exceeded

**Solution:** Too many requests to AI service  
**Action:** Wait for retry-after duration before retrying

---

## Success Criteria

✅ All 5 quiz endpoints respond with 200 status  
✅ X-User-ID header present in all requests  
✅ Questions display in quiz component  
✅ Console shows proper logging  
✅ Responses are properly parsed  
✅ Error messages display on failures  
✅ Load times within expected ranges  

---

## Files Modified

1. **App.tsx** (Lines 42-43)
   - Changed imports to use quiz.ts service
   - Updated handleGenerateQuiz with logging
   - Updated handleGenerateQuizFromFile with proper API call

2. **src/services/quiz.ts** (All functions)
   - Added `import { api } from './api'`
   - Replaced axios instances with shared api instance
   - Added console logging to all endpoints
   - Maintained 120s timeout for AI operations

3. **src/services/api.ts** (Line 1270)
   - Added `export { api }` for named export

---

## Next Steps After Testing

1. Run all 5 cURL tests above
2. Test in app with text input
3. Test with document upload
4. Verify X-User-ID header in Network tab
5. Check console for all logging
6. Verify quiz component displays correctly
7. Test answer submission and results
8. Deploy to staging
9. Monitor logs and performance
10. Deploy to production

---

## Support

For issues or questions:
1. Check console logs first
2. Check Network tab for actual requests
3. Verify backend is running
4. Test with cURL commands
5. Check error response details

**Backend URL:** https://ed-tech-backend-tzn8.onrender.com/api  
**API Timeout:** 120 seconds for quiz operations  
**Auth Header:** X-User-ID (auto-injected by api.ts)
