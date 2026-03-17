#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/tests/ask.sh"
bash "$ROOT_DIR/tests/payment.sh"
bash "$ROOT_DIR/tests/Daily_submit.sh"

echo "All E2E tests passed"
