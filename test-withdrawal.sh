#!/bin/bash

# Test Withdrawal Endpoint
echo "Testing Razorpay Withdrawal Endpoint"
echo "====================================="
echo ""

BASE_URL="http://https://ed-tech-backend-tzn8.onrender.com/api"

# Test 1: UPI Withdrawal
echo "Test 1: UPI Withdrawal"
curl -X POST "${BASE_URL}/razorpay/withdraw/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "amount": 50,
    "upi_id": "user@ybl"
  }' | jq .

echo ""
echo "---"
echo ""

# Test 2: Bank Transfer
echo "Test 2: Bank Transfer"
curl -X POST "${BASE_URL}/razorpay/withdraw/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_456",
    "amount": 100,
    "account_number": "1234567890",
    "ifsc_code": "SBIN0000001"
  }' | jq .

echo ""
echo "---"
echo ""

# Test 3: Insufficient Balance (should fail)
echo "Test 3: Insufficient Balance (Expected to fail)"
curl -X POST "${BASE_URL}/razorpay/withdraw/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_789",
    "amount": 10000,
    "upi_id": "user@ybl"
  }' | jq .

echo ""
echo "---"
echo ""

# Test 4: Missing Required Field (should fail)
echo "Test 4: Missing UPI ID (Expected to fail)"
curl -X POST "${BASE_URL}/razorpay/withdraw/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_101",
    "amount": 50
  }' | jq .
