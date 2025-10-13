#!/bin/bash

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for this script" >&2
  exit 1
fi

BASE_URL=${BASE_URL:-http://localhost:3001}
TOKEN=${LOCAL_TOKEN:-local-dev-token}

header() {
  printf '\n=== %s ===\n' "$1"
}

header "Health checks"
curl -s "$BASE_URL/healthz" | jq .
curl -s "$BASE_URL/readyz" | jq .

header "Create session"
CREATE_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repo":"example/repo","summary":"demo run","participants":["alice"]}')
SESSION_ID=$(echo "$CREATE_RESPONSE" | jq -r .id)
echo "$CREATE_RESPONSE" | jq .

header "List sessions"
curl -sS "$BASE_URL/api/sessions" \
  -H "Authorization: Bearer $TOKEN" | jq .

header "Approve session"
APPROVE_RESPONSE=$(curl -sS -X POST "$BASE_URL/api/sessions/$SESSION_ID/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state":"approved"}')
echo "$APPROVE_RESPONSE" | jq .

header "Send message"
curl -sS -X POST "$BASE_URL/api/sessions/$SESSION_ID/message" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Control room ping"}' | jq .

header "Fetch activities"
curl -sS "$BASE_URL/api/sessions/$SESSION_ID/activities" \
  -H "Authorization: Bearer $TOKEN" | jq .

header "Auth failure demo"
curl -sS "$BASE_URL/api/sessions" | jq .
