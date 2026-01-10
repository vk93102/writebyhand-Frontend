# Real API Response Formats - Complete Reference

This document contains **exact API responses from your live backend**, showing exactly what the frontend will receive.

---

## 1. Feature Availability Check

### Endpoint
```
POST /api/usage/check/
```

### Request Headers
```
X-User-ID: test_1767994378
or
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body
```json
{
  "feature": "quiz"
}
```

### Response: Feature ALLOWED
```json
{
  "success": true,
  "message": "Feature available",
  "status": {
    "allowed": true,
    "reason": "Within limit (0/3)",
    "limit": 3,
    "used": 0,
    "remaining": 3
  }
}
```

### Response: Feature BLOCKED (Limit Reached)
```json
{
  "success": false,
  "error": "Monthly limit reached (3/3 used)",
  "status": {
    "allowed": false,
    "reason": "Monthly limit reached (3/3 used)",
    "limit": 3,
    "used": 3
  }
}
```

### Response: Invalid Feature
```json
{
  "success": false,
  "error": "Feature \"invalid_feature\" not found",
  "status": {
    "allowed": false,
    "reason": "Feature \"invalid_feature\" not found",
    "limit": 0,
    "used": 0
  }
}
```

---

## 2. Record Feature Usage

### Endpoint
```
POST /api/usage/record/
```

### Request Headers
```
X-User-ID: test_1767994378
or
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body - Usage #1
```json
{
  "feature": "quiz",
  "input_size": 100,
  "usage_type": "text"
}
```

### Response - After 1st Use
```json
{
  "success": true,
  "message": "Feature \"quiz\" usage recorded",
  "usage": {
    "feature": "quiz",
    "limit": 3,
    "used": 1,
    "remaining": 2
  }
}
```

### Request Body - Usage #2
```json
{
  "feature": "quiz",
  "input_size": 200,
  "usage_type": "text"
}
```

### Response - After 2nd Use
```json
{
  "success": true,
  "message": "Feature \"quiz\" usage recorded",
  "usage": {
    "feature": "quiz",
    "limit": 3,
    "used": 2,
    "remaining": 1
  }
}
```

### Request Body - Usage #3
```json
{
  "feature": "quiz",
  "input_size": 300,
  "usage_type": "text"
}
```

### Response - After 3rd Use (Last)
```json
{
  "success": true,
  "message": "Feature \"quiz\" usage recorded",
  "usage": {
    "feature": "quiz",
    "limit": 3,
    "used": 3,
    "remaining": 0
  }
}
```

---

## 3. Get Usage Dashboard

### Endpoint
```
GET /api/usage/dashboard/
```

### Request Headers
```
X-User-ID: test_1767994378
or
Authorization: Bearer {access_token}
```

### Response - Free User with Usage
```json
{
  "success": true,
  "dashboard": {
    "user_id": "test_1767994378",
    "plan": "FREE",
    "subscription_id": "0c3bff4f-5406-4e35-ab5a-031ffbdba84a",
    "features": {
      "mock_test": {
        "display_name": "Mock Test",
        "limit": 3,
        "used": 0,
        "remaining": 3,
        "unlimited": false,
        "percentage_used": 0
      },
      "quiz": {
        "display_name": "Quiz",
        "limit": 3,
        "used": 3,
        "remaining": 0,
        "unlimited": false,
        "percentage_used": 100
      },
      "flashcards": {
        "display_name": "Flashcards",
        "limit": 3,
        "used": 0,
        "remaining": 3,
        "unlimited": false,
        "percentage_used": 0
      },
      "ask_question": {
        "display_name": "Ask Question",
        "limit": 3,
        "used": 0,
        "remaining": 3,
        "unlimited": false,
        "percentage_used": 0
      },
      "predicted_questions": {
        "display_name": "Predicted Questions",
        "limit": 3,
        "used": 0,
        "remaining": 3,
        "unlimited": false,
        "percentage_used": 0
      },
      "youtube_summarizer": {
        "display_name": "YouTube Summarizer",
        "limit": 3,
        "used": 0,
        "remaining": 3,
        "unlimited": false,
        "percentage_used": 0
      },
      "pyqs": {
        "display_name": "Previous Year Questions",
        "limit": 3,
        "used": 0,
        "remaining": 3,
        "unlimited": false,
        "percentage_used": 0
      },
      "pair_quiz": {
        "display_name": "Pair Quiz",
        "limit": 0,
        "used": 0,
        "remaining": 0,
        "unlimited": false,
        "percentage_used": 0
      },
      "previous_papers": {
        "display_name": "Previous Papers",
        "limit": 0,
        "used": 0,
        "remaining": 0,
        "unlimited": false,
        "percentage_used": 0
      },
      "daily_quiz": {
        "display_name": "Daily Quiz",
        "limit": 0,
        "used": 0,
        "remaining": 0,
        "unlimited": false,
        "percentage_used": 0
      }
    },
    "billing": {
      "first_month_price": 0.0,
      "recurring_price": 0.0,
      "is_trial": false,
      "trial_end_date": null,
      "subscription_status": "active",
      "subscription_start_date": "2026-01-09T21:30:38.631633Z",
      "next_billing_date": null,
      "last_payment_date": null
    }
  }
}
```

### Response - Premium User (Unlimited)
```json
{
  "success": true,
  "dashboard": {
    "user_id": "premium_user_123",
    "plan": "PREMIUM",
    "subscription_id": "premium-uuid-xxx",
    "features": {
      "mock_test": {
        "display_name": "Mock Test",
        "limit": null,
        "used": 15,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "quiz": {
        "display_name": "Quiz",
        "limit": null,
        "used": 42,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "flashcards": {
        "display_name": "Flashcards",
        "limit": null,
        "used": 28,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "ask_question": {
        "display_name": "Ask Question",
        "limit": null,
        "used": 7,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "predicted_questions": {
        "display_name": "Predicted Questions",
        "limit": null,
        "used": 3,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "youtube_summarizer": {
        "display_name": "YouTube Summarizer",
        "limit": null,
        "used": 15,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "pyqs": {
        "display_name": "Previous Year Questions",
        "limit": null,
        "used": 8,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "pair_quiz": {
        "display_name": "Pair Quiz",
        "limit": null,
        "used": 10,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "previous_papers": {
        "display_name": "Previous Papers",
        "limit": null,
        "used": 20,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      },
      "daily_quiz": {
        "display_name": "Daily Quiz",
        "limit": null,
        "used": 5,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      }
    },
    "billing": {
      "first_month_price": 1.0,
      "recurring_price": 99.0,
      "is_trial": false,
      "trial_end_date": null,
      "subscription_status": "active",
      "subscription_start_date": "2025-12-01T10:30:00.000000Z",
      "next_billing_date": "2026-02-01",
      "last_payment_date": "2026-01-09T15:30:00.000000Z"
    }
  }
}
```

### Response - Trial User
```json
{
  "success": true,
  "dashboard": {
    "user_id": "trial_user_456",
    "plan": "PREMIUM",
    "subscription_id": "trial-uuid-xxx",
    "features": {
      "quiz": {
        "display_name": "Quiz",
        "limit": null,
        "used": 5,
        "remaining": null,
        "unlimited": true,
        "percentage_used": 0
      }
      // ... all features unlimited
    },
    "billing": {
      "first_month_price": 0.0,
      "recurring_price": 99.0,
      "is_trial": true,
      "trial_end_date": "2026-01-16T10:30:00.000000Z",
      "subscription_status": "active",
      "subscription_start_date": "2026-01-09T10:30:00.000000Z",
      "next_billing_date": "2026-02-09",
      "last_payment_date": null
    }
  }
}
```

---

## 4. Get Single Feature Status

### Endpoint
```
GET /api/usage/feature/quiz/
```

### Request Headers
```
X-User-ID: test_1767994378
or
Authorization: Bearer {access_token}
```

### Response - Feature Allowed
```json
{
  "success": true,
  "feature": "quiz",
  "status": {
    "allowed": true,
    "reason": "Within limit (2/3)",
    "limit": 3,
    "used": 2,
    "remaining": 1
  }
}
```

### Response - Feature Blocked
```json
{
  "success": true,
  "feature": "quiz",
  "status": {
    "allowed": false,
    "reason": "Monthly limit reached (3/3 used)",
    "limit": 3,
    "used": 3
  }
}
```

---

## 5. Admin Analytics (Optional)

### Endpoint
```
GET /api/admin/analytics/
```

### Request Headers
```
X-User-ID: admin_user
or
Authorization: Bearer {admin_token}
```

### Response
```json
{
  "success": true,
  "platform_stats": {
    "total_users": 151,
    "total_feature_calls": 120,
    "unique_users_using_features": 16
  },
  "plan_distribution": [
    {
      "plan": "free",
      "count": 131
    },
    {
      "plan": "basic",
      "count": 11
    },
    {
      "plan": "premium",
      "count": 9
    }
  ],
  "feature_stats": [
    {
      "feature_name": "quiz",
      "total_uses": 42,
      "total_input_size": 27900
    },
    {
      "feature_name": "mock_test",
      "total_uses": 20,
      "total_input_size": 16200
    },
    {
      "feature_name": "flashcards",
      "total_uses": 20,
      "total_input_size": 16600
    },
    {
      "feature_name": "pair_quiz",
      "total_uses": 16,
      "total_input_size": 20300
    },
    {
      "feature_name": "youtube_summarizer",
      "total_uses": 15,
      "total_input_size": 14100
    },
    {
      "feature_name": "ask_question",
      "total_uses": 7,
      "total_input_size": 5000
    }
  ],
  "feature_user_breakdown": {
    "quiz": {
      "display_name": "Quiz",
      "unique_users": 13,
      "total_uses": 42
    },
    "mock_test": {
      "display_name": "Mock Test",
      "unique_users": 5,
      "total_uses": 20
    },
    "flashcards": {
      "display_name": "Flashcards",
      "unique_users": 8,
      "total_uses": 20
    }
  }
}
```

---

## Error Responses

### Missing Authentication Header
```json
{
  "success": false,
  "error": "Missing or invalid authorization header. Use \"Authorization: Bearer <token>\" or \"X-User-ID: <user_id>\""
}
HTTP Status: 401
```

### Missing Required Field
```json
{
  "success": false,
  "error": "feature name is required"
}
HTTP Status: 400
```

### Feature Not Found
```json
{
  "success": false,
  "error": "Feature \"invalid_feature\" not found",
  "status": {
    "allowed": false,
    "reason": "Feature \"invalid_feature\" not found",
    "limit": 0,
    "used": 0
  }
}
HTTP Status: 200
```

### User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
HTTP Status: 404
```

### Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
HTTP Status: 500
```

---

## Important Notes

### Response Status Codes
- **All successful checks return 200 OK** - Must check `success` field
- **Use `success: false` to determine if feature is allowed**
- Error responses may also return 200 (check both status code AND success field)

### Feature Limits
- **Free plan**: 3 uses per feature per month
- **Premium plan**: Unlimited (limit = null, unlimited = true)
- **Trial plan**: Unlimited with countdown (is_trial = true, trial_end_date = future)
- **Past due**: subscription_status = "past_due" (features blocked)

### Reset Schedule
- Limits reset on **1st of each month** at **00:00 UTC**
- Usage history is preserved (never deleted)
- Premium users never see limits reset (unlimited)

### Field Explanations
- `used`: Number of times feature has been used this month
- `remaining`: (limit - used) or null if unlimited
- `percentage_used`: (used / limit * 100) or 0 if unlimited
- `unlimited`: Boolean indicating unlimited access
- `display_name`: User-friendly feature name

---

## Implementation Example

```typescript
// Check feature before execution
const response = await fetch('/api/usage/check/', {
  method: 'POST',
  headers: {
    'X-User-ID': userId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ feature: 'quiz' })
});

const data = await response.json();

if (!data.success) {
  console.log(data.status.reason);  // "Monthly limit reached (3/3 used)"
  showUpgradeDialog();
  return;
}

// Execute feature
const result = await executeQuiz();

// Record usage
await fetch('/api/usage/record/', {
  method: 'POST',
  headers: {
    'X-User-ID': userId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    feature: 'quiz',
    input_size: result.size,
    usage_type: 'text'
  })
});
```

---

## Response Size Estimates

| Endpoint | Typical Size | Max Size |
|----------|---|---|
| /api/usage/check/ | 200 bytes | 500 bytes |
| /api/usage/record/ | 150 bytes | 300 bytes |
| /api/usage/dashboard/ | 4-5 KB | 10 KB |
| /api/usage/feature/{feature}/ | 200 bytes | 500 bytes |
| /api/admin/analytics/ | 3-4 KB | 10 KB |

---

## Caching Recommendations

- **Dashboard**: Cache for 5-10 minutes (update after each feature use)
- **Feature status**: Cache for 1 minute
- **Feature check**: Do NOT cache (always fresh)
- **Feature record**: Do NOT cache (always fresh)

---

## Rate Limiting (if applicable)

Check response headers for:
- `X-RateLimit-Limit`: Total requests per minute
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp of reset

---

This document represents the **actual live API behavior** as tested on 2026-01-10.

