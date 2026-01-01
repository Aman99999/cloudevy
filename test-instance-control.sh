#!/bin/bash
# Test script for AWS Instance Control features
# Run this after starting the application to verify endpoints

set -e

echo "🧪 CloudEvy AWS Instance Control - Backend Test Script"
echo "========================================================"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8002}"
TOKEN=""
SERVER_ID=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL$endpoint"
    fi
}

echo "Step 1: Login"
echo "-------------"
read -p "Enter your email: " email
read -sp "Enter your password: " password
echo ""

login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
    "$API_URL/api/auth/login")

TOKEN=$(echo "$login_response" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed${NC}"
    echo "$login_response" | jq .
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo ""

echo "Step 2: Fetch Servers"
echo "--------------------"
servers_response=$(api_call GET "/api/servers")
echo "$servers_response" | jq .

# Find first AWS server with instanceId
SERVER_ID=$(echo "$servers_response" | jq -r '.data[] | select(.provider=="aws" and .instanceId!=null) | .id' | head -1)

if [ -z "$SERVER_ID" ]; then
    echo -e "${YELLOW}⚠ No AWS servers with instanceId found${NC}"
    echo "Please add an AWS server with an instanceId to test control features"
    exit 0
fi

echo -e "${GREEN}✓ Found AWS server with ID: $SERVER_ID${NC}"
echo ""

# Get server details
server_info=$(echo "$servers_response" | jq ".data[] | select(.id==$SERVER_ID)")
server_name=$(echo "$server_info" | jq -r '.name')
server_status=$(echo "$server_info" | jq -r '.status')
instance_id=$(echo "$server_info" | jq -r '.instanceId')

echo "Server Details:"
echo "  Name: $server_name"
echo "  Status: $server_status"
echo "  Instance ID: $instance_id"
echo ""

echo "Step 3: Test Get Status Endpoint"
echo "--------------------------------"
status_response=$(api_call GET "/api/servers/$SERVER_ID/status")
echo "$status_response" | jq .

if [ "$(echo "$status_response" | jq -r '.success')" = "true" ]; then
    echo -e "${GREEN}✓ Status endpoint working${NC}"
else
    echo -e "${RED}✗ Status endpoint failed${NC}"
fi
echo ""

echo "Step 4: Test Control Endpoints (Dry Run)"
echo "----------------------------------------"
echo "This script will NOT actually execute control actions."
echo "It will only test if the endpoints are accessible."
echo ""

read -p "Do you want to test the STOP endpoint? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing STOP endpoint..."
    stop_response=$(api_call POST "/api/servers/$SERVER_ID/stop")
    echo "$stop_response" | jq .
    
    if [ "$(echo "$stop_response" | jq -r '.success')" = "true" ]; then
        echo -e "${GREEN}✓ Stop endpoint executed${NC}"
    else
        echo -e "${RED}✗ Stop endpoint failed${NC}"
    fi
    echo ""
fi

read -p "Do you want to test the START endpoint? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing START endpoint..."
    start_response=$(api_call POST "/api/servers/$SERVER_ID/start")
    echo "$start_response" | jq .
    
    if [ "$(echo "$start_response" | jq -r '.success')" = "true" ]; then
        echo -e "${GREEN}✓ Start endpoint executed${NC}"
    else
        echo -e "${RED}✗ Start endpoint failed${NC}"
    fi
    echo ""
fi

read -p "Do you want to test the REBOOT endpoint? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing REBOOT endpoint..."
    reboot_response=$(api_call POST "/api/servers/$SERVER_ID/reboot")
    echo "$reboot_response" | jq .
    
    if [ "$(echo "$reboot_response" | jq -r '.success')" = "true" ]; then
        echo -e "${GREEN}✓ Reboot endpoint executed${NC}"
    else
        echo -e "${RED}✗ Reboot endpoint failed${NC}"
    fi
    echo ""
fi

echo "⚠️  TERMINATE endpoint test skipped for safety"
echo "   To test terminate, use the UI or manually call:"
echo "   curl -X DELETE -H \"Authorization: Bearer \$TOKEN\" \\"
echo "        $API_URL/api/servers/$SERVER_ID/terminate"
echo ""

echo "Step 5: Verify Audit Logs"
echo "------------------------"
echo "Check your database for audit log entries:"
echo "  SELECT * FROM \"AuditLog\" WHERE \"resourceId\" = $SERVER_ID ORDER BY \"createdAt\" DESC LIMIT 5;"
echo ""

echo "=========================================="
echo "✅ Testing Complete!"
echo "=========================================="
echo ""
echo "Frontend Testing:"
echo "1. Navigate to http://localhost:8001/servers"
echo "2. Look for AWS servers with control buttons"
echo "3. Test stop/start/reboot actions"
echo "4. Verify status updates"
echo ""
echo "Manual API Testing Examples:"
echo ""
echo "# Get server status"
echo "curl -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     $API_URL/api/servers/$SERVER_ID/status"
echo ""
echo "# Stop server"
echo "curl -X POST -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     $API_URL/api/servers/$SERVER_ID/stop"
echo ""
echo "# Start server"
echo "curl -X POST -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     $API_URL/api/servers/$SERVER_ID/start"
echo ""
echo "# Reboot server"
echo "curl -X POST -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     $API_URL/api/servers/$SERVER_ID/reboot"
echo ""

