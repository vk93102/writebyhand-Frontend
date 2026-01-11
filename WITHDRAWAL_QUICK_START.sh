#!/bin/bash

# WITHDRAWAL FEATURE - QUICK START GUIDE
# ====================================

echo "🚀 Withdrawal Feature - Quick Start Guide"
echo "========================================"
echo ""

# 1. Test API Endpoint
echo "1️⃣  Testing API Endpoint"
echo "Run this command to test UPI withdrawal:"
echo ""
echo 'curl -X POST http://https://ed-tech-backend-tzn8.onrender.com/api/razorpay/withdraw/ \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"user_id": "test_user_123", "amount": 50, "upi_id": "user@ybl"}'"'"
echo ""
echo "---"
echo ""

# 2. Frontend Integration
echo "2️⃣  Frontend Integration"
echo "The WithdrawalScreen component is ready to use:"
echo ""
echo "Import:"
echo "  import { WithdrawalScreen } from '../components/WithdrawalScreen';"
echo ""
echo "Use in your screen:"
echo '  <WithdrawalScreen'
echo '    userId={userId}'
echo '    onClose={() => setShowWithdrawal(false)}'
echo '    onWithdrawalSuccess={() => handleSuccess()}'
echo '  />'
echo ""
echo "---"
echo ""

# 3. API Function
echo "3️⃣  API Function Usage"
echo "Direct API call:"
echo ""
echo "import { requestCoinWithdrawal } from '../services/api';"
echo ""
echo "const response = await requestCoinWithdrawal("
echo "  userId,              // string"
echo "  coinsAmount,         // number (e.g., 100)"
echo "  'upi',               // 'upi' or 'bank'"
echo "  'John Doe',          // account holder name"
echo "  'john@ybl'           // UPI ID"
echo ");"
echo ""
echo "---"
echo ""

# 4. Custom Hooks
echo "4️⃣  Custom Hooks"
echo ""
echo "useWithdrawal() - State management"
echo "  const { loading, error, submitWithdrawal } = useWithdrawal();"
echo ""
echo "useWithdrawalValidation() - Validation helpers"
echo "  const { validateAmount, validateUPI } = useWithdrawalValidation();"
echo ""
echo "useWithdrawalForm() - Form state"
echo "  const { coinsAmount, setCoinsAmount, reset } = useWithdrawalForm();"
echo ""
echo "---"
echo ""

# 5. Validation Rules
echo "5️⃣  Validation Rules"
echo ""
echo "Amount:"
echo "  ✅ Minimum: 100 coins (₹10)"
echo "  ✅ Maximum: User balance"
echo "  ✅ Must be positive integer"
echo ""
echo "UPI Format:"
echo "  ✅ Example: john@ybl, user@okhdfcbank"
echo "  ❌ Invalid: invalid@, @ybl, john@@ybl"
echo ""
echo "Bank Details:"
echo "  ✅ Account: 9-18 digits"
echo "  ✅ IFSC: SBIN0001234 format"
echo "  ❌ Invalid account: 12345, sbin0001234 (lowercase)"
echo ""
echo "---"
echo ""

# 6. Response Format
echo "6️⃣  Response Format"
echo ""
echo "Success Response:"
echo "  {"
echo '    "success": true,'
echo '    "data": {'
echo '      "withdrawal_id": "WD_123",'
echo '      "amount": 50,'
echo '      "remaining_coins": 450,'
echo '      "status": "processing"'
echo "    }"
echo "  }"
echo ""
echo "---"
echo ""

# 7. Testing Checklist
echo "7️⃣  Testing Checklist"
echo ""
echo "  [ ] UPI withdrawal with valid amount"
echo "  [ ] Bank transfer with valid details"
echo "  [ ] Insufficient balance error handling"
echo "  [ ] Invalid format error handling"
echo "  [ ] Form resets after successful submission"
echo "  [ ] Withdrawal ID displayed in success alert"
echo "  [ ] Loading spinner shows during submission"
echo "  [ ] Error alert displays user-friendly message"
echo ""
echo "---"
echo ""

# 8. Documentation
echo "8️⃣  Documentation Files"
echo ""
echo "  📄 WITHDRAWAL_FEATURE_SUMMARY.md"
echo "     └─ Quick overview and checklist"
echo ""
echo "  📄 WITHDRAWAL_IMPLEMENTATION_GUIDE.md"
echo "     └─ Technical architecture and API specs"
echo ""
echo "  📄 WITHDRAWAL_TESTING_GUIDE.md"
echo "     └─ Testing procedures and test cases"
echo ""
echo "  💻 src/components/WithdrawalScreen.tsx"
echo "     └─ Main UI component"
echo ""
echo "  🔧 src/services/api.ts"
echo "     └─ API integration function"
echo ""
echo "  🪝 src/hooks/useWithdrawal.ts"
echo "     └─ Custom React hooks"
echo ""
echo "  🧪 src/services/withdrawalTests.ts"
echo "     └─ Test suite"
echo ""
echo "---"
echo ""

# 9. Environment Setup
echo "9️⃣  Environment Setup"
echo ""
echo "For localhost development:"
echo "  API_BASE_URL=http://https://ed-tech-backend-tzn8.onrender.com/api"
echo ""
echo "For production:"
echo "  API_BASE_URL=https://api.yourdomain.com/api"
echo ""
echo "---"
echo ""

# 10. Next Steps
echo "🔟 Next Steps"
echo ""
echo "1. Backend: Implement POST /api/razorpay/withdraw/ endpoint"
echo "2. Backend: Ensure coin deduction on success"
echo "3. Backend: Return withdrawal_id and remaining_coins"
echo "4. Testing: Run test cases from WITHDRAWAL_TESTING_GUIDE.md"
echo "5. QA: Follow testing checklist"
echo "6. Deploy: Follow pre-production checklist"
echo ""
echo "---"
echo ""

echo "✅ Setup complete! The withdrawal feature is ready to test."
echo ""
echo "📚 For detailed information, see WITHDRAWAL_FEATURE_SUMMARY.md"
echo ""
