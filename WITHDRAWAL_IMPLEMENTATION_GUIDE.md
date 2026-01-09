# Withdrawal Feature - Complete Implementation Guide

## Overview
This document describes the complete implementation of the coin withdrawal feature for the Ed-Tech application. The feature allows users to withdraw earned coins via UPI or Bank Transfer.

## Architecture

```
User Interface (WithdrawalScreen.tsx)
         ↓
   Form Validation (useWithdrawal.ts hooks)
         ↓
   API Layer (api.ts - requestCoinWithdrawal)
         ↓
   Backend Endpoint (POST /api/razorpay/withdraw/)
         ↓
   Payment Processing (Razorpay integration)
```

## Components

### 1. WithdrawalScreen.tsx
**Purpose:** Main UI component for withdrawal requests

**Key Features:**
- Form for collecting withdrawal details
- Real-time balance display
- UPI and Bank transfer options
- Comprehensive input validation
- Loading states and error handling
- Success confirmation with withdrawal details

**Props:**
```typescript
interface WithdrawalScreenProps {
  userId: string;           // User identifier
  onClose: () => void;      // Callback to close modal
  onWithdrawalSuccess: () => void; // Callback after success
}
```

**State Management:**
```typescript
- userCoins: number           // Current coin balance
- loading: boolean            // API request loading state
- errorMessage: string        // Error message display
- coinsAmount: string         // Input field for coins
- payoutMethod: 'upi'|'bank' // Selected payout method
- accountHolderName: string   // Name for withdrawal
- upiId: string              // UPI ID (for UPI method)
- accountNumber: string      // Bank account (for bank method)
- ifscCode: string           // IFSC code (for bank method)
```

### 2. API Function - requestCoinWithdrawal()
**File:** `src/services/api.ts`

**Purpose:** Handle HTTP request to backend withdrawal endpoint

**Function Signature:**
```typescript
export const requestCoinWithdrawal = async (
  userId: string,
  coinsAmount: number,
  payoutMethod: 'upi' | 'bank',
  accountHolderName: string,
  upiId?: string,
  accountNumber?: string,
  ifscCode?: string
) => Promise<WithdrawalResponse>
```

**Request Payload:**
```json
{
  "user_id": "user_123",
  "amount": 50,                    // Amount in rupees (coinsAmount / 10)
  "upi_id": "user@ybl"            // For UPI method
}
// OR for bank transfer
{
  "user_id": "user_123",
  "amount": 100,
  "account_number": "1234567890",
  "ifsc_code": "SBIN0001234"
}
```

**Response:**
```typescript
interface WithdrawalResponse {
  success: boolean;
  message: string;
  data: {
    withdrawal_id: string;      // Unique withdrawal identifier
    amount: number;             // Amount in rupees
    rupees_amount: string;      // Formatted amount
    status: string;             // "processing" | "completed" | "failed"
    upi_id?: string;           // For UPI withdrawals
    remaining_coins: number;    // Updated coin balance
    created_at: string;         // ISO timestamp
  }
}
```

### 3. Custom Hooks - useWithdrawal.ts
**File:** `src/hooks/useWithdrawal.ts`

**Available Hooks:**

#### useWithdrawal()
Manages withdrawal submission and state
```typescript
const {
  loading,           // Loading state during API call
  error,            // Error message if submission fails
  success,          // Success flag
  withdrawalId,     // Returned withdrawal ID
  remainingCoins,   // Updated balance after withdrawal
  submitWithdrawal, // Function to submit withdrawal
  resetState,       // Function to reset state
  clearError,       // Function to clear error
} = useWithdrawal();
```

#### useWithdrawalValidation()
Validates all form inputs
```typescript
const {
  validateAmount,         // Validates coin amount
  validateUPI,           // Validates UPI ID format
  validateBankDetails,   // Validates account details
  validateAccountHolderName, // Validates name
} = useWithdrawalValidation();
```

#### useWithdrawalForm()
Manages form state with reset capability
```typescript
const {
  coinsAmount,
  setCoinsAmount,
  accountHolderName,
  setAccountHolderName,
  payoutMethod,
  setPayoutMethod,
  upiId,
  setUpiId,
  accountNumber,
  setAccountNumber,
  ifscCode,
  setIfscCode,
  reset,
} = useWithdrawalForm();
```

## Validation Rules

### Amount Validation
- Minimum: 100 coins (₹10)
- Maximum: User's current balance
- Must be a positive integer
- Format: Numbers only

### UPI Validation
- Format: `username@bankname`
- Pattern: `/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/`
- Examples: `john@ybl`, `user@okhdfcbank`, `name@paytm`
- Invalid: `invalid@`, `@ybl`, `john@@ybl`

### Bank Details Validation
- Account Number:
  - Length: 9-18 digits
  - Pattern: `^\d{9,18}$`
- IFSC Code:
  - Format: 4 uppercase + 0 + 6 alphanumeric
  - Pattern: `^[A-Z]{4}0[A-Z0-9]{6}$`
  - Examples: `SBIN0001234`, `HDFC0000789`
  - Invalid: `sbin0001234` (lowercase), `SBIN12345` (missing 0)

### Account Holder Name
- Minimum: 3 characters
- Cannot be empty
- Must contain valid characters

## Data Flow

### 1. User Initiates Withdrawal
```
User enters amount and selects payout method
         ↓
Form collects: coins, name, payment details
         ↓
Component validates all inputs
```

### 2. Submit Withdrawal
```
Click "Request Withdrawal" button
         ↓
Frontend validation runs
         ↓
requestCoinWithdrawal() API call
         ↓
Backend processes request
```

### 3. Backend Processing
```
Validate request payload
         ↓
Check user balance
         ↓
Verify payment details
         ↓
Deduct coins from user
         ↓
Create withdrawal record
         ↓
Return withdrawal_id and status
```

### 4. Frontend Handles Response
```
Success: Show alert with withdrawal ID and new balance
         ↓
Reset form and reload user coins
         ↓
Call onWithdrawalSuccess() callback
```

## Error Handling

### Frontend Error Scenarios
1. **Validation Errors** - Caught before API call
   - Invalid amount
   - Invalid payment details
   - Missing required fields

2. **API Errors** - Caught from backend
   - Insufficient balance
   - Invalid payment method
   - Server errors (500)
   - Network errors

3. **Error Display**
   - Alert dialog with user-friendly message
   - Error state persisted until cleared
   - Form remains populated for correction

### Error Messages
```typescript
// Amount errors
"Please enter a valid amount"
"Minimum withdrawal is 100 coins (₹10)"
"Insufficient balance. You have X coins"

// UPI errors
"UPI ID is required for UPI payout"
"Invalid UPI format. Example: yourname@ybl"

// Bank errors
"Account number and IFSC code are required"
"Invalid account number. Must be 9-18 digits"
"Invalid IFSC format. Example: SBIN0001234"

// API errors
"Withdrawal request failed"
"Failed to process withdrawal"
```

## Coin Conversion

**Formula:** `rupees = coins / 10`

**Examples:**
- 100 coins → ₹10
- 500 coins → ₹50
- 1000 coins → ₹100
- 10000 coins → ₹1000 (maximum)

## Testing

### Unit Tests
See `src/services/withdrawalTests.ts` for:
- Validation function tests
- Error message mapping
- Response handling

### Manual Testing
See `WITHDRAWAL_TESTING_GUIDE.md` for:
- API endpoint testing with curl
- Validation scenario testing
- Integration testing checklist

### Test Cases
1. Valid UPI withdrawal
2. Valid bank transfer
3. Insufficient balance handling
4. Invalid format handling
5. Network error handling
6. Success response handling

## Security Considerations

### Input Validation
- All inputs validated on frontend AND backend
- Maximum field lengths enforced
- Special characters restricted where appropriate
- SQL injection prevention (parameterized queries on backend)

### Data Protection
- User IDs validated and verified on backend
- Coins deducted only after successful validation
- Withdrawal amount cannot exceed balance (checked on backend)
- Transaction logs for audit trail

### API Security
- HTTPS required for production
- Request signature verification recommended
- Rate limiting on backend (e.g., 1 withdrawal per minute)
- Account verification for large withdrawals

## Production Deployment

### Pre-Deployment Checklist
- [ ] Backend endpoint tested with all scenarios
- [ ] Database transactions properly configured
- [ ] Rollback procedure documented
- [ ] Email notifications implemented
- [ ] Duplicate withdrawal prevention active
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up
- [ ] Error logging implemented
- [ ] Audit trail configured

### Configuration
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.API_BASE_URL || 'http://ed-tech-backend-tzn8.onrender.com/api';

// Withdrawal endpoint
const WITHDRAWAL_ENDPOINT = '/razorpay/withdraw/';

// Maximum withdrawal
const MAX_WITHDRAWAL_COINS = 10000;
const MIN_WITHDRAWAL_COINS = 100;
```

### Environment Variables
```
API_BASE_URL=https://api.yourdomain.com/api
RAZORPAY_KEY_ID=your_key_id
LOG_LEVEL=info
```

## Monitoring & Logging

### Key Metrics to Monitor
- Withdrawal request success rate
- Average withdrawal amount
- Payment processing time
- Error rate by type
- User withdrawal frequency

### Logs to Capture
```typescript
// On submission
"Withdrawal submitted - User: {userId}, Amount: {coins}, Method: {method}"

// On API call
"API call - POST /razorpay/withdraw/, Payload: {...}"

// On response
"Withdrawal successful - ID: {withdrawalId}, Status: {status}"

// On error
"Withdrawal error - User: {userId}, Error: {message}"
```

## Support & Troubleshooting

### Common Issues

**Issue:** "Insufficient balance" error
- **Solution:** Verify user coin balance is correct. Check coin earning system.

**Issue:** "Invalid UPI format" error
- **Solution:** Ensure UPI is in format: `username@bankname` (e.g., `john@ybl`)

**Issue:** "Withdrawal request failed" error
- **Solution:** Check backend API status. Verify user ID is correct. Check logs.

**Issue:** Coins deducted but no withdrawal_id
- **Solution:** Check backend response format. Verify database sync. Contact support.

## Related Documentation
- [Backend Withdrawal Implementation](../backend/WITHDRAWAL_IMPLEMENTATION.md)
- [Testing Guide](./WITHDRAWAL_TESTING_GUIDE.md)
- [API Specifications](./API_SPECS.md)
- [User Guide](./USER_GUIDE.md)

## Version History
- **v1.0** (2024-01-15): Initial implementation with UPI and Bank transfer support
- **v1.1** (2024-01-16): Added comprehensive validation and error handling

## Support
For issues or questions, contact: support@edtech.com
