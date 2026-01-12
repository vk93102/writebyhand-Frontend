# Quick Test Guide

## Test Flow for Each Feature

### Test 1: Quiz Feature (All 3 Input Types)

#### Text Input:
1. Go to "Quiz" page
2. Stay on "Text Input" tab
3. Enter: "Photosynthesis in plants"
4. Click "Generate"
5. ✅ Should see quiz with title, questions, and options

#### Image Input:
1. Go to "Quiz" page
2. Click "Image" tab
3. Click "Take Photo" or "Choose from Gallery"
4. Select/take image of study material
5. Click "Generate"
6. ✅ Should see quiz generated from image OCR

#### Document Upload:
1. Go to "Quiz" page
2. Click "Document Upload" tab
3. Click "Choose File"
4. Select PDF or TXT file
5. Click "Generate"
6. ✅ Should see quiz from document content

---

### Test 2: Flashcards Feature (All 3 Input Types)

#### Text Input:
1. Go to "Flashcards" page
2. Enter topic: "Biology - Cell Division"
3. Click submit
4. ✅ Should see flashcards with flip animation

#### Image Input:
1. Go to "Flashcards" page
2. Click "Image Upload" tab
3. Upload image
4. ✅ Should see flashcards from image

#### File Upload:
1. Go to "Flashcards" page
2. Click "File Upload" tab
3. Select PDF or document
4. ✅ Should see flashcards from file

---

### Test 3: Predicted Questions (All 3 Input Types)

#### Text Input:
1. Go to "Predicted Questions" page
2. Enter topic: "JEE Main Physics"
3. Select exam type: "JEE Main"
4. Click submit
5. ✅ Should see predicted questions with difficulty

#### Image Input:
1. Go to "Predicted Questions" page
2. Click "Image" tab
3. Upload image
4. Select exam type
5. ✅ Should see questions from image

#### File Upload:
1. Go to "Predicted Questions" page
2. Click "File" tab
3. Upload document
4. Select exam type
5. ✅ Should see predicted questions from file

---

### Test 4: Subscription Check (Premium Feature Gating)

#### Unsubscribed User:
1. Logout or use guest account
2. Click any feature (Quiz/Flashcards/Predicted Q)
3. Try to generate content
4. ✅ Should see: "Premium Feature - Please subscribe"
5. Click "View Plans" → Goes to pricing page

#### Subscribed User:
1. Login with paid subscription
2. Click any feature
3. Try to generate content
4. ✅ Should work immediately without alert

#### Trial User:
1. Login with active trial (days_remaining > 0)
2. Click any feature
3. Try to generate content
4. ✅ Should work (trial is valid)

---

## Expected Success Indicators

### Console Logs to Check:
```
[Quiz] Premium feature access for {userId}: true
[Flashcards] Premium feature access for {userId}: true
[PredictedQuestions] Premium feature access for {userId}: true
[Quiz] Feature usage allowed, calling endpoint
[Flashcards] Feature usage allowed, processing...
[PredictedQuestions] Starting text-based generation...
```

### Network Calls:
```
GET /api/subscriptions/status/?user_id=...  (200 OK)
POST /api/quiz/generate/  (200 OK)
POST /api/flashcards/generate/  (200 OK)
POST /api/predicted-questions/generate/  (200 OK)
```

### UI Indicators:
- ✅ Loading spinner/animation appears
- ✅ Content loads without errors
- ✅ Results display properly formatted
- ✅ No blank screens or crashes

---

## Common Issues & Solutions

### Issue: "Premium Feature" Alert Appears for Paid User
**Solution:** 
- Check: `GET /api/subscriptions/status/` response
- Should have `status: 'active'` or `is_active: true`
- Verify user_id is being sent correctly

### Issue: Quiz/Flashcards Not Loading
**Solution:**
- Check network tab: Did API call succeed (200)?
- Check response format: Has `data` or `questions` field?
- Check console: Any parsing errors?

### Issue: Image Upload Not Working
**Solution:**
- Check file permissions (iOS/Android)
- Try different image format (JPG vs PNG)
- Check image file size (should be < 10MB)

### Issue: "Quota Exceeded" Error
**Solution:**
- Wait the retry-after seconds
- Check user's API quota/limits
- Verify backend rate limiting

---

## Files Modified

✅ App.tsx
- Added `handleGenerateQuizFromImage()` handler
- Updated quiz UI with image + file tabs
- Updated flashcard component usage with file handler
- Fixed TabType to include 'file'
- Removed onForgotPassword prop from AuthScreen

✅ Flashcard.tsx
- Added FileUpload import
- Updated interface to accept onFileSubmit
- Added 3rd tab for file uploads
- Updated activeMethod state to handle 'file'

✅ subscriptionService.ts
- Enhanced `canAccessPremiumFeature()` logic
- Now checks: is_active OR status==='active' OR valid_trial

---

## Status: READY FOR TESTING ✅

All 9 handlers implemented and tested for compilation errors.
Build should compile without errors related to these features.
