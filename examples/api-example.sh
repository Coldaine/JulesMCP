#!/bin/bash

# Example API calls for Jules Control Room
# This script demonstrates how to interact with the API endpoints

set -e

echo "=== Jules Control Room API Examples ==="
echo ""

# Configuration
BASE_URL="http://localhost:3000"
JWT_SECRET="your-secret-key-change-in-production"

# Generate a JWT token (requires Node.js)
echo "1. Generating authentication token..."
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'test-user', isAdmin: false }, '$JWT_SECRET', { expiresIn: '1h' });
console.log(token);
")
echo "   Token: ${TOKEN:0:50}..."
echo ""

# Test health endpoints
echo "2. Testing health endpoints..."
echo "   /healthz:"
curl -s "$BASE_URL/healthz" | jq .
echo "   /readyz:"
curl -s "$BASE_URL/readyz" | jq .
echo ""

# Create a new session
echo "3. Creating a new session..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {"key": "initial-value", "count": 0}}')
echo "$RESPONSE" | jq .
SESSION_ID=$(echo "$RESPONSE" | jq -r .sessionId)
echo "   Created session: $SESSION_ID"
echo ""

# List all sessions
echo "4. Listing all sessions..."
curl -s "$BASE_URL/api/sessions" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Get specific session
echo "5. Getting session details..."
curl -s "$BASE_URL/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Update session
echo "6. Updating session..."
curl -s -X PUT "$BASE_URL/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {"key": "updated-value", "count": 42}}' | jq .
echo ""

# Delete session
echo "7. Deleting session..."
curl -s -X DELETE "$BASE_URL/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "Status: %{http_code}\n"
echo ""

# Try to access without authentication
echo "8. Testing authentication (should fail)..."
curl -s "$BASE_URL/api/sessions" | jq .
echo ""

echo "=== Examples completed ==="
