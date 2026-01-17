#!/bin/bash
set -e

TOKEN=$(python3 - <<'PY'
import jwt
from datetime import datetime, timedelta
print(jwt.encode({"user_id":8,"username":"user8","email":"user8@example.com","exp":datetime.utcnow()+timedelta(hours=24),"iat":datetime.utcnow()},"4f5e2bac434c38bcf80b3f71df16ad50",algorithm="HS256"))
PY
)

echo "Token: $TOKEN"

echo "\n--- GET /api/quiz/daily-quiz/ (saving cookies to /tmp/quiz_cookies.txt) ---"
curl -s -c /tmp/quiz_cookies.txt -X GET "https://ed-tech-backend-tzn8.onrender.com/api/quiz/daily-quiz/?user_id=8&language=english" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -o /tmp/quiz_get.json

echo "GET response:"
cat /tmp/quiz_get.json | jq '.'

QUIZ_ID=$(jq -r '.quiz_id' /tmp/quiz_get.json)

echo "\nQuiz ID: $QUIZ_ID"

if [ -z "$QUIZ_ID" ] || [ "$QUIZ_ID" = "null" ]; then
  echo "No quiz_id found; aborting."
  exit 1
fi

echo "\n--- POST /api/quiz/daily-quiz/submit/ (using saved cookies) ---"
curl -s -b /tmp/quiz_cookies.txt -X POST "https://ed-tech-backend-tzn8.onrender.com/api/quiz/daily-quiz/submit/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"8\",\"quiz_id\":\"$QUIZ_ID\",\"language\":\"english\",\"answers\":{\"1\":1,\"2\":1,\"3\":1,\"4\":1,\"5\":1}}" | jq '.'
