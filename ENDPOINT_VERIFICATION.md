# Endpoint Verification Guide

## All Active Endpoints Being Called

### 1. **Flashcards Generation**
- **Endpoint:** `POST /flashcards/generate/`
- **Handler:** `handleGenerateFlashcards()` in [App.tsx](App.tsx#L459)
- **Service:** `generateFlashcards()` in [src/services/api.ts](src/services/api.ts#L318)

**Payload:**
```json
{
  "topic": "string",
  "num_cards": 5,
  "language": "english",
  "difficulty": "medium"
}
```

**Console Logging:**
```
[Flashcards] Checking feature usage for: <topic>
[Flashcards] Usage check response: {...}
[Flashcards] Feature usage allowed, calling endpoint: POST /flashcards/generate/ with payload: {...}
[API] generateFlashcards - Calling endpoint: POST /flashcards/generate/
[API] generateFlashcards - Payload: {...}
[API] generateFlashcards - Response status: 200
[API] generateFlashcards - Raw response: {...}
[API] generateFlashcards - Returning result with X cards
[Flashcards] API Response received: {...}
[Flashcards] Setting flashcard data with X cards
[Flashcards] Recording feature usage...
[Flashcards] Usage recorded successfully
```

**Error Handling:**
- ✅ Feature usage check fails gracefully (continues with `allowed: true` if endpoint returns 404/503)
- ✅ 429 (Quota Exceeded) - Shows retry message
- ✅ Any error - Shows detailed error alert with full error details logged

**Status:** ✅ Fully Functional - Ready to test

---

### 2. **Quiz Generation**
- **Endpoint:** `POST /quiz/generate/`
- **Handler:** `handleGenerateQuiz()` in [App.tsx](App.tsx#L253)
- **Service:** `generateQuiz()` in [src/services/quiz.ts](src/services/quiz.ts#L15)

**Payload:**
```json
{
  "topic": "string",
  "num_questions": 5,
  "difficulty": "medium"
}
```

**Console Logging:**
```
[Quiz] Checking feature usage for: <topic>
[Quiz] Usage check response: {...}
[Quiz] Feature usage allowed, calling endpoint: POST /quiz/generate/ with payload: {...}
[Quiz Service] generateQuiz endpoint called with: {...}
[Quiz Service] POST /quiz/generate/ - Payload: {...}
[Quiz Service] generateQuiz response status: 200
[Quiz Service] generateQuiz response data: {...}
[Quiz] API Response received: {...}
[Quiz] Generated X questions
[Quiz] Recording feature usage...
[Quiz] Usage recorded successfully
```

**Error Handling:**
- ✅ Feature usage check fails gracefully (continues with `allowed: true` if endpoint returns 404/503)
- ✅ 429 (Quota Exceeded) - Shows retry message
- ✅ 401 (Unauthorized) - Shows login required message
- ✅ Any error - Shows detailed error alert with full error details logged

**Status:** ✅ Fully Functional - Ready to test

---

### 3. **Feature Usage Check** (Optional Endpoint)
- **Endpoint:** `POST /usage/check/`
- **Service:** `checkFeatureUsage()` in [src/services/api.ts](src/services/api.ts#L1278)

**Behavior:**
- ✅ Returns permissive default (`allowed: true`) if endpoint returns 404 or 503
- ✅ Only blocks feature if explicitly denied (403)
- ✅ Won't break flashcard or quiz generation if missing

**Status:** ✅ Graceful Fallback - Non-critical

---

### 4. **Feature Usage Recording** (Non-blocking)
- **Endpoint:** `POST /usage/record/`
- **Service:** `recordFeatureUsage()` in [src/services/api.ts](src/services/api.ts#L1310)

**Behavior:**
- ✅ Called after successful generation
- ✅ Won't fail feature if recording fails
- ✅ Failures logged as warnings only

**Status:** ✅ Non-blocking - Won't affect feature availability

---

## How to Verify Endpoints Are Being Hit

### Step 1: Open Developer Console
1. Press `F12` or `Cmd+Option+I` (Mac) to open DevTools
2. Go to **Console** tab
3. Filter for `[API]`, `[Quiz]`, or `[Flashcards]` to see logs

### Step 2: Test Flashcards Generation
1. Navigate to Flashcards section
2. Enter a topic (e.g., "History")
3. Click Generate
4. **Check Console** - Should see:
   - `[Flashcards] Checking feature usage for: History`
   - `[Flashcards] Feature usage allowed, calling endpoint: POST /flashcards/generate/`
   - `[API] generateFlashcards - Calling endpoint: POST /flashcards/generate/`
   - `[API] generateFlashcards - Response status: 200`
   - `[Flashcards] Setting flashcard data with X cards`

5. **Check Network Tab** - Should see:
   - Request: `POST /flashcards/generate/`
   - Status: `200` (Success)
   - Payload: `{ topic: "History", num_cards: 5, language: "english", difficulty: "medium" }`

### Step 3: Test Quiz Generation
1. Navigate to Quiz section
2. Enter a topic (e.g., "Biology")
3. Select difficulty
4. Click Generate
5. **Check Console** - Should see:
   - `[Quiz] Checking feature usage for: Biology`
   - `[Quiz] Feature usage allowed, calling endpoint: POST /quiz/generate/`
   - `[Quiz Service] POST /quiz/generate/ - Payload: {...}`
   - `[Quiz] Generated X questions`

6. **Check Network Tab** - Should see:
   - Request: `POST /quiz/generate/`
   - Status: `200` (Success)
   - Payload: `{ topic: "Biology", num_questions: 5, difficulty: "medium" }`

---

## Troubleshooting

### Issue: Flashcards returning empty/null
**Check:**
1. Console - Look for `[API] generateFlashcards error:` to see actual error
2. Network - Verify `/flashcards/generate/` request shows status 200
3. Payload - Verify payload contains `topic`, `num_cards`, `language`, `difficulty`

### Issue: Quiz generation failing
**Check:**
1. Console - Look for `[Quiz Service]` error logs with status code
2. Network - Verify `/quiz/generate/` request shows status 200
3. Payload - Verify payload contains `topic`, `num_questions`, `difficulty`

### Issue: Feature usage check blocking generation
**Check:**
1. This shouldn't happen - feature usage check has graceful fallback
2. If it does, check console for `[API] checkFeatureUsage error:` message
3. The handler will show exactly what error occurred

### Issue: Using endpoint taking too long
**Note:** 
- Extended timeout: **120 seconds** (2 minutes) for both endpoints
- AI processing can take time - be patient after clicking Generate
- Check Network tab to see if request is still pending

---

## Response Formats Expected

### Flashcards Success Response
```json
{
  "success": true,
  "data": {
    "title": "Flashcards: History",
    "cards": [
      {
        "front": "Question 1?",
        "back": "Answer 1",
        "difficulty": "medium"
      }
    ]
  }
}
```

### Quiz Success Response
```json
{
  "success": true,
  "data": {
    "quiz_id": "abc123",
    "topic": "Biology",
    "difficulty": "medium",
    "questions": [
      {
        "question": "What is photosynthesis?",
        "options": ["A", "B", "C", "D"],
        "correct": 0
      }
    ]
  }
}
```

---

## Summary

✅ **All endpoints configured and logging properly**
- Flashcards: POST `/flashcards/generate/`
- Quiz: POST `/quiz/generate/`
- Feature Usage Check: POST `/usage/check/` (optional, graceful fallback)
- Feature Usage Recording: POST `/usage/record/` (non-blocking)

✅ **Comprehensive logging at each step:**
- Handler level (App.tsx) - Shows when feature is called
- Service level (api.ts, quiz.ts) - Shows endpoint, payload, response
- Error level - Shows status code, error message, full details

✅ **Error handling with fallbacks:**
- Feature usage check won't block generation if endpoint missing
- Usage recording won't fail generation if endpoint has issues
- All errors logged with full details for debugging

**Ready to test!** Open DevTools console and verify logs as you generate flashcards and quizzes.
