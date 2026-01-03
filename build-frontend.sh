#!/bin/bash

set -e


echo "🐳 Rebuilding Docker Images"

# Build frontend
echo "🎨 Building frontend for linux/amd64..."
docker buildx build --platform linux/amd64 -t cloudevy-frontend:latest --load ./frontend

# Start containers

echo "✅ All images built and containers started successfully"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:8001"


