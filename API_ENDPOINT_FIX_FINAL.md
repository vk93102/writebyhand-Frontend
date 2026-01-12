# API Endpoint Fix Summary - January 13, 2026

## Issue Fixed
**404 Error on Flashcards Endpoint**
- **Wrong URL:** `https://ed-tech-backend-tzn8.onrender.com/api/api/flashcards/generate/`
- **Root Cause:** Double `/api` prefix caused by baseURL already containing `/api`

## Solutions Applied

### 1. Fixed All Service Endpoints
The `api.ts` baseURL is: `https://ed-tech-backend-tzn8.onrender.com/api`

**Updated endpoints to use correct paths:**

| Service | Endpoint | Status |
|---------|----------|--------|
| Flashcards | `/flashcards/generate/` | ✅ Fixed |
| Predicted Questions | `/predicted-questions/generate/` | ✅ Fixed |
| Quiz | `/quiz/generate/` | ✅ Fixed |
| Subscriptions Status | `/subscriptions/status/` | ✅ Fixed |
| Subscriptions Plans | `/subscriptions/plans/` | ✅ Fixed |
| Subscribe Plan | `/subscriptions/subscribe/` | ✅ Fixed |
| Confirm Payment | `/subscriptions/confirm-payment/` | ✅ Fixed |

### 2. Services Updated

#### `/src/services/flashcardsService.ts`
- Changed `/api/flashcards/generate/` → `/flashcards/generate/`
- All console logs updated
- Request payload structure:
  ```
  document | topic (required)
  user_id (required)
  num_cards (optional)
  language (optional)
  ```

#### `/src/services/predictedQuestionsService.ts`
- Changed `/api/predicted-questions/generate/` → `/predicted-questions/generate/`
- All console logs updated
- Request payload structure:
  ```
  document | topic (required)
  user_id (required)
  exam_type (required)
  num_questions (optional)
  language (optional)
  ```

#### `/src/services/quiz.ts`
- Completely refactored from Gemini-only to backend integration
- Changed `/api/quiz/generate/` → `/quiz/generate/`
- Request payload structure:
  ```
  document | topic (required)
  user_id (required)
  num_questions (optional)
  difficulty (optional)
  subject (optional)
  ```

#### `/src/services/subscriptionCheckService.ts`
- Fixed all subscription endpoints:
  - `/api/subscriptions/status/` → `/subscriptions/status/`
  - `/api/subscriptions/plans/` → `/subscriptions/plans/`
  - `/api/subscriptions/subscribe/` → `/subscriptions/subscribe/`
  - `/api/subscriptions/confirm-payment/` → `/subscriptions/confirm-payment/`

### 3. Additional Services Created

#### `/src/services/predictedQuestionsService.ts` (NEW)
- Dedicated service for predicted questions endpoint
- Proper file upload handling
- MIME type detection
- FormData construction

#### `/src/services/flashcardsService.ts` (NEW)
- Dedicated service for flashcards endpoint
- Proper file upload handling
- MIME type detection
- FormData construction

#### `/src/services/subscriptionCheckService.ts` (ENHANCED)
- Comprehensive subscription management
- Status checking
- Payment confirmation
- Plan subscription
- Feature access gating

#### `/src/utils/fileUploadHandler.ts` (NEW)
- Document picker (PDF, TXT, MD, JPG, PNG)
- Image picker (camera/library)
- File validation
- Size limits (10MB max)
- MIME type mapping
- FormData helper functions

## Request/Response Formats

### Predicted Questions Response
```json
{
  "success": true,
  "title": "Predicted Important Questions - <topic>",
  "exam_type": "physics",
  "key_definitions": [{
    "term": "",
    "definition": "",
    "explanation": "",
    "example": ""
  }],
  "topic_outline": {
    "main_topic": "",
    "subtopics": [],
    "learning_objectives": []
  },
  "questions": [{
    "id": 1,
    "question": "",
    "difficulty": "",
    "importance": "",
    "question_type": "",
    "depth_level": "",
    "expected_answer_length": "",
    "key_concepts": [],
    "hint": "",
    "sample_answer": "",
    "why_important": "",
    "related_topics": [],
    "tags": []
  }],
  "total_questions": 5
}
```

### Flashcards Response
```json
{
  "success": true,
  "data": {
    "title": "Flashcard Set - <topic>",
    "topic": "",
    "language": "english",
    "total_cards": 3,
    "cards": [{
      "id": 1,
      "question": "",
      "answer": "",
      "category": "",
      "difficulty": "",
      "importance": ""
    }]
  }
}
```

### Quiz Response
```json
{
  "title": "<Quiz Title>",
  "topic": "",
  "difficulty": "",
  "questions": [{
    "id": 1,
    "question": "",
    "options": [],
    "correctAnswer": 0,
    "explanation": ""
  }]
}
```

### Subscription Status Response
```json
{
  "user_id": "",
  "current_plan": "free | plan_a_trial | plan_b_monthly",
  "is_active": true,
  "is_trial": true,
  "period_start": "",
  "period_end": "",
  "days_remaining": 6,
  "auto_renewal_enabled": true,
  "status": "active | inactive"
}
```

## Testing Checklist

- [ ] Flashcards endpoint returns 200 (not 404)
- [ ] Predicted Questions endpoint returns 200
- [ ] Quiz endpoint returns 200
- [ ] Subscription status endpoint returns 200
- [ ] File uploads work with correct MIME types
- [ ] Topic-based requests work with form data
- [ ] Response parsing matches expected formats
- [ ] Subscription gating enforced on features

## Key Changes Summary

1. **Removed double `/api` prefix** from all endpoints
2. **Unified FormData handling** for all file uploads
3. **Proper subscription integration** with gating
4. **Consistent error handling** and logging
5. **Mobile and web platform support** for file handling
6. **Gemini model changed** to `gemini-1.5-flash` in all services
