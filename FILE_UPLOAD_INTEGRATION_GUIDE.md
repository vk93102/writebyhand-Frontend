# Integration Guide - File Upload & Subscription System

## Quick Start

### 1. Flashcards Feature
```typescript
import { generateFlashcards } from '@/services/flashcardsService';
import { canAccessFeature } from '@/services/subscriptionCheckService';

const handleFlashcardGeneration = async (userId: string, input: any) => {
  // Check subscription first
  const hasAccess = await canAccessFeature(userId, 'flashcards');
  if (!hasAccess) {
    Alert.alert('Subscription Required', 'Please upgrade to access flashcards');
    return;
  }

  // Generate with document or topic
  const result = await generateFlashcards(
    input,  // { document?: file, topic?: string }
    userId,
    10,     // num_cards
    'english'
  );
  
  console.log(result.data.data.cards);
};
```

### 2. Predicted Questions Feature
```typescript
import { generatePredictedQuestions } from '@/services/predictedQuestionsService';
import { canAccessFeature } from '@/services/subscriptionCheckService';

const handlePredictedQuestions = async (userId: string, input: any) => {
  // Check subscription first
  const hasAccess = await canAccessFeature(userId, 'predicted-questions');
  if (!hasAccess) {
    Alert.alert('Subscription Required', 'Please upgrade to access predictions');
    return;
  }

  // Generate with document or topic
  const result = await generatePredictedQuestions(
    input,  // { document?: file, topic?: string }
    userId,
    'physics', // exam_type
    5          // num_questions
  );
  
  console.log(result.data.questions);
};
```

### 3. Quiz Feature
```typescript
import { generateQuiz } from '@/services/quiz';
import { canAccessFeature } from '@/services/subscriptionCheckService';

const handleQuizGeneration = async (userId: string, input: any) => {
  // Check subscription first
  const hasAccess = await canAccessFeature(userId, 'quiz');
  if (!hasAccess) {
    Alert.alert('Subscription Required', 'Please upgrade to access quiz');
    return;
  }

  // Generate with document or topic
  const result = await generateQuiz(
    input,  // { document?: file, topic?: string }
    userId,
    5,      // num_questions
    'medium' // difficulty
  );
  
  console.log(result.questions);
};
```

## File Upload Handling

### For Document Upload
```typescript
import { pickDocumentOrImage, validateFile } from '@/utils/fileUploadHandler';

const handleDocumentUpload = async () => {
  const file = await pickDocumentOrImage();
  
  if (!file) return;
  
  // Validate
  const validation = validateFile(file);
  if (!validation.valid) {
    Alert.alert('Invalid File', validation.error);
    return;
  }
  
  // Use in feature call
  await generateFlashcards({ document: file }, userId);
};
```

### For Image Upload
```typescript
import { pickImage } from '@/utils/fileUploadHandler';

const handleImageCapture = async () => {
  const image = await pickImage('camera');
  
  if (!image) return;
  
  // Use in feature call
  await generateQuiz({ document: image }, userId);
};
```

## Subscription Management

### Check Subscription Status
```typescript
import { checkSubscriptionStatus } from '@/services/subscriptionCheckService';

const status = await checkSubscriptionStatus(userId);

console.log({
  currentPlan: status.currentPlan,    // 'free' | 'plan_a_trial' | 'plan_b_monthly'
  isActive: status.isActive,          // true/false
  daysRemaining: status.daysRemaining,
  canAccess: status.canAccess         // true if active
});
```

### Subscribe to Plan
```typescript
import { subscribeToPlan } from '@/services/subscriptionCheckService';

const result = await subscribeToPlan(userId, 'plan_a_trial');

if (result.success) {
  // Open payment link in browser
  Linking.openURL(result.shortUrl);
}
```

### Confirm Payment
```typescript
import { confirmPayment } from '@/services/subscriptionCheckService';

const result = await confirmPayment(
  userId,
  'plan_a_trial',
  'pay_xxxxx',      // Razorpay payment ID
  'order_xxxxx'     // Razorpay order ID
);
```

## Supported File Formats

- **Documents:** `.txt`, `.md`, `.pdf`
- **Images:** `.jpg`, `.jpeg`, `.png`
- **Max Size:** 10MB per file

## Request/Response Flow

### Flashcards Request → Response
```
POST /flashcards/generate/
├─ document | topic (required)
├─ user_id (required)
├─ num_cards (optional)
└─ language (optional)

Response:
{
  "success": true,
  "data": {
    "title": "Flashcard Set",
    "cards": [{ id, question, answer, category, difficulty, importance }]
  }
}
```

### Predicted Questions Request → Response
```
POST /predicted-questions/generate/
├─ document | topic (required)
├─ user_id (required)
├─ exam_type (required)
├─ num_questions (optional)
└─ language (optional)

Response:
{
  "success": true,
  "title": "Predicted Questions",
  "questions": [{ id, question, difficulty, importance, ... }],
  "key_definitions": [...],
  "topic_outline": {...}
}
```

### Quiz Request → Response
```
POST /quiz/generate/
├─ document | topic (required)
├─ user_id (required)
├─ num_questions (optional)
├─ difficulty (optional)
└─ subject (optional)

Response:
{
  "title": "Quiz Title",
  "questions": [{ id, question, options, correctAnswer, explanation }]
}
```

## Error Handling

All services throw errors on failure. Handle them appropriately:

```typescript
try {
  const result = await generateFlashcards(input, userId);
} catch (error) {
  console.error('Generation failed:', error.response?.data || error.message);
  Alert.alert('Error', 'Failed to generate. Please try again.');
}
```

## Mobile & Web Compatibility

Services handle both:
- **Mobile:** File URIs from device storage
- **Web:** File objects from input elements

The services automatically detect the platform and handle accordingly.

## Important Notes

1. **Subscription is MANDATORY** - Check before every feature access
2. **User ID must be set** - Via `setUserId()` in auth context
3. **Bearer token required** - Set via `setAuthToken()` after login
4. **Timeout:** 120 seconds for AI processing
5. **FormData:** Used for file uploads with correct 'document' field name
6. **Response parsing:** Do NOT modify response structures from backend
