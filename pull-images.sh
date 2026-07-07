#!/bin/bash

set -e

# ⚠️  This script pulls production images from Docker Hub
# Run this on your production server (EC2 instance)

# Docker Hub Registry
REGISTRY=docker.io
NAMESPACE=cloudevy

# Docker Hub Credentials
USERNAME="cloudevy"
PASSWORD="Aman@1997"

# Image versions
BACKEND_TAG=${BACKEND_TAG:-latest}
FRONTEND_TAG=${FRONTEND_TAG:-latest}
AGENT_TAG=${AGENT_TAG:-latest}
SCHEDULER_TAG=${SCHEDULER_TAG:-latest}

echo "🔐 Logging into $REGISTRY..."
echo "$PASSWORD" | docker login "$REGISTRY" -u "$USERNAME" --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ Docker login failed!"
    exit 1
fi
echo "✅ Login successful!"
echo ""

echo "⬇️ Pulling backend image..."
docker pull $REGISTRY/$NAMESPACE/cloudevy-backend:$BACKEND_TAG

echo ""
echo "⬇️ Pulling frontend image..."
docker pull $REGISTRY/$NAMESPACE/cloudevy-frontend:$FRONTEND_TAG

echo ""
echo "⬇️ Pulling agent image..."
docker pull $REGISTRY/$NAMESPACE/cloudevy-agent:$AGENT_TAG

echo ""
echo "⬇️ Pulling downtime-scheduler image..."
docker pull $REGISTRY/$NAMESPACE/cloudevy-downtime-scheduler:$SCHEDULER_TAG

echo ""
echo "⬇️ Pulling user-management image..."
docker pull $REGISTRY/$NAMESPACE/cloudevy-user-management:latest

echo ""
echo "⬇️ Pulling database images..."
docker pull postgres:15-alpine
docker pull influxdb:2.7-alpine
docker pull nginx:alpine

echo ""
echo "🚀 Starting containers with updated images..."
docker-compose up -d

echo ""
echo "✅ All services are up and running with latest images!"
echo ""
echo "📋 Verify status:"
echo "  docker ps"
echo ""
