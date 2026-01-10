# Quiz Endpoints Documentation

**Date:** January 10, 2026  
**Status:** ✅ Production Ready  
**Backend:** ed-tech-backend-tzn8.onrender.com/api

## Overview

The Quiz component uses dedicated quiz endpoints that are separate from Mock Tests. The quiz system provides:
- Dynamic quiz generation from topics
- Persistent quiz storage and retrieval
- Answer submission and scoring
- Detailed performance analytics

## Key Differences: Quiz vs Mock Test

| Feature | Quiz | Mock Test |
|---------|------|----------|
| Generation | Topic-based | Topic-based |
| Storage | Optional (can be saved) | Always saved to database |
| Endpoints | `/quiz/generate/`, `/quiz/create/`, `/quiz/{id}/`, etc. | `/mock-test/` endpoints |
| Use Case | Quick practice, custom quizzes | Official mock exams |
| Components | Separate Quiz component | Separate MockTest component |

## API Endpoints

### 1. Generate Quiz (Without Saving)

**Endpoint:** `POST /quiz/generate/`

**Purpose:** Generate quiz questions from a topic without storing in database. Quick generation for immediate use.

**Request:**
```json
{
  "topic": "Python programming basics including variables, loops, and functions",
  "num_questions": 5,
  "difficulty": "medium"
}
```

**Parameters:**
- `topic` (string, required): The topic to generate quiz about. Min 10 characters recommended.
- `num_questions` (integer, default: 5): Number of questions (range: 1-20)
- `difficulty` (string, default: "medium"): Options: "easy", "medium", "hard"

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q1",
      "question": "What is a variable in Python?",
      "options": [
        {
          "id": "opt1",
          "text": "A named container for storing data"
        },
        {
          "id": "opt2",
          "text": "A function that returns a value"
        },
        {
          "id": "opt3",
          "text": "A loop statement"
        },
        {
          "id": "opt4",
          "text": "A class definition"
        }
      ],
      "correct_answer": "opt1",
      "explanation": "A variable is a named container for storing data values.",
      "difficulty": "easy"
    }
  ],
  "metadata": {
    "total_questions": 5,
    "topic": "Python programming...",
    "difficulty": "medium",
    "generated_at": "2026-01-10T10:30:00Z"
  }
}
```

**Frontend Usage:**
```typescript
import { generateQuiz } from '@/src/services/quiz';

const result = await generateQuiz(
  "Python programming basics",
  5,
  "medium"
);

if (result.success) {
  setQuizData(result.data);
}
```

---

### 2. Create Quiz (Save to Database)

**Endpoint:** `POST /quiz/create/`

**Purpose:** Create a quiz from text content and save it to the database for later retrieval and tracking.

**Request:**
```json
{
  "transcript": "Machine learning is a subset of artificial intelligence...",
  "title": "Machine Learning Fundamentals",
  "source_type": "text",
  "source_id": "content_001",
  "num_questions": 5,
  "difficulty": "medium"
}
```

**Parameters:**
- `transcript` (string, required): Text content for quiz generation
- `title` (string, required): Quiz title
- `source_type` (string, default: "text"): Options: "text", "youtube", "image"
- `source_id` (string, optional): Unique identifier for the source
- `num_questions` (integer, default: 5): Number of questions (1-20)
- `difficulty` (string, default: "medium"): "easy", "medium", "hard"

**Response:**
```json
{
  "success": true,
  "quiz_id": "quiz_abc123",
  "title": "Machine Learning Fundamentals",
  "total_questions": 5,
  "difficulty_level": "medium",
  "questions": [
    {
      "id": "q1",
      "question": "What is machine learning?",
      "options": [...],
      "correct_answer": "opt1",
      "explanation": "...",
      "difficulty": "medium"
    }
  ],
  "created_at": "2026-01-10T10:30:00Z"
}
```

**Frontend Usage:**
```typescript
import { createQuiz } from '@/src/services/quiz';

const result = await createQuiz(
  "Machine learning content...",
  "Machine Learning Quiz",
  5,
  "medium",
  "text",
  "source_001"
);

if (result.success) {
  const quizId = result.quizId;
  setQuizData(result.data);
}
```

---

### 3. Get Quiz Details

**Endpoint:** `GET /quiz/{quiz_id}/`

**Purpose:** Retrieve a previously created quiz with all questions.

**Request:**
```
GET /quiz/quiz_abc123/
```

**Response:**
```json
{
  "success": true,
  "quiz_id": "quiz_abc123",
  "title": "Machine Learning Fundamentals",
  "total_questions": 5,
  "difficulty_level": "medium",
  "source_type": "text",
  "created_at": "2026-01-10T10:30:00Z",
  "questions": [
    {
      "id": "q1",
      "question": "What is machine learning?",
      "options": [...],
      "correct_answer": "opt1",
      "explanation": "Machine learning enables computers to learn from data...",
      "difficulty": "medium",
      "type": "mcq"
    }
  ]
}
```

**Frontend Usage:**
```typescript
import { getQuizQuestions } from '@/src/services/quiz';

const result = await getQuizQuestions(quizId);

if (result.success) {
  setQuizData(result.data);
}
```

---

### 4. Submit Quiz

**Endpoint:** `POST /quiz/{quiz_id}/submit/`

**Purpose:** Submit quiz answers and receive scoring results.

**Request:**
```json
{
  "session_id": "session_1234567890",
  "responses": {
    "q1": "opt1",
    "q2": "opt2",
    "q3": "opt1",
    "q4": "opt3",
    "q5": "opt2"
  }
}
```

**Parameters:**
- `session_id` (string, required): Unique session identifier
- `responses` (object, required): Map of question_id to selected option_id

**Response:**
```json
{
  "success": true,
  "response_id": "resp_xyz789",
  "score": 4,
  "correct_answers": 4,
  "total_questions": 5,
  "percentage": 80,
  "analysis": {
    "by_difficulty": {
      "easy": { "correct": 2, "total": 2, "percentage": 100 },
      "medium": { "correct": 2, "total": 3, "percentage": 67 },
      "hard": { "correct": 0, "total": 0 }
    },
    "time_taken_seconds": 245
  },
  "submitted_at": "2026-01-10T10:35:00Z"
}
```

**Frontend Usage:**
```typescript
import { submitQuiz } from '@/src/services/quiz';

const responses = {
  "q1": "opt1",
  "q2": "opt2",
  // ... more responses
};

const result = await submitQuiz(
  quizId,
  responses,
  `session_${Date.now()}`
);

if (result.success) {
  setQuizResults(result.data);
}
```

---

### 5. Get Quiz Results

**Endpoint:** `GET /quiz/{response_id}/results/`

**Purpose:** Retrieve detailed results and analysis for a submitted quiz.

**Request:**
```
GET /quiz/resp_xyz789/results/
```

**Response:**
```json
{
  "success": true,
  "response_id": "resp_xyz789",
  "quiz_title": "Machine Learning Fundamentals",
  "score": 4,
  "total_questions": 5,
  "percentage": 80,
  "correct_answers": 4,
  "feedback": "Great job! You have a solid understanding of machine learning concepts.",
  "completed_at": "2026-01-10T10:35:00Z",
  "analysis": {
    "by_difficulty": {
      "easy": {
        "correct": 2,
        "total": 2,
        "percentage": 100
      },
      "medium": {
        "correct": 2,
        "total": 3,
        "percentage": 67
      }
    },
    "time_taken_seconds": 245,
    "average_time_per_question": 49
  },
  "question_wise_analysis": [
    {
      "question_id": "q1",
      "question_text": "What is machine learning?",
      "your_answer": "opt1",
      "correct_answer": "opt1",
      "is_correct": true,
      "explanation": "Machine learning enables computers to learn from data...",
      "time_taken_seconds": 30
    }
  ]
}
```

**Frontend Usage:**
```typescript
import { getQuizResults } from '@/src/services/quiz';

const result = await getQuizResults(responseId);

if (result.success) {
  setResults(result.data);
  displayAnalytics(result.data.analysis);
}
```

---

## Service Layer Functions

All functions are in `src/services/quiz.ts`:

### `generateQuiz(topic, numQuestions, difficulty)`
Generate quiz from topic without saving to database.

```typescript
const result = await generateQuiz("Python basics", 5, "medium");
```

### `createQuiz(transcript, title, numQuestions, difficulty, sourceType, sourceId)`
Create and save quiz to database.

```typescript
const result = await createQuiz(
  "Python is a programming language...",
  "Python Fundamentals",
  5,
  "medium",
  "text",
  "source_001"
);
```

### `getQuizQuestions(quizId)`
Retrieve quiz questions.

```typescript
const result = await getQuizQuestions("quiz_abc123");
```

### `submitQuiz(quizId, responses, sessionId)`
Submit quiz answers.

```typescript
const result = await submitQuiz(
  "quiz_abc123",
  { q1: "opt1", q2: "opt2" },
  "session_123"
);
```

### `getQuizResults(responseId)`
Get detailed results.

```typescript
const result = await getQuizResults("resp_xyz789");
```

### `generateQuizFromYouTube(videoUrl, numQuestions, difficulty)`
Generate quiz from YouTube video.

```typescript
const result = await generateQuizFromYouTube(
  "https://youtube.com/watch?v=...",
  5,
  "medium"
);
```

---

## Component Usage

The Quiz component is used in `App.tsx` with handlers:

### Handler: `handleGenerateQuiz`
Generates quiz from user input topic.

```typescript
const handleGenerateQuiz = async (topic: string, numQuestions: number = 5) => {
  setQuizLoading(true);
  try {
    const response = await generateQuiz(topic, numQuestions, 'medium');
    if (response.success) {
      setQuizData(response.data);
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setQuizLoading(false);
  }
};
```

### Props:
```typescript
interface QuizProps {
  quizData: QuizData | null;
  loading: boolean;
}

interface QuizData {
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'conceptual' | 'numerical' | 'practical';
}
```

---

## Error Handling

All service functions return a standardized response:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}
```

**Frontend Error Handling:**
```typescript
const result = await generateQuiz("topic");

if (!result.success) {
  console.error('Error:', result.error);
  Alert.alert('Quiz Generation Failed', result.details || result.error);
  return;
}

// Use result.data
```

---

## Response Format Handling

The Quiz component handles both response formats:

**Format 1: Direct response**
```json
{
  "questions": [...],
  "title": "Quiz Title"
}
```

**Format 2: Wrapped response**
```json
{
  "data": {
    "questions": [...],
    "title": "Quiz Title"
  }
}
```

The component automatically unwraps wrapped responses:
```typescript
let validData = quizData;
if (quizData?.data && !quizData.questions) {
  validData = quizData.data;
}
```

---

## Request/Response Examples

### Example 1: Generate Quiz from Python Topic

**Request:**
```bash
curl -X POST https://ed-tech-backend-tzn8.onrender.com/api/quiz/generate/ \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_123" \
  -d '{
    "topic": "Python programming basics",
    "num_questions": 3,
    "difficulty": "easy"
  }'
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q1",
      "question": "What is Python?",
      "options": [
        { "id": "opt1", "text": "A programming language" },
        { "id": "opt2", "text": "A snake species" },
        { "id": "opt3", "text": "A mathematical function" },
        { "id": "opt4", "text": "None of the above" }
      ],
      "correct_answer": "opt1",
      "explanation": "Python is a high-level programming language.",
      "difficulty": "easy"
    }
  ]
}
```

---

### Example 2: Create Quiz with Text

**Request:**
```bash
curl -X POST https://ed-tech-backend-tzn8.onrender.com/api/quiz/create/ \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_123" \
  -d '{
    "transcript": "Photosynthesis is the process by which plants convert light energy...",
    "title": "Photosynthesis Quiz",
    "source_type": "text",
    "num_questions": 4,
    "difficulty": "medium"
  }'
```

**Response:**
```json
{
  "success": true,
  "quiz_id": "quiz_xyz123",
  "title": "Photosynthesis Quiz",
  "total_questions": 4,
  "questions": [...]
}
```

---

### Example 3: Submit Quiz

**Request:**
```bash
curl -X POST https://ed-tech-backend-tzn8.onrender.com/api/quiz/quiz_xyz123/submit/ \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_123" \
  -d '{
    "session_id": "session_1234567890",
    "responses": {
      "q1": "opt1",
      "q2": "opt2",
      "q3": "opt1",
      "q4": "opt3"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "response_id": "resp_abc789",
  "score": 3,
  "correct_answers": 3,
  "total_questions": 4,
  "percentage": 75,
  "analysis": {...}
}
```

---

## Testing

To test the quiz endpoints, use the provided Python test script:

```bash
# Run all quiz endpoint tests
python3 test_quiz_endpoints.py
```

Expected output:
```
========================================
QUIZ ENDPOINTS TEST SUITE
========================================

✅ Quiz Generation: PASS
✅ Quiz Creation: PASS
✅ Quiz Details: PASS
✅ Quiz Submission: PASS
✅ Quiz Results: PASS

Overall: 5/5 tests passed
🎉 All normal quiz endpoints are working!
```

---

## Performance Metrics

| Endpoint | Avg Response Time | Max Response Time |
|----------|-------------------|-------------------|
| Generate | 2-3s | 10s |
| Create | 3-5s | 15s |
| Get Details | <500ms | 2s |
| Submit | 1-2s | 5s |
| Get Results | <500ms | 2s |

---

## Integration Checklist

- [ ] Import quiz service: `import { generateQuiz, createQuiz, submitQuiz, getQuizResults } from '@/src/services/quiz'`
- [ ] Import Quiz component: `import { Quiz } from '@/src/components/Quiz'`
- [ ] Add Quiz state to App.tsx: `const [quizData, setQuizData] = useState(null)`
- [ ] Add quiz handlers in App.tsx
- [ ] Test with all 5 endpoints
- [ ] Verify response unwrapping works
- [ ] Test error handling
- [ ] Verify Network tab shows X-User-ID header
- [ ] Deploy to staging
- [ ] Run load testing with expected QPS

---

## Troubleshooting

### Issue: Quiz data not loading
**Check:**
- Verify quiz_id is correct
- Check Network tab for 404 response
- Ensure X-User-ID header is being sent
- Check API response format

### Issue: Questions not displaying
**Check:**
- Validate questions array exists
- Check if response is wrapped (needs unwrapping)
- Verify array length > 0
- Check TypeScript types match

### Issue: Results not saving
**Check:**
- Verify response_id is returned
- Check if backend is persisting responses
- Verify session_id is unique
- Check database connection status

---

## Related Documentation

- [API_CHANGES_BEFORE_AFTER.md](./API_CHANGES_BEFORE_AFTER.md) - Code comparison
- [BACKEND_API_ALIGNMENT.md](./BACKEND_API_ALIGNMENT.md) - Full API spec
- [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) - Deployment steps
- [FLASHCARD_QUIZ_DATA_FORMAT_UPDATE.md](./FLASHCARD_QUIZ_DATA_FORMAT_UPDATE.md) - Data format changes
