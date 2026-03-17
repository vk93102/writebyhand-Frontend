#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

chmod +x "$ROOT_DIR/tests/ask.sh" "$ROOT_DIR/tests/payment.sh" "$ROOT_DIR/tests/Daily_submit.sh"

"$ROOT_DIR/tests/ask.sh"
"$ROOT_DIR/tests/payment.sh"
"$ROOT_DIR/tests/Daily_submit.sh"

echo "All E2E scripts completed successfully"
