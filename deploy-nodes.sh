#!/bin/bash

# 🚀 Quick Deploy Script for Live Node Metrics Feature
# Run this on your CloudEvy production server

set -e

echo "================================"
echo "🚀 CloudEvy - Deploy Nodes Feature"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
  echo "❌ Error: docker-compose.yml not found!"
  echo "Please run this script from the cloudevy directory"
  exit 1
fi

echo "📦 Step 1: Pulling latest images..."
docker-compose pull backend frontend

echo ""
echo "🛑 Step 2: Stopping old containers..."
docker-compose down backend frontend

echo ""
echo "🚀 Step 3: Starting new containers..."
docker-compose up -d backend frontend

echo ""
echo "⏳ Step 4: Waiting for services to start..."
sleep 5

echo ""
echo "🔍 Step 5: Checking container status..."
docker-compose ps backend frontend

echo ""
echo "📋 Step 6: Checking backend logs..."
docker-compose logs --tail=20 backend

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "🧪 Test the feature:"
echo "  1. Open http://$(hostname -I | awk '{print $1}'):8001"
echo "  2. Go to Clusters → View Details → Nodes tab"
echo ""
echo "📊 To enable full CPU/Memory metrics:"
echo "  Run this on your K3s master node:"
echo "  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
echo "  kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{\"op\": \"add\", \"path\": \"/spec/template/spec/containers/0/args/-\", \"value\": \"--kubelet-insecure-tls\"}]'"
echo ""
echo "📖 Full instructions: cat DEPLOY_NODES_FEATURE.md"
echo ""

