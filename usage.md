# Usage & Restrictions Endpoints - Quick Reference

## What Was Built

✅ **6 New Endpoints** for usage tracking and feature restrictions:
1. Real-time usage monitoring
2. Usage history tracking  
3. Feature restriction details
4. Enforcement checks
5. Test/validation endpoints
6. Comprehensive feature testing

✅ **13 Total Usage Endpoints** (including existing ones):
- 2 real-time tracking endpoints
- 4 restriction/enforcement endpoints
- 2 pre/post-usage check endpoints
- 4 legacy dashboard endpoints
- 1 analytics endpoint

---

## Quick API Reference

### Real-Time Tracking
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/usage/real-time/` | GET | Get current usage for all features |
| `/api/usage/history/` | GET | Get usage history (last 7-30 days) |

### Restrictions & Enforcement
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/usage/restriction/<feature>/` | GET | Get restriction details for feature |
| `/api/usage/enforce-check/` | POST | Strict enforcement (403 if quota exceeded) |
| `/api/usage/test/restriction/` | POST | Test restriction validation |
| `/api/usage/test/all-features/` | POST | Test all features at once |

### Feature Usage (Existing)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/usage/check/` | POST | Check before using feature |
| `/api/usage/record/` | POST | Record after using feature |
| `/api/usage/dashboard/` | GET | Complete usage dashboard |
| `/api/usage/feature/<feature>/` | GET | Status of specific feature |
| `/api/usage/subscription/` | GET | Subscription details |
| `/api/usage/stats/` | GET | Usage statistics |

---

## Common Use Cases

### 1. Check Feature Before Using
```bash
curl -X POST \
  -H "X-User-ID: user123" \
  -H "Content-Type: application/json" \
  -d '{"feature": "quiz"}' \
  http://https://ed-tech-backend-tzn8.onrender.com/api/usage/check/
```
**Response (200):**
```json
{"success": true, "message": "Feature available"}
```
**Response (403):**
```json
{"success": false, "error": "Feature limit exhausted for free plan"}
```

### 2. Get Real-Time Usage
```bash
curl -H "X-User-ID: user123" \
  http://https://ed-tech-backend-tzn8.onrender.com/api/usage/real-time/
```
**Shows:**
- Current usage for each feature
- Remaining quota
- Percentage used
- Features available vs restricted

### 3. Get Feature Restrictions
```bash
curl -H "X-User-ID: user123" \
  http://https://ed-tech-backend-tzn8.onrender.com/api/usage/restriction/quiz/
```
**Shows:**
- Current usage: 2/3
- Remaining: 1
- Percentage used: 66.67%
- How to unlock (upgrade to premium)

### 4. Test All Features
```bash
curl -X POST \
  -H "X-User-ID: user123" \
  http://https://ed-tech-backend-tzn8.onrender.com/api/usage/test/all-features/
```
**Shows:**
- Each feature's availability
- Which features are restricted
- Summary: 8 available, 2 restricted

### 5. Record Usage After Success
```bash
curl -X POST \
  -H "X-User-ID: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "quiz",
    "input_size": 1000,
    "usage_type": "text"
  }' \
  http://https://ed-tech-backend-tzn8.onrender.com/api/usage/record/
```
**Automatically updates quota:**
- Used: 3/3
- Real-time endpoints show updated value

---

## Feature Limits

| Feature | Free Plan | Paid Plan |
|---------|-----------|-----------|
| Quiz | 3/month | Unlimited |
| Flashcards | 3/month | Unlimited |
| Pair Quiz | 1/month | Unlimited |
| Ask Question | 5/month | Unlimited |
| Predicted Questions | 3/month | Unlimited |
| YouTube Summarizer | 2/month | Unlimited |
| Daily Quiz | Unlimited | Unlimited |

---

## Response Patterns

### Success (200)
```json
{
  "success": true,
  "message": "...",
  "data": {...}
}
```

### Restricted (403)
```json
{
  "success": false,
  "error": "Feature limit exhausted for free plan",
  "status": {
    "allowed": false,
    "limit": 3,
    "used": 3
  }
}
```

### Error (400, 500)
```json
{
  "success": false,
  "error": "..."
}
```

---

## Real-Time Usage Example

```json
{
  "success": true,
  "timestamp": "2026-01-10T12:00:00Z",
  "plan": "free",
  "subscription_status": "active",
  "feature_usage": {
    "quiz": {
      "name": "Quiz",
      "used": 2,
      "limit": 3,
      "remaining": 1,
      "percentage": 66.67,
      "allowed": true
    },
    "flashcards": {
      "name": "Flashcards",
      "used": 3,
      "limit": 3,
      "remaining": 0,
      "percentage": 100,
      "allowed": false
    }
  },
  "summary": {
    "total_features": 10,
    "features_available": 8,
    "features_exhausted": 2
  }
}
```

---

## Integration Workflow

```
User clicks "Use Quiz"
        ↓
Frontend calls /api/usage/check/
        ↓
Response: 200 (allowed) or 403 (denied)
        ↓
    If 200:
        ├─ Show quiz
        ├─ User completes
        └─ Call /api/usage/record/
        
    If 403:
        └─ Show "Upgrade to Premium" modal
```

---

## Files Provided

1. **USAGE_TRACKING_ENDPOINTS.md**
   - Complete API documentation
   - Detailed endpoint specs
   - Request/response examples
   - Implementation guide

2. **USAGE_ENDPOINTS_IMPLEMENTATION.md**
   - Implementation summary
   - Feature list
   - Testing instructions
   - Security notes

3. **test_usage_endpoints.py**
   - Comprehensive test script
   - Tests all 8 endpoints
   - Can be run: `python test_usage_endpoints.py`

4. **Code Changes**
   - question_solver/usage_api_views.py (updated)
   - question_solver/urls.py (updated)

---

## Key Features

✅ **Real-Time Updates** - Usage updates instantly after each use
✅ **Feature Restrictions** - Enforces limits per subscription plan
✅ **Usage History** - Tracks usage for up to 30 days
✅ **Comprehensive Testing** - Test endpoints for validation
✅ **Detailed Reporting** - Shows percentage, remaining, limit
✅ **Error Handling** - Clear messages when quota exceeded
✅ **Security** - All endpoints require authentication
✅ **Flexible Filtering** - History by feature or date range

---

## Testing Commands

```bash
# Test real-time usage
python -c "
import requests
resp = requests.get('http://https://ed-tech-backend-tzn8.onrender.com/api/usage/real-time/', 
                   headers={'X-User-ID': 'test_user'})
print(resp.json())
"

# Test enforcement
python -c "
import requests
resp = requests.post('http://https://ed-tech-backend-tzn8.onrender.com/api/usage/enforce-check/',
                    json={'feature': 'quiz'},
                    headers={'X-User-ID': 'test_user'})
print(f'Status: {resp.status_code}')
print(resp.json())
"

# Test all features
python -c "
import requests
resp = requests.post('http://https://ed-tech-backend-tzn8.onrender.com/api/usage/test/all-features/',
                    headers={'X-User-ID': 'test_user'})
data = resp.json()
summary = data['test_results']['summary']
print(f'Available: {summary[\"features_available\"]}')
print(f'Restricted: {summary[\"features_restricted\"]}')
"
```

---

## Status

✅ Implementation Complete
✅ All endpoints functional
✅ Real-time tracking working
✅ Restrictions enforcing
✅ Documentation complete
✅ Test script provided

Ready for production use! 🚀

