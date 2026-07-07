#!/bin/bash

# Script to sync all AWS servers and populate platform information
# This should be run after deploying the backend with platform support

echo "🔄 Syncing all AWS servers to populate platform information..."
echo ""
echo "This will update:"
echo "  - Server status"
echo "  - Platform/OS information"
echo "  - IP addresses"
echo ""

# Get the API URL
if [[ -z "$API_URL" ]]; then
  read -p "Enter API URL (default: https://cloudevy.in/api): " API_URL
  API_URL=${API_URL:-https://cloudevy.in/api}
fi

# Get the auth token
if [[ -z "$AUTH_TOKEN" ]]; then
  echo ""
  echo "To get your auth token:"
  echo "1. Login to CloudEvy"
  echo "2. Open browser DevTools (F12)"
  echo "3. Go to Console tab"
  echo "4. Type: localStorage.getItem('token')"
  echo "5. Copy the token (without quotes)"
  echo ""
  read -p "Enter your auth token: " AUTH_TOKEN
fi

echo ""
echo "🚀 Calling sync endpoint..."

# Call the sync endpoint
response=$(curl -s -X POST "${API_URL}/servers/sync" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json")

# Check if successful
if echo "$response" | grep -q '"success":true'; then
  echo "✅ Sync completed successfully!"
  echo ""
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
  echo "❌ Sync failed!"
  echo ""
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  exit 1
fi

echo ""
echo "✨ All done! Refresh your CloudEvy dashboard to see the OS/Platform information."

