#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="${BASE_URL:-https://ed-tech-backend-tzn8.onrender.com}"
API_BASE="${BASE_URL%/}/api"

TOTAL=0
PASSED=0

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo -e "${RED}Missing dependency: $1${NC}"
    exit 1
  }
}

require_cmd curl
require_cmd python3

api_call() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  if [[ -n "$body" ]]; then
    curl -sS --connect-timeout 10 --max-time 60 -w '\n%{http_code}' -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS --connect-timeout 10 --max-time 60 -w '\n%{http_code}' -X "$method" "$url" \
      -H "Content-Type: application/json"
  fi
}

assert_json_has_key() {
  local body="$1"
  local key="$2"
  python3 - "$body" "$key" <<'PY'
import json, sys
body = sys.argv[1]
key = sys.argv[2]
try:
    data = json.loads(body)
except Exception:
    print("invalid-json")
    raise SystemExit(1)
if key not in data:
    print(f"missing-key:{key}")
    raise SystemExit(1)
PY
}

run_test() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local expected_status="$4"
  local expected_key="$5"
  local body="${6:-}"

  TOTAL=$((TOTAL + 1))
  echo -e "${YELLOW}[$TOTAL] $name${NC}"

  local raw response status
  raw="$(api_call "$method" "${API_BASE}${endpoint}" "$body")"
  status="${raw##*$'\n'}"
  response="${raw%$'\n'*}"

  if [[ "$status" != "$expected_status" ]]; then
    echo -e "${RED}✗ FAILED${NC} expected status=$expected_status got=$status"
    echo "$response"
    exit 1
  fi

  assert_json_has_key "$response" "$expected_key" >/dev/null
  PASSED=$((PASSED + 1))
  echo -e "${GREEN}✓ PASSED${NC} status=$status key=$expected_key"
}

echo -e "${BLUE}Running Ask Question E2E tests against: ${API_BASE}${NC}"

run_test "Status endpoint" "GET" "/ask-question/status/" "200" "status"
run_test "Search: biology question" "POST" "/ask-question/search/" "200" "question" '{"question":"What is photosynthesis?","max_results":5}'
run_test "Search: math question" "POST" "/ask-question/search/" "200" "question" '{"question":"How to solve quadratic equations?","max_results":3}'
run_test "Search: with language" "POST" "/ask-question/search/" "200" "question" '{"question":"What is gravity?","language":"en","max_results":2}'
run_test "AI: concise" "POST" "/ask-question/ai/" "200" "answer" '{"question":"What is DNA?","detailed":false,"max_results":3}'
run_test "AI: detailed" "POST" "/ask-question/ai/" "200" "answer" '{"question":"Explain the carbon cycle","detailed":true,"max_results":4}'
run_test "Validation: empty question" "POST" "/ask-question/search/" "400" "error" '{"question":""}'
run_test "Validation: too short" "POST" "/ask-question/search/" "400" "error" '{"question":"ab"}'
run_test "Validation: AI empty" "POST" "/ask-question/ai/" "400" "error" '{"question":""}'

echo -e "${GREEN}All ask-question tests passed ($PASSED/$TOTAL).${NC}"
