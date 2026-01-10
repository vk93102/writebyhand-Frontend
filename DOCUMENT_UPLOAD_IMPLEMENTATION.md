# Document Upload to Quiz Generation - Implementation Guide

## Overview
The document upload feature allows users to select PDF, TXT, or image files and generate quizzes directly from their content. This guide documents the complete implementation flow, file handling, and troubleshooting.

## Architecture

### Components Involved
1. **FileUpload Component** (`src/components/FileUpload.tsx`)
   - Handles file selection and display
   - Shows file preview with metadata
   - Manages multiple file selection (though only first file is used)

2. **App.tsx**
   - Contains `handleGenerateQuizFromFile()` handler
   - Uses `extractFileContent()` helper for file content extraction
   - Manages quiz loading state and data display

3. **Quiz Service** (`src/services/quiz.ts`)
   - `createQuiz()` endpoint for saving and generating quizzes
   - Handles API communication with 120-second timeout for AI processing

4. **API Service** (`src/services/api.ts`)
   - Provides shared axios instance with:
     - X-User-ID header injection
     - Bearer token authorization
     - Error handling and response parsing

## File Handling Flow

### Step 1: File Selection
```
User taps "Choose File" → DocumentPicker.getDocumentAsync → FileUpload processes asset
```

**FileUpload Component** (lines 45-55 in FileUpload.tsx):
- Opens native file picker via `expo-document-picker`
- Accepts: PDF, TXT, JPG, JPEG, PNG, GIF, WEBP, BMP
- Returns DocumentPicker assets with:
  - `name`: Filename
  - `size`: File size in bytes
  - `uri`: File URI (can be http or file://)
  - `mimeType`: MIME type
  - `file`: File object (web only)

**Asset Processing** (lines 48-63):
```typescript
// Web platform with File object
if (Platform.OS === 'web' && asset.file) {
  return {
    ...asset,
    file: asset.file,
    uri: asset.uri,
    name: asset.name,
    size: asset.size,
    mimeType: asset.mimeType || asset.file.type
  };
}
```

### Step 2: File Display
**FileUpload Preview** (lines 155-190):
- Shows selected files in a list
- Displays file icon based on extension
- Shows formatted file size
- Allows removal and adding more files
- "Generate from X file(s)" button triggers submission

### Step 3: File Content Extraction
Called when user taps "Generate from file" button.

**extractFileContent() Function** (lines 303-355 in App.tsx):
```typescript
const extractFileContent = async (file: any): Promise<string> => {
  // 1. Web File object handling
  if (file.file && typeof file.file === 'object' && file.file.constructor.name === 'File') {
    // Use FileReader API to read file
    // Returns: Text content of file
  }

  // 2. Native platform URI handling
  if (file.uri) {
    // Fetch file from URI
    // Determine file type from extension
    // Apply type-specific handling
  }
};
```

**File Type Handling:**

#### Text Files (TXT)
- Fetched via `fetch(file.uri)`
- Read as text using FileReader
- Raw content passed to quiz generation
- ✅ **Fully supported** - Best results

#### PDF Files
- Detected by `.pdf` extension
- Returns descriptive metadata (filename, size)
- **Note:** Native PDF parsing not included (requires library like `react-native-pdf-lib`)
- User gets message: "For better PDF support, please convert to text or use images"
- ⚠️ **Partial support** - Content extraction limited

#### Image Files (JPG, PNG, GIF, etc.)
- Detected by image extensions
- Returns descriptive metadata
- **Note:** OCR/image content extraction not included
- User gets message: "Image files should contain readable text or diagrams"
- ⚠️ **Partial support** - Visual content only

### Step 4: Quiz Generation
```
extractFileContent() → fileContent (string) → createQuiz() API call
```

**handleGenerateQuizFromFile()** (lines 357-413 in App.tsx):
1. Extracts file content using `extractFileContent()`
2. Validates content is not empty
3. Calls `createQuiz()` service with:
   - **transcript**: File content (extracted)
   - **title**: "Quiz from [filename]"
   - **numQuestions**: 10 (default in Quiz component)
   - **difficulty**: 'medium' (default in Quiz component)
   - **sourceType**: 'text'
   - **sourceId**: `file_${timestamp}`

4. Sets quiz state with response data
5. Handles errors with Alert dialogs

**API Call Details:**
```typescript
POST /quiz/create/
{
  "transcript": "File content here...",
  "title": "Quiz from document.txt",
  "source_type": "text",
  "source_id": "file_1705000000000",
  "num_questions": 10,
  "difficulty": "medium"
}
```

Response structure:
```json
{
  "success": true,
  "data": {
    "quiz_id": "uuid",
    "title": "Quiz from document.txt",
    "questions": [...],
    "total_questions": 10
  }
}
```

### Step 5: Quiz Display
Once quiz is generated, it displays in the `quiz` page section:
- Questions rendered from `quizData.questions`
- Loading state cleared
- User can answer and submit

## Integration in App.tsx

### In Quiz Tab UI (around line 956-980):
```typescript
<FileUpload
  onSubmit={(file) => handleGenerateQuizFromFile(file, 10, 'medium')}
  loading={quizLoading}
  placeholder="Upload document(s) (PDF, TXT, or Image)"
  acceptedTypes={['application/pdf', 'text/plain', 'image/*']}
  multiple={true}
/>
```

### In Quiz Display Section (around line 901-930):
```typescript
{quizLoading && <Loader />}
{quizData && (
  <Quiz
    questions={quizData.questions}
    onComplete={handleSubmitQuiz}
    difficulty={quizData.difficulty}
  />
)}
```

## File Size & Performance Considerations

### Recommended Limits
- **Text files**: Up to 2-5 MB (practical limit)
- **PDF files**: Up to 10 MB (with PDF parsing library)
- **Image files**: Up to 5 MB (with OCR library)

### Current Timeouts
- **API timeout**: 120 seconds (set in `quiz.ts` for createQuiz)
- **File read timeout**: No explicit timeout (browser dependent)
- **Network timeout**: 120 seconds for AI processing

### Optimization Tips
- Small files (< 500 KB) process fastest
- Large files may timeout on slower networks
- Complex PDFs may need simplification

## Error Handling

### User-Facing Errors
1. **"File content is empty"**
   - Cause: File couldn't be read or is actually empty
   - Fix: Try different file format or smaller file

2. **"Failed to read file from device"**
   - Cause: URI fetch failed
   - Fix: Try rebooting app or selecting different file

3. **"Failed to generate quiz from file"**
   - Cause: API error or content too complex
   - Fix: Simplify content or try smaller file

4. **"Please select a file"**
   - Cause: No file selected
   - Fix: Use "Choose File" button

### Console Logging
Enable in DevTools/Metro console to see:
```
[Quiz] Starting file upload process: {name, size, type}
[Quiz] Generating quiz from file: "filename" (X characters) with 10 questions
[Quiz Service] createQuiz called with: {title, numQuestions, difficulty, sourceType}
[Quiz Service] createQuiz response: {data}
[Quiz] Setting quiz data from file: {title, topic, difficulty, questions, quiz_id}
```

## Future Enhancements

### High Priority
1. **PDF Text Extraction**
   - Install: `react-native-pdf-lib` or `pdfjs-dist`
   - Extract text from PDF metadata and content streams
   - Handle multi-page PDFs

2. **Image OCR**
   - Install: `react-native-ml-kit` or `tesseract.js`
   - Extract text from images
   - Handle handwritten text

3. **File Size Validation**
   - Add pre-upload validation
   - Show warning for large files
   - Implement chunked upload for huge files

### Medium Priority
1. **Drag & Drop Support**
   - Web only: Enable drag-and-drop to upload area
   - Better UX for desktop users

2. **File Preview**
   - Show first N lines of text files
   - Show thumbnail of images
   - Allow preview before generating

3. **Batch Processing**
   - Support multiple file selection
   - Generate quiz from combined content
   - Show progress bar

### Low Priority
1. **File Compression**
   - Compress content before sending
   - Reduce bandwidth usage

2. **Caching**
   - Cache extracted content
   - Avoid re-processing same file

3. **Advanced UI**
   - Progress bar during extraction
   - Animated file icons
   - Better error messages

## Testing Checklist

### Manual Testing
- [ ] TXT file upload (1 KB, 100 KB, 1 MB files)
- [ ] PDF file upload (shows warning message)
- [ ] Image file upload (shows warning message)
- [ ] Empty file handling
- [ ] Non-text file handling
- [ ] File removal from preview
- [ ] Multiple file selection (only first used)
- [ ] Quiz generates from extracted content
- [ ] Questions are sensible for file content
- [ ] Network error handling
- [ ] Timeout handling (kill network during upload)

### Browser DevTools
- [ ] Check network tab for createQuiz API call
- [ ] Verify request body has transcript
- [ ] Check response status (200)
- [ ] Monitor console for logging

### Cross-Platform
- [ ] iOS file picker works
- [ ] Android file picker works
- [ ] Web file input works
- [ ] File URIs resolve correctly
- [ ] Permissions granted for file access

## Related Files

1. [src/components/FileUpload.tsx](src/components/FileUpload.tsx) - File picker component
2. [src/services/quiz.ts](src/services/quiz.ts) - Quiz API service
3. [src/services/api.ts](src/services/api.ts) - Shared API instance
4. [App.tsx](App.tsx) - Main app with handlers
5. [QUIZ_INTEGRATION_GUIDE.md](QUIZ_INTEGRATION_GUIDE.md) - Quiz feature overview
6. [QUIZ_MOCK_TEST_DATA_SEPARATION.md](QUIZ_MOCK_TEST_DATA_SEPARATION.md) - Data structure separation

## Quick Reference

### Enable Debug Logging
Add to top of handleGenerateQuizFromFile:
```typescript
console.log = (msg: string) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
};
```

### Test with Sample Content
```
Biology Class Notes - Chapter 5: Cell Division

Mitosis is a process of cell division that results in two daughter cells, each having the same number and kind of chromosomes as the parent nucleus.

Key stages:
1. Prophase - chromosomes condense
2. Metaphase - chromosomes align at equator
3. Anaphase - sister chromatids separate
4. Telophase - nuclear envelopes reform

Meiosis differs in creating four haploid cells.
```

Upload as TXT → Select 5 questions → Get quiz on cell division

### Useful Commands (Metro Console)
```
// Check extracted content
console.log(fileContent.substring(0, 200));

// Check quiz data
console.log(JSON.stringify(quizData, null, 2));

// Check file object
console.log(Object.keys(file));
```

## Status Summary

✅ **Implemented:**
- FileUpload component with full UI
- File selection and preview
- Text file extraction and reading
- Quiz generation from file content
- Error handling and alerts
- Platform-specific handling (web/native)
- Comprehensive logging

⚠️ **Partial/Limited:**
- PDF support (metadata only, no text extraction)
- Image support (metadata only, no OCR)
- File size validation (none currently)

❌ **Not Implemented:**
- PDF text parsing library
- Image OCR library
- Batch file processing
- Drag-and-drop
- File preview before generation
- Progress indicators
- Chunked upload

## Support & Troubleshooting

### If quiz generation fails:
1. Check console logs for error message
2. Verify file is not corrupted
3. Try with smaller text file (< 1 MB)
4. Check network connectivity
5. Ensure API endpoint is accessible

### If file content shows placeholder:
1. File type may need library support
2. For PDF: Convert to TXT using online tools
3. For images: Use image with readable text + OCR library
4. For best results: Use plain TXT files

### If loading state stuck:
1. Network timeout (API not responding)
2. Try again with smaller file
3. Check backend logs
4. Restart app if UI frozen
