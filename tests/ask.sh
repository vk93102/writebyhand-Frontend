#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://ed-tech-backend-tzn8.onrender.com}"
API_BASE="${BASE_URL%/}/api"
STRICT_E2E="${STRICT_E2E:-0}"

preflight() {
  local probe
  probe=$(curl -sS --connect-timeout 8 --max-time 20 -w '\n%{http_code}' -X GET "${API_BASE}/ask-question/status/" -H 'Content-Type: application/json' || true)
  local status="${probe##*$'\n'}"

  if [[ "$status" != "200" ]]; then
    if [[ "$STRICT_E2E" == "1" ]]; then
      echo "Backend unavailable for strict E2E (status=${status}). Failing."
      exit 1
    fi
    echo "Backend unavailable (status=${status}). Skipping ask-question E2E."
    exit 0
  fi
}

run() {
  local method="$1"; shift
  local endpoint="$1"; shift
  local expected="$1"; shift
  local key="$1"; shift
  local body="${1:-}"

  local raw status payload
  if [[ -n "$body" ]]; then
    raw=$(curl -sS -w '\n%{http_code}' -X "$method" "${API_BASE}${endpoint}" -H 'Content-Type: application/json' -d "$body")
  else
    raw=$(curl -sS -w '\n%{http_code}' -X "$method" "${API_BASE}${endpoint}" -H 'Content-Type: application/json')
  fi

  status="${raw##*$'\n'}"
  payload="${raw%$'\n'*}"

  if [[ "$status" != "$expected" ]]; then
    echo "FAILED $method $endpoint expected=$expected got=$status"
    echo "$payload"
    exit 1
  fi

  python3 - "$payload" "$key" <<'PY'
import json, sys
obj=json.loads(sys.argv[1])
key=sys.argv[2]
if key not in obj:
    print(f"missing key: {key}")
    raise SystemExit(1)
PY
}

preflight

run GET  /ask-question/status/ 200 status
run POST /ask-question/search/ 200 question '{"question":"What is photosynthesis?","max_results":5}'
run POST /ask-question/ai/ 200 answer '{"question":"What is DNA?","detailed":false,"max_results":3}'
run POST /ask-question/search/ 400 error '{"question":""}'
run POST /ask-question/search/ 400 error '{"question":"ab"}'
run POST /ask-question/ai/ 400 error '{"question":""}'

echo "ask.sh passed"
