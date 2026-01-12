# API Endpoint Fix - Flashcards & Predicted Questions

## Problem Summary

The flashcard and predicted questions image/file upload features were not properly calling backend APIs due to response handling inconsistencies and incorrect property access in handlers.

## Root Causes Identified

### 1. **Response Wrapping Inconsistency**

**Text-based functions** (`generateFlashcards`, `generatePredictedQuestions`):
- Backend returns: `{ success: true, data: { title, cards, ... } }`
- Function unwraps: Returns `{ title, cards, ... }` (the `.data` portion)
- Code location: `src/services/api.ts` lines 355-363

**Image/File-based functions** (BUGGY):
- Backend returns: `{ success: true, data: { title, cards, ... } }`
- Function was wrapping AGAIN: Returns `{ success, data: { ... }, cards: [], source }`
- Problem: Double-wrapped response breaks component consumption
- Code locations:
  - `generateFlashcardsFromImage` (lines 1664-1668) ❌ FIXED
  - `generateFlashcardsFromFile` (lines 1815-1819) ❌ FIXED
  - `generatePredictedQuestionsFromImage` (lines 1747-1751) ❌ FIXED
  - `generatePredictedQuestionsFromFile` (lines 1891-1895) ❌ FIXED

### 2. **Incorrect Property Access in Handlers**

**App.tsx handlers** accessing wrong response properties:
- Text-based handler expected: `response?.data?.length` (WRONG)
- Should be: `response?.questions?.length` or `response?.cards?.length`
- Code locations:
  - `handleGeneratePredictedQuestions` (line 706) ❌ FIXED
  - `handleGeneratePredictedQuestionsFromImage` (lines 759-760) ❌ FIXED
  - `handleGeneratePredictedQuestionsFromFile` (lines 817-818) ❌ FIXED

### 3. **Missing Logging**

Image/file API functions lacked detailed logging for debugging:
- No logging of input parameters
- No logging of image source type
- No logging of response unwrapping
- No stack traces on error

## Fixes Applied

### Fix 1: Consistent Response Unwrapping

**File**: `src/services/api.ts`

**Changes**:
1. `generateFlashcardsFromImage` (lines 1664-1668):
   - Changed from: `return { success: true, data: flashcardData, cards: [...], source: 'image' };`
   - Changed to: Unwrap response matching `generateFlashcards` pattern
   
2. `generateFlashcardsFromFile` (lines 1815-1819):
   - Changed from: `return { success: true, data: flashcardData, cards: [...], source: 'document' };`
   - Changed to: Unwrap response matching `generateFlashcards` pattern

3. `generatePredictedQuestionsFromImage` (lines 1747-1751):
   - Changed from: `return { success: true, data: predictedData, questions: [...], ... };`
   - Changed to: Unwrap response matching `generatePredictedQuestions` pattern

4. `generatePredictedQuestionsFromFile` (lines 1891-1895):
   - Changed from: `return { success: true, data: predictedData, questions: [...], ... };`
   - Changed to: Unwrap response matching `generatePredictedQuestions` pattern

**Before**:
```typescript
const flashcardData = response.data.data || response.data;
return {
  success: true,
  data: flashcardData,
  cards: flashcardData.cards || [],
  source: 'image',
};
```

**After**:
```typescript
let result: any = response.data;
if (response.data.data && response.data.success) {
  result = response.data.data;
}
return result;  // Consistent with text-based function
```

### Fix 2: Correct Property Access in Handlers

**File**: `App.tsx`

**Changes**:
1. Line 706 (`handleGeneratePredictedQuestions`):
   - Changed: `response?.data?.length` → `response?.questions?.length`

2. Line 758 (`handleGeneratePredictedQuestionsFromImage`):
   - Changed: `response?.data?.length` → `response?.questions?.length`
   - Added: More detailed logging of response

3. Line 817 (`handleGeneratePredictedQuestionsFromFile`):
   - Changed: `response?.data?.length` → `response?.questions?.length`

### Fix 3: Enhanced Logging

**File**: `src/services/api.ts`

Added comprehensive logging to both image/file functions:
- Log function called with parameters
- Log image source type detection
- Log API endpoint and request details
- Log response status and data
- Log unwrapping process
- Log final result with card/question count
- Enhanced error logging with status, message, response data, and stack trace

**Example added logging**:
```typescript
console.log('[Flashcards] generateFlashcardsFromImage called with:', { imageFile: typeof imageFile, numCards, language, difficulty });
console.log('[Flashcards] Processing image URI:', imageFile.substring(0, 60) + '...');
console.log('[Flashcards] POST /flashcards/generate/ with image form data - num_cards:', numCards, 'language:', language, 'difficulty:', difficulty);
console.log('[Flashcards] Image upload response status:', response.status);
console.log('[Flashcards] Returning flashcard result with', result?.cards?.length || 0, 'cards');
```

## API Contract Verification

**Endpoints confirmed working via cURL**:

### Flashcards
```
POST /api/flashcards/generate/
Headers: Authorization: Bearer {token}
Payload: multipart/form-data
  - document: <image file>
  - num_cards: <integer>

Response: { success: true, data: { title, cards: [...], ... } }
```

### Predicted Questions
```
POST /api/predicted-questions/generate/
Headers: Authorization: Bearer {token}
Payload: multipart/form-data
  - document: <file>
  - user_id: <string>
  - difficulty: <string>
  - num_questions: <integer>

Response: { success: true, data: { title, questions: [...], ... } }
```

## Data Flow After Fix

### Flashcard Generation (Image)

1. User uploads image in Flashcard component
2. ImageUpload component calls `onSubmit(imageUri)`
3. Flashcard component calls `onImageSubmit(imageUri)`
4. App.tsx handler: `handleGenerateFlashcardsFromImage(imageUri)`
5. API function: `generateFlashcardsFromImage(imageUri, ...)`
6. HTTP POST to `/flashcards/generate/` with FormData
7. Backend returns: `{ success: true, data: { title, cards, ... } }`
8. API function unwraps: Returns `{ title, cards, ... }`
9. Handler logs: `response?.cards?.length` ✓
10. Component displays: `flashcardData.cards` ✓

### Predicted Questions Generation (File/Image)

1. User uploads file/image in PredictedQuestions component
2. FileUpload/ImageUpload component calls `onSubmit(fileOrUri)`
3. PredictedQuestions component calls `onFileSubmit(file)` or `onImageSubmit(uri)`
4. App.tsx handler: `handleGeneratePredictedQuestionsFromFile/Image(...)`
5. API function: `generatePredictedQuestionsFromFile/Image(...)`
6. HTTP POST to `/predicted-questions/generate/` with FormData
7. Backend returns: `{ success: true, data: { title, questions, ... } }`
8. API function unwraps: Returns `{ title, questions, ... }`
9. Handler logs: `response?.questions?.length` ✓
10. Component displays: `predictedQuestionsData.questions` ✓

## Testing Checklist

- [x] Build successful (npm run build)
- [x] No TypeScript errors
- [x] No syntax errors
- [x] Consistent response handling across all functions
- [x] Correct property access in all handlers
- [x] Enhanced logging for debugging
- [x] Error messages preserved

## Files Modified

1. **src/services/api.ts**
   - `generateFlashcardsFromImage` - Unwrap response (line 1664)
   - `generateFlashcardsFromFile` - Unwrap response (line 1815)
   - `generatePredictedQuestionsFromImage` - Unwrap response (line 1747)
   - `generatePredictedQuestionsFromFile` - Unwrap response (line 1891)
   - Added logging to all image/file functions

2. **App.tsx**
   - `handleGeneratePredictedQuestions` - Fix property access (line 706)
   - `handleGeneratePredictedQuestionsFromImage` - Fix property access (lines 758-760)
   - `handleGeneratePredictedQuestionsFromFile` - Fix property access (lines 817-818)

## Build Status

✅ **Build Result**: `Exported: dist`
✅ **Errors**: 0
✅ **All changes compile successfully**

## Debugging Tips

If you encounter issues after this fix:

1. **Check browser console** for the enhanced logging:
   - Look for `[Flashcards]` or `[PredictedQuestions]` log messages
   - These show the complete request/response flow

2. **Check response data structure**:
   - API functions now return unwrapped data
   - Expect: `{ title, cards, ... }` or `{ title, questions, ... }`
   - NOT: `{ success, data: { ... }, source }`

3. **Verify component expectations**:
   - Flashcard component expects: `flashcardData.cards` (array)
   - PredictedQuestions component expects: `predictedQuestionsData.questions` (array)

4. **Check handler logs**:
   - App.tsx handlers log `response?.cards?.length` or `response?.questions?.length`
   - Should show the count of generated items

## Migration Notes

These are **breaking changes** to the response format:
- Old format: `{ success, data: { ... }, cards/questions: [], source }`
- New format: `{ title, cards/questions, ... }` (direct unwrapped)

All callers have been updated to use the new format. No external clients should be affected unless they were directly calling these API functions.
