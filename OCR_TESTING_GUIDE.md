# OCR & Image Processing - Testing & Validation Guide

## Quick Start Testing

### 1. Flashcard Generation - Text Input
**Status:** ✅ Should work (with usage tracking)

**Steps:**
1. Navigate to "Generate Flashcards" section
2. Enter a topic (e.g., "Photosynthesis")
3. Press "Generate"
4. **Expected:** Flashcards appear with question/answer pairs

**What Happens Internally:**
1. `checkFeatureUsage('flashcards')` - Verifies user quota
2. `generateFlashcards(topic)` - Generates content
3. `recordFeatureUsage()` - Records 500 tokens used
4. State updated with flashcard data

**Success Indicators:**
- ✅ Flashcards display without errors
- ✅ Console shows `[Flashcards] Text-based generation successful`
- ✅ Each card has question and answer
- ✅ No "Feature Limit Reached" error (unless quota exceeded)

---

### 2. Flashcard Generation - Image Upload
**Status:** ✅ Fully Implemented (NEW - Uses OCR)

**Steps:**
1. Go to "Generate Flashcards" → "Upload Image"
2. Select image with readable text
3. Press "Generate"
4. **Expected:** Cards generated from extracted text

**What Happens Internally:**
1. `checkFeatureUsage('flashcards')` - Check quota
2. Image file → `generateFlashcardsFromImage()`:
   - Calls `processImageWithOCR()` to extract text
   - Endpoint: `POST /ocr/process-image/`
   - Gets: `{ text, confidence: 0.92, metadata }`
   - Validates text length (must be > 50 chars)
   - Calls `generateFlashcards()` with extracted text
3. `recordFeatureUsage()` records with `{ source: 'ocr_image', ocr_confidence: 0.92 }`
4. State updated: `setFlashcardData(response)`

**Success Indicators:**
- ✅ Image uploads successfully
- ✅ Console shows `[Flashcards] Starting image-based generation`
- ✅ Console shows `[Flashcards] Image processing successful, cards generated: X`
- ✅ Flashcards appear (generated from image text)
- ✅ Response includes: `{ source: 'ocr_image', ocrConfidence: 0.XX, data: [...] }`

**Possible Errors:**
- ❌ "Image not readable" → Text extraction failed or confidence too low
- ❌ "Failed to generate from image" → OCR processing timed out or failed
- ❌ "Feature Limit Reached" → User quota exceeded (429 status)

**Debug Tips:**
- Check browser console for `[Flashcards]` logs
- Verify image contains clear, readable text
- Test with high-contrast text (black on white)
- Try different image formats: JPG, PNG

---

### 3. Flashcard Generation - Document Upload
**Status:** ✅ Fully Implemented (NEW - File Type Detection)

**Steps:**
1. Go to "Generate Flashcards" → "Upload File"
2. Select file:
   - Image: JPG, PNG, GIF, WEBP, BMP
   - Document: PDF, TXT
3. Press "Generate"
4. **Expected:** Flashcards generated from document content

**File Type Routing:**
```
If image (.jpg, .png, .gif, .webp, .bmp):
  ├─ Extract text via OCR (processImageWithOCR)
  └─ Generate flashcards from text

If document (.pdf, .txt):
  └─ Send to /flashcards/generate-from-document/
```

**What Happens Internally:**

**For Images:**
1. File type detected: `.jpg` → image
2. `generateFlashcardsFromFile()` calls `generateFlashcardsFromImage()`
3. OCR processing chain activates
4. Response includes: `{ source: 'ocr_image', ocrConfidence }`

**For Documents:**
1. File type detected: `.pdf` → document
2. `generateFlashcardsFromFile()` makes direct POST to `/flashcards/generate-from-document/`
3. Backend processes document directly
4. Response includes: `{ source: 'document' }`

**Success Indicators:**
- ✅ File uploads without errors
- ✅ Console shows `[Flashcards] Starting file-based generation`
- ✅ For images: Shows `[Flashcards] Image processing successful`
- ✅ For documents: Shows file type recognized
- ✅ Flashcards generated and displayed
- ✅ Usage recorded with correct source type

**Possible Errors:**
- ❌ Unsupported file type (only JPG, PNG, PDF, TXT supported)
- ❌ "Failed to generate from file" → Backend endpoint issue
- ❌ "Image not readable" (images only) → OCR extraction failed

---

### 4. Predicted Questions - Text Input
**Status:** ✅ Updated (with usage tracking - NEW)

**Steps:**
1. Navigate to "Predict Questions" section
2. Enter a topic (e.g., "Photosynthesis")
3. Select exam type ("General", "JEE", "NEET", etc.)
4. Press "Generate"
5. **Expected:** Questions appear with options

**What Happens Internally:**
1. `checkFeatureUsage('predicted-questions')` - Check quota
2. `generatePredictedQuestions(topic, userId, examType, 3)` - Generate content
3. `recordFeatureUsage()` - Record with `{ source: 'text_input', exam_type, question_count }`
4. State updated with question data

**Success Indicators:**
- ✅ Questions display without errors
- ✅ Console shows `[PredictedQuestions] Text-based generation successful`
- ✅ Each question has options and correct answer marked
- ✅ Exam type correctly applied

---

### 5. Predicted Questions - Image Upload
**Status:** ✅ Fully Implemented (NEW - Uses OCR)

**Steps:**
1. Go to "Predict Questions" → "Upload Image"
2. Select image with text (exam questions, study material, etc.)
3. Press "Generate"
4. **Expected:** Questions generated from image text

**What Happens Internally:**
1. `checkFeatureUsage('predicted-questions')` - Check quota
2. Image file → `generatePredictedQuestionsFromImage()`:
   - Calls `processImageWithOCR()` to extract text
   - Endpoint: `POST /ocr/process-image/`
   - Validates text length
   - Calls `generatePredictedQuestions()` with extracted text
3. `recordFeatureUsage()` records with:
   ```json
   {
     "source": "ocr_image",
     "ocr_confidence": 0.92,
     "question_count": 3
   }
   ```
4. State updated with question data and confidence scores

**Success Indicators:**
- ✅ Image uploads successfully
- ✅ Console shows `[PredictedQuestions] Starting image-based generation`
- ✅ Console shows `[PredictedQuestions] OCR Confidence: 0.XX`
- ✅ Console shows `[PredictedQuestions] Image processing successful, questions generated: X`
- ✅ Questions appear with correct format
- ✅ Both `ocrConfidence` and `confidence_score` tracked

**Possible Errors:**
- ❌ "Image not readable" → OCR extraction poor quality
- ❌ "Failed to generate from image" → OCR timeout or no text found
- ❌ "Feature Limit Reached" → Quota exceeded

---

### 6. Predicted Questions - Document Upload
**Status:** ✅ Fully Implemented (NEW - File Type Detection)

**Steps:**
1. Go to "Predict Questions" → "Upload File"
2. Select file (image or document)
3. Select exam type
4. Press "Generate"
5. **Expected:** Questions generated from file content

**File Type Routing:**
```
If image (.jpg, .png, .gif, .webp, .bmp):
  ├─ Extract text via OCR
  └─ Generate questions from text

If document (.pdf, .txt):
  └─ Send to /predicted-questions/generate-from-document/
```

**What Happens Internally:**

**For Images:**
1. File type detected as image
2. `generatePredictedQuestionsFromFile()` calls `generatePredictedQuestionsFromImage()`
3. Full OCR chain activates
4. Response includes: `{ source: 'ocr_image', ocrConfidence }`

**For Documents:**
1. File type detected as document
2. `generatePredictedQuestionsFromFile()` makes direct POST
3. Backend processes document
4. Response includes: `{ source: 'document' }`

**Success Indicators:**
- ✅ File uploads without errors
- ✅ Correct file type routing applied
- ✅ Questions generated and displayed
- ✅ Usage recorded with appropriate source type

---

## Detailed Feature Usage Testing

### Checking Feature Quotas

**Test 1: User Has Quota**

```
User quota state: { flashcards: { allowed: true, remaining: 10 } }

Expected Result:
- Feature usage check passes
- Generation proceeds normally
- Usage recorded after success
- Remaining quota decreases
```

**Steps:**
1. Generate flashcards once
2. Check console for `[Flashcards] Starting text-based generation`
3. Should complete without "Feature Limit Reached" alert
4. Try again - should work (unless quota depleted)

**Test 2: User Over Quota**

```
User quota state: { flashcards: { allowed: false, error: 'Quota exceeded...' } }

Expected Result:
- `checkFeatureUsage()` returns `{ allowed: false, error: '...' }`
- Alert displays: "Feature Limit Reached"
- User sees: "You have reached the limit for generating flashcards"
- Generation does NOT proceed
- No API call made
- No usage recorded
```

**Steps:**
1. Generate flashcards multiple times until quota exhausted
2. Try again - should see "Feature Limit Reached" alert
3. Should NOT make API call (check Network tab in DevTools)
4. Should NOT call `recordFeatureUsage()`

---

## HTTP Status Code Testing

### 429 - Quota Exceeded (AI Quota)

**Scenario:** Backend AI model quota exceeded

**Expected Behavior:**
```
Alert Title: "Quota Exceeded"
Alert Message: "AI quota exceeded. Please retry after 30 seconds."
Details Button: Available (shows detailed error if provided)
```

**Code Pattern:**
```typescript
if (status === 429) {
  const retrySeconds = error.response?.headers?.['retry-after'];
  const msg = `AI quota exceeded. Please retry${retrySeconds ? ' after ' + retrySeconds + 's' : ''}.`;
  Alert.alert('Quota Exceeded', msg, /* details option */);
}
```

**Testing:**
1. Make multiple requests rapidly (if backend enforces)
2. Should eventually hit 429
3. Alert displays with retry suggestion
4. User can wait and retry

### 401 - Unauthorized

**Scenario:** User not authenticated (token expired, etc.)

**Expected Behavior:**
```
Alert Title: "Unauthorized"
Alert Message: "Please login to generate flashcards from [source]"
```

**Testing:**
1. Logout or clear authentication token
2. Try to generate content
3. Should hit 401
4. Appropriate auth message displays
5. Feature loading state cleared

### Network Errors (Timeout, etc.)

**Scenario:** Network failure or request timeout

**Expected Behavior:**
```
Alert Title: "Error"
Alert Message: "Failed to generate flashcards from [image/file]"
```

**Testing:**
1. Disconnect internet
2. Try to generate content
3. Should fail gracefully
4. Generic error message displays
5. Loading state cleared
6. Can retry when connection restored

---

## OCR Confidence Score Testing

### Understanding Confidence Scores

**OCR Confidence:** 0-1 scale
- `0.95+` = Excellent (clear, printed text)
- `0.80-0.95` = Good (readable text)
- `0.60-0.80` = Fair (some OCR errors)
- `<0.60` = Poor (may have many errors)

### Testing with Different Images

**Test 1: High Confidence Image**
```
Image: Clear, printed text on white background
Expected: OCR Confidence > 0.90

Steps:
1. Upload image of a printed textbook page
2. Check console for: "[Flashcards] Image processing successful"
3. Look for: ocrConfidence: 0.92 (or similar high value)
4. Flashcards should be high quality
```

**Test 2: Medium Confidence Image**
```
Image: Slightly blurry or angled text
Expected: OCR Confidence 0.70-0.85

Steps:
1. Upload a photo of a notebook (not ideal lighting)
2. OCR confidence should be moderate
3. Generated content may have minor errors
4. Still usable for generating flashcards
```

**Test 3: Low Confidence Image**
```
Image: Very poor quality, handwriting, etc.
Expected: OCR Confidence < 0.60 or failure

Steps:
1. Upload low-quality or handwritten text image
2. May fail extraction or show low confidence
3. Alert may display: "Image not readable"
4. User prompted to try different image
```

**Tracking Confidence:**
- Confidence stored in usage metadata: `{ ocr_confidence: 0.XX }`
- Available in dashboard for quality monitoring
- Can be used to alert user if quality is poor

---

## Response Structure Validation

### Expected Flashcard Response

```json
{
  "success": true,
  "data": [
    {
      "id": "card_1",
      "question": "What is photosynthesis?",
      "answer": "The process by which plants...",
      "difficulty": "medium"
    }
  ],
  "source": "ocr_image",
  "ocrConfidence": 0.92,
  "cards": [/* same as data */]
}
```

**Validation Steps:**
1. Check `response.success === true`
2. Check `response.data` is array with cards
3. Check each card has: `{ id, question, answer, difficulty }`
4. Check `response.source` is one of: `'ocr_image'`, `'document'`, `'text_input'`
5. Check `response.ocrConfidence` is 0-1 (if OCR source)

### Expected Questions Response

```json
{
  "success": true,
  "data": [
    {
      "id": "q_1",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "difficulty": "medium"
    }
  ],
  "source": "ocr_image",
  "ocrConfidence": 0.88,
  "confidence_score": 0.85
}
```

**Validation Steps:**
1. Check `response.success === true`
2. Check `response.data` is array with questions
3. Check each question has: `{ id, question, options[], correct_answer, difficulty }`
4. Check `response.source` is appropriate
5. Check both `ocrConfidence` (if OCR) and `confidence_score` present

**Testing:**
```typescript
// In browser console after generation:
console.log('Flashcard Response:', flashcardData);
// Should match expected structure
```

---

## Usage Recording Validation

### Checking Usage Was Recorded

**Steps:**
1. Open DevTools (F12) → Network tab
2. Filter: "usage" or "record"
3. Generate flashcards
4. Should see POST request to `/usage/record` or similar
5. Request body should contain:
   ```json
   {
     "feature": "flashcards",
     "tokens": 500,
     "source_type": "image",
     "metadata": {
       "source": "ocr_image",
       "ocr_confidence": 0.92,
       "card_count": 5
     }
   }
   ```

**Expected Behavior:**
- ✅ Quota check happens first (GET request)
- ✅ Generation proceeds if allowed
- ✅ Usage recorded immediately after success
- ✅ Both requests complete successfully (200 status)

**Failure Indicators:**
- ❌ Usage not recorded (no POST to /usage/record)
- ❌ Usage recorded without metadata
- ❌ Usage recorded before generation (wrong order)

---

## End-to-End Workflow Testing

### Complete Flashcard Generation Flow

```
START
  ↓
User selects image → Image file chosen
  ↓
User presses "Generate" → setFlashcardLoading(true)
  ↓
checkFeatureUsage('flashcards')
  ├─ allowed: true → Continue
  └─ allowed: false → Show alert & STOP
  ↓
generateFlashcardsFromImage()
  ├─ detectFileType() → image detected
  ├─ processImageWithOCR()
  │  ├─ POST /ocr/process-image/
  │  ├─ Extract: { text, confidence }
  │  └─ Validate text length
  ├─ generateFlashcards(extractedText)
  │  ├─ POST /flashcards/generate/
  │  └─ Get: { data: [cards] }
  └─ Return: { success, data, source, ocrConfidence }
  ↓
recordFeatureUsage('flashcards', ...)
  ├─ POST /usage/record/
  └─ Track: tokens, source, metadata
  ↓
setFlashcardData(response)
  ├─ State updated
  └─ UI re-renders with cards
  ↓
setFlashcardLoading(false)
  ↓
User sees flashcards
END
```

**Success Checkpoints:**
- [ ] Image uploads correctly
- [ ] Loading spinner shows
- [ ] No "Feature Limit" error
- [ ] Flashcards appear with questions/answers
- [ ] Console shows all [Flashcards] logs
- [ ] Network shows /ocr/process-image/ request
- [ ] Network shows /flashcards/generate/ request
- [ ] Network shows /usage/record request
- [ ] Response includes ocrConfidence value
- [ ] Loading spinner disappears

---

## Common Issues & Solutions

### Issue 1: "Feature Limit Reached" When Quota Available

**Cause:** `checkFeatureUsage()` returning false incorrectly

**Solution:**
1. Check API `/usage/check-feature/` returns `{ allowed: true }`
2. Verify X-User-ID header being sent
3. Check backend logs for feature status
4. Verify feature quota not actually exhausted

### Issue 2: OCR Text Not Extracted Properly

**Cause:** Image not readable or backend OCR failure

**Solution:**
1. Use high-contrast image (black on white)
2. Ensure text is horizontal and aligned
3. Check image size (not too small)
4. Try different image format (PNG vs JPG)
5. Check backend OCR service status

### Issue 3: Generated Content Low Quality

**Cause:** Poor source text or low OCR confidence

**Solution:**
1. Check OCR confidence score logged
2. If confidence < 0.70, try better image
3. Use clearer source material
4. Verify extracted text in logs
5. Consider increasing difficulty to "medium" vs "easy"

### Issue 4: "Failed to Generate from Image" Error

**Cause:** Multiple possible issues

**Steps to Debug:**
1. Check Network tab for API requests
2. See if /ocr/process-image/ succeeded
3. See if /flashcards/generate/ failed
4. Check error response from failed endpoint
5. Look for 401, 429, or 500 status codes
6. Check console [Flashcards] error logs

### Issue 5: Usage Not Recording

**Cause:** `recordFeatureUsage()` not called or failing

**Solution:**
1. Verify generation succeeded (no error thrown)
2. Check Network tab for /usage/record POST
3. Verify request payload has correct structure
4. Check /usage/record endpoint returns 200
5. Verify X-User-ID header in request

---

## Performance Testing

### Response Time Expectations

| Operation | Expected Time | Timeout |
|-----------|---------------|---------|
| Text flashcards | 3-5 seconds | 30 seconds |
| Text questions | 3-5 seconds | 30 seconds |
| Image flashcards (OCR) | 5-10 seconds | 60 seconds |
| Image questions (OCR) | 5-10 seconds | 60 seconds |
| Document flashcards | 5-15 seconds | 60 seconds |
| Document questions | 5-15 seconds | 60 seconds |

**Testing:**
1. Open DevTools → Performance tab
2. Generate content and measure time
3. Should complete within expected range
4. If slower, check:
   - Network speed
   - Server load
   - Image file size
   - Device performance

---

## Accessibility Testing

### Testing Different User States

**Test 1: Authenticated User with Quota**
- ✅ All features work normally
- ✅ Usage tracked and counted
- ✅ Quota limits enforced

**Test 2: Authenticated User Without Quota**
- ✅ "Feature Limit Reached" alert shown
- ✅ Cannot generate content
- ✅ Message explains limit

**Test 3: Unauthenticated User (Guest)**
- ✅ 401 error handling graceful
- ✅ Auth prompt shown
- ✅ Option to login provided

**Test 4: Network Offline**
- ✅ Error message displayed
- ✅ Can retry when back online
- ✅ Loading state cleared
- ✅ No frozen UI

---

## Checklist for Complete Validation

### Before Going to Production

- [ ] Text input flashcard generation works
- [ ] Text input question generation works
- [ ] Image upload flashcard generation works
- [ ] Image upload question generation works
- [ ] Document upload flashcard generation works
- [ ] Document upload question generation works
- [ ] Feature usage quota checking works
- [ ] Usage recording works for all features
- [ ] OCR confidence scores tracked
- [ ] Error handling for 401 (auth) works
- [ ] Error handling for 429 (quota) works
- [ ] Error handling for network errors works
- [ ] Logging shows all debug information
- [ ] Response structure matches expected format
- [ ] No TypeScript compilation errors
- [ ] No console errors or warnings
- [ ] UI responsive during loading
- [ ] Alerts display helpful messages
- [ ] File type detection works correctly
- [ ] Cross-platform file handling works
- [ ] Performance within acceptable range
- [ ] Works on slow networks
- [ ] Works on slow devices
- [ ] Guest users don't crash
- [ ] All state properly cleared after generation

