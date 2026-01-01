#!/bin/bash

set -e

# ⚠️  WARNING: This script contains hardcoded credentials!
# ⚠️  DO NOT commit this file to Git!
# ⚠️  DO NOT share this file with anyone!

# Docker registry credentials
REGISTRY=docker.io
NAMESPACE=cloudevy
USERNAME=cloudevy
PASSWORD='Aman@1997'  # 🔐 Recommend securing via env var or CI/CD secrets

# Version tags
VERSION=${VERSION:-latest}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "================================"
echo "🐳 Cloudevy - Push to Docker Hub"
echo "================================"
echo ""
echo "Registry: $REGISTRY"
echo "Namespace: $NAMESPACE"
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "🔐 Logging into $REGISTRY..."
docker login $REGISTRY -u "$USERNAME" -p "$PASSWORD"
echo ""


echo "🏷️  Tagging downtime-scheduler images..."
docker tag cloudevy-downtime-scheduler:latest $REGISTRY/$NAMESPACE/cloudevy-downtime-scheduler:$VERSION
docker push $REGISTRY/$NAMESPACE/cloudevy-downtime-scheduler:$VERSION
echo ""
echo "✅ Downtime-scheduler image pushed successfully to $REGISTRY/$NAMESPACE"


echo "================================"
echo "✅ All images pushed successfully!"
echo "================================"
echo ""
echo "📋 Images available:"
echo "  - $REGISTRY/$NAMESPACE/cloudevy-downtime-scheduler:$VERSION"
echo ""
echo "📋 Deploy platform on EC2:"
echo "  docker pull $REGISTRY/$NAMESPACE/cloudevy-backend:$VERSION"
echo "  docker pull $REGISTRY/$NAMESPACE/cloudevy-frontend:$VERSION"
echo "  docker-compose -f server-docker.yml up -d"
echo ""
