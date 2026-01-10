# Document Upload Feature - Quick Testing Guide

## What Was Fixed

### Issue
The `handleGenerateQuizFromFile` function was trying to extract file content using properties that don't exist on DocumentPicker assets (`file.content`, `file.text`). This caused the function to always fail with "File content is empty" error.

### Solution
Added `extractFileContent()` helper function that properly handles:
- **Web File objects** - Uses FileReader API
- **Native URI objects** - Fetches and reads from device
- **Different file types** - Special handling for PDF and images
- **Error cases** - Graceful fallback with helpful messages

### Code Changes
**File**: `App.tsx`
**Function**: `extractFileContent()` (new)
**Function**: `handleGenerateQuizFromFile()` (updated)

## Test Cases

### Test 1: TXT File Upload (Basic)
**Expected Result**: ✅ Quiz generates successfully

**Steps:**
1. Create a simple TXT file:
   ```
   Biology: Photosynthesis
   
   Photosynthesis is a process where plants use sunlight to produce sugar.
   The reaction takes place in chloroplasts.
   
   Two main stages:
   - Light-dependent reactions: Occurs in thylakoid membranes
   - Light-independent reactions: Occurs in stroma
   
   Products are glucose and oxygen.
   ```

2. In Quiz tab, tap "Choose File"
3. Select the TXT file
4. Tap "Generate from 1 file"
5. Wait for "Processing..." to complete
6. Should see quiz with 10 questions about photosynthesis

**Debug Output Expected:**
```
[Quiz] Starting file upload process: {name: "biology.txt", size: XXX, type: "text/plain"}
[Quiz] Generating quiz from file: "biology.txt" (XXX characters) with 10 questions
[Quiz Service] createQuiz called with: {title: "Quiz from biology.txt", numQuestions: 10, difficulty: "medium", sourceType: "text"}
[Quiz Service] createQuiz response: {success: true, data: {...}}
[Quiz] Setting quiz data from file: {title: "Quiz from biology.txt", topic: "biology.txt", difficulty: "medium", questions: [...], quiz_id: "..."}
```

### Test 2: Large TXT File
**Expected Result**: ✅ Works but may take 30-120 seconds

**Steps:**
1. Create a 500 KB - 1 MB TXT file (paste content multiple times)
2. Upload same as Test 1
3. Observe loading indicator for 30-120 seconds
4. Quiz should generate with relevant questions

**Expected Behavior:**
- Loading spinner shows while generating
- No timeout error (120s timeout in place)
- Questions reflect large content

### Test 3: PDF File Upload
**Expected Result**: ⚠️ Shows warning message

**Steps:**
1. Select any PDF file
2. Tap "Generate from 1 file"
3. See alert or quiz with file metadata

**Expected Message:**
```
[PDF Document]
Filename: document.pdf
Size: XXXX bytes

Note: For better PDF support, please convert to text or use images.
The system will attempt to process the PDF content.
```

**What Happens:**
- API receives PDF metadata as "content"
- May fail or generate poor results (intended behavior - library not installed)
- User gets helpful message to convert to TXT

### Test 4: Image File Upload (JPG, PNG)
**Expected Result**: ⚠️ Shows warning message

**Steps:**
1. Select any image file
2. Tap "Generate from 1 file"
3. See alert or quiz with file metadata

**Expected Message:**
```
[Image Content]
Filename: screenshot.png
File Type: image/png

Note: Image files should contain readable text or diagrams for best results.
The AI will attempt to extract and interpret visual content.
```

**What Happens:**
- API receives image metadata as "content"
- May fail or generate poor results (intended behavior - OCR not installed)
- User gets helpful message

### Test 5: Empty File
**Expected Result**: ❌ Shows error

**Steps:**
1. Create an empty TXT file (0 bytes)
2. Upload it
3. Should see error: "File content is empty or could not be read"

**Expected Behavior:**
- Error caught before API call
- User friendly message
- No API request made

### Test 6: File Removal
**Expected Result**: ✅ Files can be removed

**Steps:**
1. Upload a file (see it in preview)
2. Tap X icon on file
3. File should disappear from list
4. "Choose File" button should reappear

**Expected Behavior:**
- File removed from `selectedFiles` state
- Can upload different file
- Previous file not used

### Test 7: Multiple File Selection (Advanced)
**Expected Result**: ⚠️ Only first file used

**Steps:**
1. Select multiple TXT files
2. All should appear in preview
3. Tap "Generate from 2 files"
4. Quiz generates from ONLY first file (by design)

**Expected Behavior:**
- All files shown in preview
- Only first file extracted
- Button shows count but only processes first

**Note:** This is intentional - function uses `files[0]`. If you want to support multiple files, update the function to combine all content.

### Test 8: Network Error During Upload
**Expected Result**: ❌ Shows error

**Steps:**
1. Disable network/WiFi
2. Select file and upload
3. After 120 seconds, should see timeout error
4. Or see connection error immediately

**Expected Error Message:**
```
Error: {error message from API}
```

**Expected Behavior:**
- Loading spinner shown initially
- Error after timeout
- User can retry

### Test 9: Wrong File Type (EXE, ZIP, etc.)
**Expected Result**: ❌ File picker blocks or shows error

**Steps:**
1. Try to upload .exe, .zip, .doc file
2. File picker might block or allow selection

**Expected Behavior:**
- If picked: extractFileContent fails with binary data
- Error message: "File content is empty or could not be read"
- Helpful message in console logs

### Test 10: Cancel File Selection
**Expected Result**: ✅ Nothing happens

**Steps:**
1. Tap "Choose File"
2. Cancel the file picker
3. Should return to FileUpload component

**Expected Behavior:**
- selectedFiles remains empty
- Can upload different file
- No state changes

## Performance Baselines

### Expected Times
| File Type | Size | Time to Process |
|-----------|------|-----------------|
| TXT | 1 KB | 1-2 sec |
| TXT | 10 KB | 2-5 sec |
| TXT | 100 KB | 10-30 sec |
| TXT | 1 MB | 30-120 sec |
| PDF | 100 KB | 30-120 sec* |
| Image | 100 KB | 30-120 sec* |

*May fail or produce poor results without proper library support

## Console Debug Commands

### In Browser DevTools
```javascript
// Check App state
console.log({quizLoading, quizData});

// Check file object properties
console.log(Object.getOwnPropertyNames(file));

// Check extracted content
console.log(fileContent.substring(0, 500));

// Check API response
console.log(JSON.stringify(quizData, null, 2));
```

### In Metro Debugger (React Native)
```javascript
// Set breakpoint in handleGenerateQuizFromFile
// Step through extractFileContent
// Check file.uri resolution
// Verify fetch succeeds
```

## Success Criteria Checklist

### Feature Works Correctly When:
- [ ] TXT files upload and generate quiz ✅
- [ ] File preview shows filename and size ✅
- [ ] "Generate from X file" button works ✅
- [ ] Loading spinner shown during generation ✅
- [ ] Quiz displays with questions from file ✅
- [ ] Error messages are user-friendly ✅
- [ ] Console shows detailed logging ✅
- [ ] Files can be removed from preview ✅
- [ ] Different files can be uploaded sequentially ✅
- [ ] Timeout (120s) prevents stuck loading ✅

### UI/UX Expectations:
- [ ] File icon matches file type ✅
- [ ] File size shown in human-readable format ✅
- [ ] Disabled states during loading ✅
- [ ] Progress feedback to user ✅
- [ ] Error messages clear and actionable ✅

## Troubleshooting Guide

### "File content is empty" Error
**Possible Causes:**
1. File is actually empty (0 bytes)
2. File format not text-based (binary file)
3. FileReader failed to read
4. URI fetch failed

**Solutions:**
1. Try different file
2. Use TXT or PDF format
3. Check browser console for fetch errors
4. Try smaller file (< 100 KB)

### "Failed to read file from device" Error
**Possible Causes:**
1. URI no longer valid
2. File deleted after selection
3. Permission denied
4. Network request blocked

**Solutions:**
1. Select file again
2. Don't delete file after picking
3. Check app permissions in settings
4. Check firewall/network

### Quiz Not Displaying
**Possible Causes:**
1. API returned empty questions array
2. Response parsing failed
3. quizData not set correctly
4. Questions array has wrong structure

**Solutions:**
1. Check console for API response
2. Verify response.data.questions exists
3. Check quizData in React DevTools
4. Verify backend generates questions

### Long Processing Time
**Possible Causes:**
1. Large file (> 500 KB)
2. Slow network
3. Backend processing queue
4. Complex content

**Solutions:**
1. Use smaller file (< 100 KB)
2. Check network speed
3. Try again later
4. Simplify content in file

## Related Documentation

- [DOCUMENT_UPLOAD_IMPLEMENTATION.md](DOCUMENT_UPLOAD_IMPLEMENTATION.md) - Complete implementation details
- [QUIZ_INTEGRATION_GUIDE.md](QUIZ_INTEGRATION_GUIDE.md) - Quiz feature overview
- [src/components/FileUpload.tsx](src/components/FileUpload.tsx) - File picker component
- [src/services/quiz.ts](src/services/quiz.ts) - Quiz API service
- [App.tsx](App.tsx) - Main app with handlers

## Next Steps (After Testing)

1. **Install PDF Library** (for real PDF support):
   ```bash
   npm install react-native-pdf-lib pdfjs-dist
   ```
   
2. **Install OCR Library** (for image text extraction):
   ```bash
   npm install react-native-ml-kit
   ```

3. **Add Pre-Upload Validation**:
   - Check file size before upload
   - Show warning for files > 1 MB
   - Suggest conversion for unsupported types

4. **Add File Preview**:
   - Show first 500 characters of TXT
   - Show thumbnail for images
   - Allow preview before generating

5. **Improve Error Handling**:
   - More specific error messages
   - Suggest fixes in UI
   - Track failures for analytics

## Success Metrics

**After fixing document upload, you should see:**
- ✅ File uploads complete without "empty content" errors
- ✅ Quiz generates within 30-120 seconds
- ✅ Questions are relevant to file content
- ✅ User receives helpful error messages
- ✅ Console shows detailed logging
- ✅ Feature works on web and mobile

**Status:** ✅ Document upload ready for testing
