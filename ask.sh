Pleas erun and check and resolve it   
  #!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="https://ed-tech-backend-tzn8.onrender.com/api"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ASK A QUESTION - Search & AI Integration Testing          ║${NC}"
echo -e "${BLUE}║     Testing on http://127.0.0.1:8000                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

# Test 1: Check Search API Status
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 1️⃣  - Check Search APIs Status${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📝 Request:"
echo "GET $BASE_URL/ask-question/status/"
echo ""

RESPONSE=$(curl -s -X GET "$BASE_URL/ask-question/status/" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Ask Question - Search (Basic)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 2️⃣  - Ask Question (Search - Simple Query)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📝 Request:"
echo "POST $BASE_URL/ask-question/search/"
echo "Body:"
echo '{
    "question": "What is photosynthesis?",
    "max_results": 5
}'
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/ask-question/search/" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is photosynthesis?",
    "max_results": 5
  }')

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Ask Question - Search (Math Question)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 3️⃣  - Ask Question (Search - Math Question)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📝 Request:"
echo "POST $BASE_URL/ask-question/search/"
echo "Body:"
echo '{
    "question": "How to solve quadratic equations?",
    "max_results": 3
}'
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/ask-question/search/" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How to solve quadratic equations?",
    "max_results": 3
  }')

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 4: Ask Question with AI (Simple)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 4️⃣  - Ask Question (AI Answer - Concise)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📝 Request:"
echo "POST $BASE_URL/ask-question/ai/"
echo "Body:"
echo '{
    "question": "What is DNA?",
    "detailed": false,
    "max_results": 3
}'
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/ask-question/ai/" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is DNA?",
    "detailed": false,
    "max_results": 3
  }')

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 5: Ask Question with AI (Detailed)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 5️⃣  - Ask Question (AI Answer - Detailed)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📝 Request:"
echo "POST $BASE_URL/ask-question/ai/"
echo "Body:"
echo '{
    "question": "Explain the carbon cycle",
    "detailed": true,
    "max_results": 4
}'
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/ask-question/ai/" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain the carbon cycle",
    "detailed": true,
    "max_results": 4
  }')

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 6: Error Test - Empty Question
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}TEST 6️⃣  - Error Test (Empty Question)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📝 Request:"
echo "POST $BASE_URL/ask-question/search/"
echo "Body:"
echo '{
    "question": ""
}'
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/ask-question/search/" \
  -H "Content-Type: application/json" \
  -d '{
    "question": ""
  }')

echo "Response (should show error):"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 7: Error Test - Question Too Short
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}TEST 7️⃣  - Error Test (Question Too Short)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📝 Request:"
echo "POST $BASE_URL/ask-question/search/"
echo "Body:"
echo '{
    "question": "ab"
}'
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/ask-question/search/" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "ab"
  }')

echo "Response (should show error):"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║✅ All Tests Completed!                                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}\n"

# Summary
echo -e "${BLUE}📊 ENDPOINTS SUMMARY:${NC}\n"
echo -e "${GREEN}✅ Search Endpoints:${NC}"
echo "   1. GET  /api/ask-question/status/          - Check API status"
echo "   2. POST /api/ask-question/search/          - Search web for answers"
echo ""
echo -e "${GREEN}✅ AI Endpoints:${NC}"
echo "   3. POST /api/ask-question/ai/              - AI-powered answers"
echo ""

echo -e "${BLUE}📋 SUPPORTED PARAMETERS:${NC}\n"
echo -e "Search Endpoint:"
echo "   • question (required): The question to ask"
echo "   • max_results (optional): 1-10, default 5"
echo "   • language (optional): Language code, default 'en'"
echo ""
echo -e "AI Endpoint:"
echo "   • question (required): The question to ask"
echo "   • detailed (optional): true/false for detailed answer"
echo "   • max_results (optional): 1-5, default 3"
echo ""
