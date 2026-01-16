# 🚨 CRITICAL: Gemini API Key Leaked

## Error Message
```
[GeminiQuizService] Quiz generation error: {
  "data": {
    "error": {
      "code": 403,
      "message": "Your API key was reported as leaked. Please use another API key.",
      "status": "PERMISSION_DENIED"
    }
  }
}
```

## What Happened
Your Gemini API key (`AIzaSyAYUmb0U61hkwEp...`) has been detected as leaked by Google's security systems and has been **permanently disabled**.

## Immediate Actions Required

### 1. Generate New Gemini API Key
1. Go to: https://makersuite.google.com/app/apikey
2. **Delete the old key** (it's compromised and won't work)
3. Click "Create API Key"
4. Select your Google Cloud project
5. Copy the new API key

### 2. Update Environment Variables

**File: `.env`**
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_new_api_key_here
```

### 3. Secure Your API Key

⚠️ **NEVER commit API keys to Git repositories**

Add to `.gitignore`:
```
.env
.env.local
.env.production
*.env
```

### 4. Move API Key to Backend (Recommended)

For production security, API keys should be stored server-side:

**Backend (Django):**
```python
# settings.py
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# views.py
def generate_quiz(request):
    api_key = settings.GEMINI_API_KEY  # Key stays on server
    # Call Gemini API from backend
```

**Frontend:**
```typescript
// Remove API key from frontend
// Call your backend instead:
const response = await axios.post('/api/quiz/generate/', {
  topic: topic,
  num_questions: 10
});
```

## Why This Happened

Common causes:
1. ✅ API key committed to GitHub (most common)
2. ✅ Exposed in client-side code (React Native bundle)
3. ✅ Shared in logs/screenshots
4. ✅ Posted in chat/support tickets

## Security Best Practices

### ✅ DO:
- Store API keys in environment variables
- Use backend API proxies for sensitive operations
- Add `.env` to `.gitignore`
- Rotate keys regularly
- Use separate keys for dev/staging/production

### ❌ DON'T:
- Commit API keys to version control
- Hardcode keys in source code
- Share keys in screenshots/logs
- Expose keys in client-side bundles
- Use the same key across projects

## Check Your Git History

If you committed the key to Git:

```bash
# Search for API key in commit history
git log -S "AIzaSyA" --all

# Remove from history (use with caution)
git filter-branch --tree-filter 'rm -f .env' HEAD
# or use BFG Repo Cleaner
```

## Temporary Workaround

Until you implement backend proxy, you can use the new key:

```typescript
// src/services/GeminiQuizService.ts
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Add validation
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY not configured');
}
```

## Long-Term Solution: Backend Proxy

**Step 1: Backend endpoint**
```python
# Django views.py
from google import generativeai as genai
import os

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz_backend(request):
    genai.configure(api_key=os.environ['GEMINI_API_KEY'])
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    topic = request.data.get('topic')
    response = model.generate_content(f"Generate quiz on {topic}")
    
    return JsonResponse({
        'success': True,
        'quiz': parse_quiz(response.text)
    })
```

**Step 2: Update frontend**
```typescript
// Remove Gemini API calls from frontend
// Use your backend instead
export const generateQuiz = async (topic: string) => {
  const response = await api.post('/quiz/generate/', { topic });
  return response.data;
};
```

## Status Check

After replacing the API key:

```bash
# Restart Expo
npx expo start --clear

# Check logs for success:
# ✅ [GeminiQuizService] Initialized with API key (length: 39)
# ✅ Quiz generation successful
```

## Additional Resources

- [Google AI Studio API Keys](https://makersuite.google.com/app/apikey)
- [Securing API Keys in React Native](https://reactnative.dev/docs/security#api-keys)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)

---

**Priority**: 🔴 CRITICAL - App cannot generate quizzes until fixed
**Timeline**: Fix immediately (< 1 hour)
**Impact**: All AI features (quiz, flashcards, Q&A) are broken
