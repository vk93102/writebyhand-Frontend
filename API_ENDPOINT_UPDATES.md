# API Endpoint Updates - /api/ Prefix Implementation

## Overview
All backend endpoints have been updated to use the `/api/` prefix to match the backend API structure.

## Updated Endpoints

### 1. **Flashcards Generation**
**Before:** `POST /flashcards/generate/`
**After:** `POST /api/flashcards/generate/`

**Location:** [src/services/api.ts](src/services/api.ts#L353)
**Usage:** `generateFlashcards(topic, numCards, language, difficulty)`

**Example Response:**
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

---

### 2. **Quiz Generation**
**Before:** `POST /quiz/generate/`
**After:** `POST /api/quiz/generate/`

**Locations:** 
- [src/services/quiz.ts](src/services/quiz.ts#L34)
- [src/services/api.ts](src/services/api.ts#L292)
- [src/services/pair-quiz/api.ts](src/services/pair-quiz/api.ts#L190)

**Usage:** `generateQuiz(topic, numQuestions, difficulty)`

**Example Response:**
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

### 3. **Feature Usage Check**
**Before:** `POST /usage/check/`
**After:** `POST /api/usage/check/`

**Location:** [src/services/api.ts](src/services/api.ts#L1292)
**Usage:** `checkFeatureUsage(feature)`

**Request:**
```json
{
  "feature": "flashcards"
}
```

**Response Format:**
```json
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
```

**Handler Response (Normalized):**
```typescript
{
  success: true,
  allowed: true,
  reason: "Within limit (0/3)",
  limit: 3,
  used: 0,
  remaining: 3,
  error: undefined
}
```

---

### 4. **Feature Usage Recording**
**Before:** `POST /usage/record/`
**After:** `POST /api/usage/record/`

**Location:** [src/services/api.ts](src/services/api.ts#L1362)
**Usage:** `recordFeatureUsage(feature, inputSize, usageType, metadata)`

**Request:**
```json
{
  "feature": "flashcards",
  "input_size": 150,
  "usage_type": "text",
  "metadata": {
    "num_cards": 5,
    "language": "english",
    "difficulty": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feature \"flashcards\" usage recorded",
  "usage": {
    "feature": "flashcards",
    "limit": 3,
    "used": 1,
    "remaining": 2
  }
}
```

---

### 5. **Flashcards from Document**
**Before:** `POST /flashcards/generate-from-document/`
**After:** `POST /api/flashcards/generate-from-document/`

**Locations:**
- [src/services/api.ts](src/services/api.ts#L1647)

**Usage:** `generateFlashcardsFromDocument(file, numCards, language, difficulty)`

---

## Console Logging

### Flashcards Generation Logs:
```
[Flashcards] Checking feature usage for: History
[Flashcards] Usage check response: {...}
[Flashcards] Feature usage allowed, calling endpoint: POST /api/flashcards/generate/
[API] generateFlashcards - Calling endpoint: POST /api/flashcards/generate/
[API] generateFlashcards - Payload: { topic: "History", num_cards: 5, language: "english", difficulty: "medium" }
[API] generateFlashcards - Response status: 200
[API] generateFlashcards - Raw response: {...}
[Flashcards] API Response received: {...}
[Flashcards] Setting flashcard data with 5 cards
[Flashcards] Recording feature usage...
[API] recordFeatureUsage - Calling endpoint: POST /api/usage/record/ for: flashcards
[API] recordFeatureUsage - Usage updated. Remaining: 2
[Flashcards] Usage recorded successfully
```

### Quiz Generation Logs:
```
[Quiz] Checking feature usage for: Biology
[Quiz] Usage check response: {...}
[Quiz] Feature usage allowed, calling endpoint: POST /api/quiz/generate/
[Quiz Service] generateQuiz endpoint called with: { topic: "Biology", num_questions: 5, difficulty: "medium" }
[Quiz Service] POST /api/quiz/generate/ - Payload: {...}
[Quiz Service] generateQuiz response status: 200
[Quiz Service] generateQuiz response data: {...}
[Quiz] API Response received: {...}
[Quiz] Generated 5 questions
[Quiz] Recording feature usage...
[API] recordFeatureUsage - Calling endpoint: POST /api/usage/record/ for: quiz
[API] recordFeatureUsage - Usage updated. Remaining: 2
[Quiz] Usage recorded successfully
```

---

## Files Modified

1. **src/services/api.ts**
   - `generateFlashcards()` - Updated endpoint to `/api/flashcards/generate/`
   - `checkFeatureUsage()` - Updated endpoint to `/api/usage/check/`, added response normalization
   - `recordFeatureUsage()` - Updated endpoint to `/api/usage/record/`, improved logging
   - `generateQuizFromDocument()` - Updated endpoint to `/api/quiz/generate/`
   - `generateFlashcardsFromImage()` - Updated endpoint to `/api/flashcards/generate/`
   - `generateFlashcardsFromDocument()` - Updated endpoint to `/api/flashcards/generate-from-document/`

2. **src/services/quiz.ts**
   - `generateQuiz()` - Updated endpoint to `/api/quiz/generate/`

3. **src/services/pair-quiz/api.ts**
   - `generateQuizFromDocument()` - Updated endpoint to `/api/quiz/generate/`
   - `generateFlashcards()` - Updated endpoint to `/api/flashcards/generate/`

4. **App.tsx**
   - Handler logging updated to show `/api/quiz/generate/` and `/api/flashcards/generate/`

---

## Response Handling

### Feature Usage Check Response Normalization
The `checkFeatureUsage()` function now properly handles the backend response format:

```typescript
// Backend response:
{
  success: true,
  status: {
    allowed: true,
    reason: "...",
    limit: 3,
    used: 0,
    remaining: 3
  }
}

// Normalized response returned to handlers:
{
  success: true,
  allowed: true,
  reason: "Within limit (0/3)",
  limit: 3,
  used: 0,
  remaining: 3,
  error: undefined
}
```

---

## Key Improvements

✅ **All endpoints now use /api/ prefix** - Consistent with backend routing

✅ **Response format properly handled** - Extracting nested `status` object from feature usage check

✅ **Better logging** - Endpoint paths clearly shown in console logs

✅ **Backward compatibility** - Old endpoints still resolved by response handling fallbacks

✅ **No breaking changes** - All response handling maintains same interface to handlers

---

## Testing

### Test Flashcards:
```
1. Open DevTools Console
2. Filter for [API] or [Flashcards]
3. Generate flashcards
4. Should see: POST /api/flashcards/generate/ in Network tab
```

### Test Quiz:
```
1. Open DevTools Console
2. Filter for [API] or [Quiz Service]
3. Generate quiz
4. Should see: POST /api/quiz/generate/ in Network tab
```

### Test Feature Usage:
```
1. Observe console logs
2. Should see: POST /api/usage/check/ request
3. Should see: POST /api/usage/record/ request after feature generation
4. Check remaining quota updates in logs
```

---

## Status

✅ **All endpoints updated**
✅ **All response handling normalized**
✅ **All console logging updated**
✅ **Zero TypeScript errors**
✅ **Ready for production**
