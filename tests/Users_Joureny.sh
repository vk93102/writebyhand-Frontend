#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://ed-tech-backend-tzn8.onrender.com}"
API_BASE="${BASE_URL%/}/api"
AUTH_TOKEN="${AUTH_TOKEN:-}"
USER_ID="${USER_ID:-8}"
LANGUAGE="${LANGUAGE:-english}"

if [[ -z "$AUTH_TOKEN" ]]; then
  echo "Skipping daily-quiz authenticated E2E: set AUTH_TOKEN to run this test."
  exit 0
fi

COOKIE_JAR="/tmp/quiz_cookies_$$.txt"

echo "GET ${API_BASE}/quiz/daily-quiz/?user_id=${USER_ID}&language=${LANGUAGE}"
GET_RAW=$(curl -sS -w '\n%{http_code}' -c "$COOKIE_JAR" -X GET "${API_BASE}/quiz/daily-quiz/?user_id=${USER_ID}&language=${LANGUAGE}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json")
GET_STATUS="${GET_RAW##*$'\n'}"
GET_BODY="${GET_RAW%$'\n'*}"

if [[ "$GET_STATUS" != "200" ]]; then
  echo "daily-quiz GET failed with status=$GET_STATUS"
  echo "$GET_BODY"
  rm -f "$COOKIE_JAR"
  exit 1
fi

QUIZ_ID=$(python3 - "$GET_BODY" <<'PY'
import json,sys
data=json.loads(sys.argv[1])
print(data.get("quiz_id") or "")
PY
)

if [[ -z "$QUIZ_ID" ]]; then
  echo "No quiz_id found in GET response"
  echo "$GET_BODY"
  rm -f "$COOKIE_JAR"
  exit 1
fi

echo "POST ${API_BASE}/quiz/daily-quiz/submit/"
SUBMIT_RAW=$(curl -sS -w '\n%{http_code}' -b "$COOKIE_JAR" -X POST "${API_BASE}/quiz/daily-quiz/submit/" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"${USER_ID}\",\"quiz_id\":\"${QUIZ_ID}\",\"language\":\"${LANGUAGE}\",\"answers\":{\"1\":1,\"2\":1,\"3\":1,\"4\":1,\"5\":1}}")
SUBMIT_STATUS="${SUBMIT_RAW##*$'\n'}"
SUBMIT_BODY="${SUBMIT_RAW%$'\n'*}"

if [[ "$SUBMIT_STATUS" != "200" ]]; then
  echo "daily-quiz submit failed with status=$SUBMIT_STATUS"
  echo "$SUBMIT_BODY"
  rm -f "$COOKIE_JAR"
  exit 1
fi

echo "daily-quiz E2E passed"
rm -f "$COOKIE_JAR"
