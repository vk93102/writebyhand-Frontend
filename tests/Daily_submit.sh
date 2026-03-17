#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://ed-tech-backend-tzn8.onrender.com}"
API_BASE="${BASE_URL%/}/api"
AUTH_TOKEN="${AUTH_TOKEN:-}"
USER_ID="${USER_ID:-8}"
LANGUAGE="${LANGUAGE:-english}"

if [[ -z "$AUTH_TOKEN" ]]; then
  echo "Skipping Daily_submit.sh (AUTH_TOKEN not set)."
  exit 0
fi

COOKIE_JAR="/tmp/quiz_cookies_$$.txt"

GET_RAW=$(curl -sS -w '\n%{http_code}' -c "$COOKIE_JAR" -X GET "${API_BASE}/quiz/daily-quiz/?user_id=${USER_ID}&language=${LANGUAGE}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json")
GET_STATUS="${GET_RAW##*$'\n'}"
GET_BODY="${GET_RAW%$'\n'*}"

[[ "$GET_STATUS" == "200" ]] || { echo "$GET_BODY"; rm -f "$COOKIE_JAR"; exit 1; }

QUIZ_ID=$(python3 - "$GET_BODY" <<'PY'
import json,sys
print((json.loads(sys.argv[1]).get('quiz_id') or '').strip())
PY
)

[[ -n "$QUIZ_ID" ]] || { echo "quiz_id missing"; rm -f "$COOKIE_JAR"; exit 1; }

SUBMIT_RAW=$(curl -sS -w '\n%{http_code}' -b "$COOKIE_JAR" -X POST "${API_BASE}/quiz/daily-quiz/submit/" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"${USER_ID}\",\"quiz_id\":\"${QUIZ_ID}\",\"language\":\"${LANGUAGE}\",\"answers\":{\"1\":1,\"2\":1,\"3\":1,\"4\":1,\"5\":1}}")
SUBMIT_STATUS="${SUBMIT_RAW##*$'\n'}"
SUBMIT_BODY="${SUBMIT_RAW%$'\n'*}"

[[ "$SUBMIT_STATUS" == "200" ]] || { echo "$SUBMIT_BODY"; rm -f "$COOKIE_JAR"; exit 1; }

rm -f "$COOKIE_JAR"
echo "Daily_submit.sh passed"
