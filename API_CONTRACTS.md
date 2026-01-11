# OCR & Image Processing - API Contracts & Response Structures

## API Endpoints Overview

All endpoints follow RESTful conventions with JSON request/response bodies.

### Base URL
```
{BASE_API_URL} = https://your-api-domain.com/api/v1
```

### Authentication
```
Headers:
  Authorization: Bearer {access_token}
  X-User-ID: {user_id}
  Content-Type: application/json | multipart/form-data
```

---

## 1. OCR Processing Endpoints

### 1.1 Process Image with OCR

**Endpoint:** `POST /ocr/process-image/`

**Purpose:** Extract text from images using OCR technology

**Request:**
```
Content-Type: multipart/form-data

Body:
  image: File         (JPEG, PNG, GIF, WEBP, BMP)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "text": "Extracted text content from the image...",
  "confidence": 0.92,
  "metadata": {
    "language": "en",
    "processing_time_ms": 2500,
    "image_size": {
      "width": 1024,
      "height": 768
    },
    "file_size_bytes": 245632,
    "model_version": "ocr_v2.1"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid image format or corrupted file",
  "details": "Supported formats: JPEG, PNG, GIF, WEBP, BMP",
  "code": "INVALID_IMAGE_FORMAT"
}
```

**Error Response (413 Payload Too Large):**
```json
{
  "success": false,
  "error": "Image file too large",
  "details": "Maximum file size: 10MB",
  "code": "FILE_SIZE_EXCEEDED"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "OCR service quota exceeded",
  "details": "Please retry after 60 seconds",
  "code": "QUOTA_EXCEEDED",
  "retry_after": 60
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "OCR processing failed",
  "details": "Internal processing error occurred",
  "code": "PROCESSING_ERROR"
}
```

**Response Field Definitions:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `success` | boolean | Request success status | `true` |
| `text` | string | Extracted text from image | `"Sample text..."` |
| `confidence` | number | OCR confidence score 0-1 | `0.92` |
| `metadata.language` | string | Detected text language | `"en"` |
| `metadata.processing_time_ms` | number | Time to process (milliseconds) | `2500` |
| `metadata.image_size` | object | Image dimensions | `{width: 1024, height: 768}` |
| `metadata.file_size_bytes` | number | Original file size | `245632` |
| `metadata.model_version` | string | OCR model used | `"ocr_v2.1"` |

---

## 2. Flashcard Generation Endpoints

### 2.1 Generate Flashcards from Text

**Endpoint:** `POST /flashcards/generate/`

**Purpose:** Generate flashcards from text content

**Request:**
```json
{
  "topic": "Photosynthesis",
  "language": "english",
  "num_cards": 5,
  "difficulty": "medium",
  "custom_instructions": "Focus on light-dependent reactions"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "card_001_1",
      "question": "What is photosynthesis?",
      "answer": "Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose.",
      "difficulty": "easy",
      "tags": ["biology", "photosynthesis"],
      "mnemonic": "Light + CO2 + H2O → Glucose + O2"
    },
    {
      "id": "card_001_2",
      "question": "Name the two main stages of photosynthesis.",
      "answer": "1. Light-dependent reactions (in thylakoid membrane)\n2. Light-independent reactions/Calvin cycle (in stroma)",
      "difficulty": "medium",
      "tags": ["biology", "photosynthesis", "reactions"]
    }
  ],
  "cards": [/* same as data */],
  "source": "text_input",
  "metadata": {
    "generated_at": "2024-01-15T10:30:00Z",
    "generation_time_ms": 3200,
    "model": "flashcard_generator_v1.2"
  }
}
```

**Request Field Definitions:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `topic` | string | Yes | - | Topic or text to generate flashcards from |
| `language` | string | No | `"english"` | Language for flashcards |
| `num_cards` | number | No | `5` | Number of cards to generate (1-20) |
| `difficulty` | string | No | `"medium"` | Card difficulty: "easy", "medium", "hard" |
| `custom_instructions` | string | No | - | Additional instructions for generation |

**Response Card Structure:**
```json
{
  "id": "card_001_1",
  "question": "...",
  "answer": "...",
  "difficulty": "medium",
  "tags": ["..."],
  "mnemonic": "..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique card identifier |
| `question` | string | Question text |
| `answer` | string | Answer text (can be multi-line) |
| `difficulty` | string | Card difficulty level |
| `tags` | array | Categorization tags |
| `mnemonic` | string | Memory aid/trick (optional) |

---

### 2.2 Generate Flashcards from Document

**Endpoint:** `POST /flashcards/generate-from-document/`

**Purpose:** Generate flashcards from document files (PDF, TXT, DOCX)

**Request:**
```
Content-Type: multipart/form-data

Body:
  file: File                    (PDF, TXT, DOCX)
  num_cards: number             (default: 5)
  language: string              (default: "english")
  difficulty: string            (default: "medium")
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_card_1",
      "question": "...",
      "answer": "...",
      "difficulty": "medium",
      "source_excerpt": "Page 2, paragraph 3"
    }
  ],
  "cards": [/* same as data */],
  "source": "document",
  "document_metadata": {
    "file_name": "chapter_1.pdf",
    "file_size_bytes": 512000,
    "num_pages": 15,
    "extracted_words": 4250,
    "language_detected": "en"
  },
  "metadata": {
    "generated_at": "2024-01-15T10:30:00Z",
    "generation_time_ms": 4500
  }
}
```

**Error Response (415 Unsupported Media Type):**
```json
{
  "success": false,
  "error": "Unsupported file type",
  "details": "Supported formats: PDF, TXT, DOCX",
  "code": "UNSUPPORTED_FILE_TYPE"
}
```

---

### 2.3 Generate Flashcards from Image (OCR)

**Endpoint:** Composite via `/ocr/process-image/` + `/flashcards/generate/`

**Client-Side Flow:**
```typescript
1. POST /ocr/process-image/ → Extract text + confidence
2. POST /flashcards/generate/ → Generate from extracted text
3. Combine responses with OCR metadata
```

**Combined Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ocr_card_1",
      "question": "...",
      "answer": "...",
      "difficulty": "medium"
    }
  ],
  "source": "ocr_image",
  "ocrConfidence": 0.92,
  "ocrMetadata": {
    "extracted_text": "...",
    "language_detected": "en",
    "processing_time_ms": 2500,
    "image_size": {
      "width": 1024,
      "height": 768
    }
  },
  "flashcardMetadata": {
    "generation_time_ms": 3200
  }
}
```

---

## 3. Predicted Questions Endpoints

### 3.1 Generate Predicted Questions from Text

**Endpoint:** `POST /predicted-questions/generate/`

**Purpose:** Generate exam-style predicted questions from text

**Request:**
```json
{
  "topic": "Photosynthesis",
  "exam_type": "NEET",
  "num_questions": 3,
  "difficulty": "medium",
  "user_id": "user_123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "q_001_1",
      "question": "The light-independent reactions of photosynthesis occur in the...",
      "options": [
        "Thylakoid membrane",
        "Stroma",
        "Outer chloroplast membrane",
        "Photosystem II"
      ],
      "correct_answer": 1,
      "difficulty": "medium",
      "exam_type": "NEET",
      "explanation": "The Calvin cycle (light-independent reactions) occurs in the stroma of the chloroplast.",
      "tags": ["biology", "photosynthesis", "cell-structure"]
    },
    {
      "id": "q_001_2",
      "question": "How many ATP molecules are produced per glucose molecule in aerobic respiration?",
      "options": ["30-32 ATP", "36-38 ATP", "24-26 ATP", "18-20 ATP"],
      "correct_answer": 0,
      "difficulty": "hard",
      "exam_type": "NEET",
      "explanation": "Modern understanding: ~30-32 ATP per glucose due to proton gradient variations."
    }
  ],
  "questions": [/* same as data */],
  "source": "text_input",
  "confidence_score": 0.87,
  "metadata": {
    "generated_at": "2024-01-15T10:30:00Z",
    "generation_time_ms": 3800,
    "model": "qgen_v2.0"
  }
}
```

**Request Field Definitions:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `topic` | string | Yes | - | Topic to generate questions from |
| `exam_type` | string | No | `"General"` | Exam type: "NEET", "JEE", "General", etc. |
| `num_questions` | number | No | `3` | Number of questions (1-10) |
| `difficulty` | string | No | `"medium"` | Difficulty: "easy", "medium", "hard" |
| `user_id` | string | Yes | - | User ID for tracking |

**Question Structure:**
```json
{
  "id": "q_001_1",
  "question": "Question text?",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 1,
  "difficulty": "medium",
  "exam_type": "NEET",
  "explanation": "...",
  "tags": ["..."]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique question identifier |
| `question` | string | Question text |
| `options` | array | Answer options |
| `correct_answer` | number | Index of correct option (0-3) |
| `difficulty` | string | Question difficulty level |
| `exam_type` | string | Exam type this question suits |
| `explanation` | string | Why the answer is correct |
| `tags` | array | Categorization tags |

---

### 3.2 Generate Predicted Questions from Document

**Endpoint:** `POST /predicted-questions/generate-from-document/`

**Purpose:** Generate questions from document files

**Request:**
```
Content-Type: multipart/form-data

Body:
  file: File                    (PDF, TXT, DOCX)
  exam_type: string             (default: "General")
  num_questions: number         (default: 3)
  difficulty: string            (default: "medium")
  user_id: string               (required)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_q_1",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 1,
      "difficulty": "medium",
      "source_excerpt": "Page 5, section 3.2"
    }
  ],
  "questions": [/* same as data */],
  "source": "document",
  "confidence_score": 0.84,
  "document_metadata": {
    "file_name": "biology_notes.pdf",
    "num_pages": 25,
    "extracted_words": 6500
  }
}
```

---

### 3.3 Generate Predicted Questions from Image (OCR)

**Endpoint:** Composite via `/ocr/process-image/` + `/predicted-questions/generate/`

**Client-Side Flow:**
```typescript
1. POST /ocr/process-image/ → Extract text + confidence
2. POST /predicted-questions/generate/ → Generate from text
3. Combine responses with OCR metadata
```

**Combined Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ocr_q_1",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "difficulty": "medium"
    }
  ],
  "source": "ocr_image",
  "ocrConfidence": 0.89,
  "confidence_score": 0.82,
  "ocrMetadata": {
    "extracted_text": "...",
    "language_detected": "en",
    "processing_time_ms": 2500
  }
}
```

---

## 4. Feature Usage Endpoints

### 4.1 Check Feature Usage

**Endpoint:** `POST /usage/check-feature/`

**Purpose:** Check if user has remaining quota for a feature

**Request:**
```json
{
  "feature": "flashcards",
  "user_id": "user_123"
}
```

**Success Response - Allowed (200 OK):**
```json
{
  "success": true,
  "allowed": true,
  "feature": "flashcards",
  "usage": {
    "total_limit": 100,
    "used": 45,
    "remaining": 55,
    "reset_at": "2024-02-15T00:00:00Z"
  }
}
```

**Success Response - Not Allowed (200 OK):**
```json
{
  "success": true,
  "allowed": false,
  "feature": "flashcards",
  "error": "Quota exceeded for this period",
  "usage": {
    "total_limit": 100,
    "used": 100,
    "remaining": 0,
    "reset_at": "2024-02-15T00:00:00Z"
  }
}
```

---

### 4.2 Record Feature Usage

**Endpoint:** `POST /usage/record/`

**Purpose:** Record usage after successful feature execution

**Request:**
```json
{
  "feature": "flashcards",
  "user_id": "user_123",
  "tokens_used": 500,
  "source_type": "image",
  "metadata": {
    "source": "ocr_image",
    "ocr_confidence": 0.92,
    "card_count": 5,
    "language": "english"
  }
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "record_id": "usage_789456",
  "feature": "flashcards",
  "tokens_used": 500,
  "new_balance": {
    "total_limit": 1000,
    "used": 550,
    "remaining": 450,
    "reset_at": "2024-02-15T00:00:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Request Field Definitions:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `feature` | string | Yes | Feature name: "flashcards", "predicted-questions" |
| `user_id` | string | Yes | User ID |
| `tokens_used` | number | Yes | Tokens consumed (typically 500) |
| `source_type` | string | Yes | Source: "text", "image", "file" |
| `metadata` | object | Yes | Feature-specific metadata |

**Metadata Examples:**

**Text Input:**
```json
{
  "source": "text_input",
  "content_length": 250,
  "language": "english"
}
```

**Image Input:**
```json
{
  "source": "ocr_image",
  "ocr_confidence": 0.92,
  "card_count": 5,
  "image_size": "1024x768",
  "file_size_bytes": 245632
}
```

**Document Input:**
```json
{
  "source": "document",
  "file_type": "pdf",
  "file_size_bytes": 512000,
  "num_pages": 15,
  "card_count": 5
}
```

---

### 4.3 Get Usage Dashboard

**Endpoint:** `GET /usage/dashboard/`

**Purpose:** Retrieve user's complete usage statistics

**Success Response (200 OK):**
```json
{
  "success": true,
  "user_id": "user_123",
  "usage_summary": {
    "total_tokens": 1000,
    "tokens_used": 550,
    "tokens_remaining": 450,
    "usage_percentage": 55,
    "reset_date": "2024-02-15T00:00:00Z"
  },
  "features": {
    "flashcards": {
      "total": 1000,
      "used": 350,
      "remaining": 650,
      "generations": 3,
      "success_rate": 100,
      "avg_quality": 0.88
    },
    "predicted-questions": {
      "total": 1000,
      "used": 200,
      "remaining": 800,
      "generations": 2,
      "success_rate": 100,
      "avg_quality": 0.85
    }
  },
  "recent_usage": [
    {
      "feature": "flashcards",
      "timestamp": "2024-01-15T10:30:00Z",
      "tokens": 500,
      "source": "ocr_image",
      "ocr_confidence": 0.92
    },
    {
      "feature": "predicted-questions",
      "timestamp": "2024-01-15T09:15:00Z",
      "tokens": 500,
      "source": "text_input"
    }
  ]
}
```

**Error Response - Unauthorized (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "details": "Please login to view usage dashboard",
  "code": "UNAUTHORIZED"
}
```

---

## 5. Error Response Format

### Standard Error Structure

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `INVALID_REQUEST` | 400 | Missing required fields |
| `INVALID_IMAGE_FORMAT` | 400 | Unsupported image type |
| `FILE_SIZE_EXCEEDED` | 413 | File too large |
| `QUOTA_EXCEEDED` | 429 | Rate limit or quota exceeded |
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `PROCESSING_ERROR` | 500 | Server error |
| `TIMEOUT` | 504 | Request timeout |

---

## 6. Rate Limiting & Quotas

### Rate Limits

```
OCR Processing: 100 requests per minute per user
Flashcard Generation: 50 requests per minute per user
Question Generation: 50 requests per minute per user
```

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
Retry-After: 60
```

### Quota System

**Daily Quotas:**
```
Flashcards: 100 cards per day (20 generations × 5 cards)
Predicted Questions: 100 questions per day (20 generations × 5 questions)
Total Tokens: 1000 tokens per day (500 per generation)
```

**Quota Reset:** Midnight UTC

---

## 7. Request/Response Examples

### Example 1: Complete Flashcard Generation from Image

**Step 1: Process Image with OCR**
```bash
POST /ocr/process-image/
Content-Type: multipart/form-data

image: <binary file data>
```

**Response:**
```json
{
  "success": true,
  "text": "Photosynthesis is the process...",
  "confidence": 0.92,
  "metadata": { "language": "en", "processing_time_ms": 2500 }
}
```

**Step 2: Generate Flashcards from Text**
```bash
POST /flashcards/generate/
Content-Type: application/json

{
  "topic": "Photosynthesis is the process...",
  "language": "english",
  "num_cards": 5,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "card_1", "question": "...", "answer": "..." }
  ],
  "source": "text_input"
}
```

**Step 3: Record Usage**
```bash
POST /usage/record/
Content-Type: application/json

{
  "feature": "flashcards",
  "user_id": "user_123",
  "tokens_used": 500,
  "source_type": "image",
  "metadata": {
    "source": "ocr_image",
    "ocr_confidence": 0.92,
    "card_count": 5
  }
}
```

**Combined Client Response:**
```json
{
  "success": true,
  "data": [{ "id": "card_1", "question": "...", "answer": "..." }],
  "source": "ocr_image",
  "ocrConfidence": 0.92,
  "cards": [...]
}
```

---

## 8. Implementation Checklist

### Backend Requirements

- [ ] `/ocr/process-image/` endpoint implemented
- [ ] `/flashcards/generate/` endpoint implemented
- [ ] `/flashcards/generate-from-document/` endpoint implemented
- [ ] `/predicted-questions/generate/` endpoint implemented
- [ ] `/predicted-questions/generate-from-document/` endpoint implemented
- [ ] `/usage/check-feature/` endpoint implemented
- [ ] `/usage/record/` endpoint implemented
- [ ] `/usage/dashboard/` endpoint implemented
- [ ] Authentication via X-User-ID and Bearer token
- [ ] Rate limiting per user
- [ ] Quota enforcement
- [ ] Response structure normalization
- [ ] Error handling for all status codes
- [ ] Logging of all requests

### Frontend Implementation

- [ ] `processImageWithOCR()` function in api.ts
- [ ] `generateFlashcardsFromImage()` function in api.ts
- [ ] `generateFlashcardsFromFile()` function in api.ts
- [ ] `generatePredictedQuestionsFromImage()` function in api.ts
- [ ] `generatePredictedQuestionsFromFile()` function in api.ts
- [ ] `checkFeatureUsage()` function in api.ts
- [ ] `recordFeatureUsage()` function in api.ts
- [ ] `getUsageDashboard()` function in api.ts
- [ ] All handlers updated with usage checking
- [ ] Error handling for all HTTP status codes
- [ ] Comprehensive logging
- [ ] File type detection
- [ ] Platform-specific file handling
- [ ] Confidence score tracking
- [ ] Usage metadata recording

---

## 9. Testing Data

### Test Image for OCR

**Good Test Image:**
- Clear, printed text
- High contrast (black on white)
- 1024x768 or larger
- Under 5MB
- Horizontal alignment
- Common fonts (Arial, Times New Roman, etc.)

**Sample File Paths:**
```
/assets/test-images/
  ├─ high-quality.jpg       (clear printed text)
  ├─ medium-quality.png     (slightly blurry)
  ├─ low-quality.jpg        (poor lighting)
  └─ handwritten.jpg        (handwritten text)
```

### Test Topics

```
Flashcards:
  - "Photosynthesis"
  - "Mitochondria and ATP"
  - "Periodic table elements"
  - "World War II causes"

Questions:
  - "Cell structure and organelles"
  - "Newton's laws of motion"
  - "History of India"
```

---

## 10. Migration & Versioning

### API Versioning

```
Current Version: v1
Next Planned: v2 (with batch processing)
```

### Backward Compatibility

- Responses always include `success` boolean
- Fallback structures for missing optional fields
- Version included in responses for debugging

### Migration Path

```
v1 → v2:
- Single → Batch file processing
- Text-only → Multi-language support
- Static quotas → Dynamic quotas
- Token-based → Credit-based system
```
