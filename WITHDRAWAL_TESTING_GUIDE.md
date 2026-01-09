# Withdrawal Feature - Testing Guide

## Overview
The withdrawal feature allows users to withdraw their earned coins via UPI or Bank Transfer. The system converts coins to rupees (10 coins = ₹1) and processes the withdrawal request.

## API Endpoint
**POST** `/api/razorpay/withdraw/`

### Request Format
```json
{
  "user_id": "string",
  "amount": "number (rupees, not coins)",
  "upi_id": "string (required for UPI)" OR
  "account_number": "string (required for bank)" AND
  "ifsc_code": "string (required for bank)"
}
```

### Response Format
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "withdrawal_id": "WD_1234567890",
    "amount": 50,
    "rupees_amount": "50.00",
    "status": "processing",
    "upi_id": "user@ybl",
    "remaining_coins": 450,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Testing Scenarios

### 1. Test UPI Withdrawal
```bash
curl -X POST http://localhost:8000/api/razorpay/withdraw/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "amount": 50,
    "upi_id": "user@ybl"
  }'
```

**Expected Response:**
- Status: 200 OK
- Contains `withdrawal_id`, `remaining_coins`, and `status: processing`

### 2. Test Bank Transfer
```bash
curl -X POST http://localhost:8000/api/razorpay/withdraw/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_456",
    "amount": 100,
    "account_number": "1234567890123456",
    "ifsc_code": "SBIN0001234"
  }'
```

**Expected Response:**
- Status: 200 OK
- Contains `withdrawal_id` and processing status

### 3. Test Insufficient Balance (Should Fail)
```bash
curl -X POST http://localhost:8000/api/razorpay/withdraw/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_789",
    "amount": 10000,
    "upi_id": "user@ybl"
  }'
```

**Expected Response:**
- Status: 400 or 422
- Error message: "Insufficient balance"

### 4. Test Missing UPI ID (Should Fail)
```bash
curl -X POST http://localhost:8000/api/razorpay/withdraw/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_101",
    "amount": 50
  }'
```

**Expected Response:**
- Status: 400 or 422
- Error message: "UPI ID or bank details required"

### 5. Test Invalid Bank Details (Should Fail)
```bash
curl -X POST http://localhost:8000/api/razorpay/withdraw/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_202",
    "amount": 100,
    "account_number": "123",
    "ifsc_code": "INVALID"
  }'
```

**Expected Response:**
- Status: 400 or 422
- Error message: "Invalid account details"

## Frontend Validation Rules

### Before Submission, the app validates:

1. **Coins Amount:**
   - Must be a number > 0
   - Minimum: 100 coins (₹10)
   - Maximum: Available user balance
   - Example: ✅ 100, 500, 1000 | ❌ 50, -100, 0

2. **Account Holder Name:**
   - Required field
   - Must not be empty
   - Example: ✅ "John Doe" | ❌ "" (empty)

3. **UPI Method Validation:**
   - UPI ID is required
   - Format: `username@bankname` (e.g., `john@ybl`, `user@okhdfcbank`)
   - Regex: `/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/`
   - Example: ✅ `john@ybl`, `user@okhdfcbank` | ❌ `invalid@`, `nobank@`, `john@@ybl`

4. **Bank Method Validation:**
   - Account Number: 9-18 digits
   - IFSC Code: Format like `SBIN0001234` (4 uppercase letters + 0 + 6 alphanumeric)
   - Both fields required
   - Example: ✅ `SBIN0001234`, `HDFC0002345` | ❌ `SBIN123`, `sbin0001234` (lowercase), `SBIN00012345678901` (too long)

## Testing Checklist

### ✅ Happy Path Tests
- [ ] UPI withdrawal with valid amount
- [ ] Bank withdrawal with valid details
- [ ] Coin-to-rupee conversion is correct (100 coins → ₹10)
- [ ] Coins are deducted from balance
- [ ] Withdrawal ID is returned
- [ ] Status shows as "processing"

### ✅ Validation Tests
- [ ] Minimum amount (100 coins) enforced
- [ ] Maximum amount (user balance) enforced
- [ ] UPI format validation works
- [ ] Bank account number length validation works
- [ ] IFSC code format validation works
- [ ] Account holder name is required
- [ ] Error messages are user-friendly

### ✅ Error Scenario Tests
- [ ] Insufficient balance error handling
- [ ] Invalid UPI format error handling
- [ ] Invalid bank details error handling
- [ ] Network error handling (if backend is down)
- [ ] Server 500 error handling
- [ ] Duplicate withdrawal prevention

### ✅ UI/UX Tests
- [ ] Loading spinner shows during submission
- [ ] Success alert displays withdrawal ID and remaining balance
- [ ] Error alert displays user-friendly error message
- [ ] Form resets after successful submission
- [ ] Close button works
- [ ] Payout method toggle works (UPI ↔ Bank)

## Backend Response Handling

The frontend expects these response structures:

### Success Response (200)
```javascript
{
  success: true,
  message: "...",
  data: {
    withdrawal_id: "WD_...",
    amount: 50,
    rupees_amount: "50.00",
    status: "processing",
    remaining_coins: 450,
    created_at: "2024-01-15T..."
  }
}
```

### Error Response (400/422)
```javascript
{
  success: false,
  message: "Error description here",
  // OR
  error: "Error description here"
}
```

The frontend will catch and display the `message` or `error` field to users.

## Important Notes

1. **Coins to Rupees Conversion:**
   - Formula: `rupees = coins / 10`
   - Example: 100 coins = ₹10, 500 coins = ₹50

2. **Withdrawal Status:**
   - Status should be "processing" after successful submission
   - Backend should process the actual payout separately

3. **Coin Deduction:**
   - Coins should be deducted immediately from user balance
   - Reflected in the `remaining_coins` in response

4. **Withdrawal ID:**
   - Should be unique for tracking
   - User can use it to check status later

5. **Error Handling:**
   - Always return meaningful error messages
   - Follow HTTP status codes (400 for validation, 500 for server errors)

## Production Checklist

Before deploying to production:

- [ ] Backend endpoint properly validates all inputs
- [ ] Database transaction ensures coin deduction on success
- [ ] Withdrawal ID generation is unique
- [ ] Rate limiting is implemented (e.g., 1 withdrawal per minute per user)
- [ ] Audit logs are created for all withdrawals
- [ ] Email confirmation is sent to user
- [ ] Duplicate withdrawal prevention is implemented
- [ ] Payment gateway integration is tested
- [ ] Rollback procedure is documented
- [ ] Monitoring and alerting are set up
