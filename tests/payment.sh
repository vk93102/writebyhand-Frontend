#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://ed-tech-backend-tzn8.onrender.com}"
API_BASE="${BASE_URL%/}/api"
AUTH_TOKEN="${AUTH_TOKEN:-}"
USER_ID="${USER_ID:-}"

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || {
        echo "Missing command: $1"
        exit 1
    }
}

require_cmd curl
require_cmd python3

call_api() {
    local method="$1"
    local url="$2"
    local data="${3:-}"
    local auth_header=()

    if [[ -n "$AUTH_TOKEN" ]]; then
        auth_header=(-H "Authorization: Bearer ${AUTH_TOKEN}")
    fi

    if [[ -n "$data" ]]; then
        curl -sS --connect-timeout 10 --max-time 60 -w '\n%{http_code}' -X "$method" "$url" \
            -H "Content-Type: application/json" "${auth_header[@]}" -d "$data"
    else
        curl -sS --connect-timeout 10 --max-time 60 -w '\n%{http_code}' -X "$method" "$url" \
            -H "Content-Type: application/json" "${auth_header[@]}"
    fi
}

expect_status() {
    local raw="$1"
    local expected="$2"
    local name="$3"
    local status body

    status="${raw##*$'\n'}"
    body="${raw%$'\n'*}"
    if [[ "$status" != "$expected" ]]; then
        echo "${name} failed: expected status=${expected}, got=${status}"
        echo "$body"
        exit 1
    fi
    echo "${name} passed (status ${status})"
}

echo "Running payment/subscription E2E tests against ${API_BASE}"

RAW=$(call_api "GET" "${API_BASE}/subscription/status/")
expect_status "$RAW" "400" "subscription status without user_id"

if [[ -n "$USER_ID" ]]; then
    RAW=$(call_api "GET" "${API_BASE}/subscription/status/?user_id=${USER_ID}")
    expect_status "$RAW" "200" "subscription status with user_id"

    RAW=$(call_api "GET" "${API_BASE}/quiz/daily-quiz/coins/?user_id=${USER_ID}")
    expect_status "$RAW" "200" "daily quiz coins"

    RAW=$(call_api "POST" "${API_BASE}/payment/create-order/" "{\"user_id\":\"${USER_ID}\",\"plan\":\"premium\"}")
    expect_status "$RAW" "200" "payment create order"
else
    echo "Skipping user-specific tests: set USER_ID to run authenticated flow checks."
fi

echo "Payment/subscription E2E tests passed"
