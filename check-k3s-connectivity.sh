#!/bin/bash

# 🔧 Security Group Connectivity Checker for CloudEvy Live Metrics
# Run this on your CloudEvy production server

set -e

echo "================================"
echo "🔍 CloudEvy - K3s Connectivity Check"
echo "================================"
echo ""

# Check if nc (netcat) is installed
if ! command -v nc &> /dev/null; then
  echo "📦 Installing netcat (nc)..."
  sudo yum install -y nc 2>/dev/null || sudo apt-get install -y netcat 2>/dev/null || true
fi

# Get K3s master IPs from user
echo "📋 Enter your K3s master node public IP address:"
read -p "Master IP: " MASTER_IP

if [ -z "$MASTER_IP" ]; then
  echo "❌ Error: Master IP is required"
  exit 1
fi

echo ""
echo "🔌 Testing connectivity to K3s master at $MASTER_IP:6443..."
echo ""

# Test connectivity
if timeout 5 nc -zv "$MASTER_IP" 6443 2>&1 | grep -q "succeeded\|open"; then
  echo "✅ SUCCESS! Port 6443 is reachable on $MASTER_IP"
  echo ""
  echo "🎉 Your CloudEvy server can communicate with K3s master!"
  echo "   Live node metrics should work correctly."
  echo ""
else
  echo "❌ FAILED! Cannot reach $MASTER_IP:6443"
  echo ""
  echo "🔧 How to Fix:"
  echo ""
  echo "1. Go to AWS Console → EC2 → Security Groups"
  echo ""
  echo "2. Find the security group attached to your K3s master node"
  echo ""
  echo "3. Add an Inbound Rule:"
  echo "   Type: Custom TCP"
  echo "   Port: 6443"
  echo "   Source: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_CLOUDEVY_SERVER_IP")/32"
  echo "   Description: CloudEvy metrics access"
  echo ""
  echo "4. Save the rule"
  echo ""
  echo "5. Wait 10 seconds, then run this script again to verify"
  echo ""
fi

# Check if kubectl is available in CloudEvy backend
echo ""
echo "🔍 Checking if kubectl is installed in CloudEvy backend..."
if docker exec cloudevy-backend kubectl version --client 2>&1 | grep -q "Client Version"; then
  echo "✅ kubectl is installed in backend"
else
  echo "❌ kubectl not found in backend container"
  echo ""
  echo "🔧 Fix: Deploy the latest backend image"
  echo "   cd /home/ec2-user/cloudevy"
  echo "   docker-compose pull backend"
  echo "   docker-compose up -d backend"
fi

echo ""
echo "================================"
echo "✅ Check Complete"
echo "================================"

