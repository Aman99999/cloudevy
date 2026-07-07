#!/bin/bash

set -e

echo "🐳 Rebuilding Backend Image (linux/amd64)"

# Build backend
echo "🔧 Building backend..."
docker buildx build --platform linux/amd64 -t cloudevy-backend:latest --load ./backend

echo ""
echo "✅ Backend image built successfully"
echo ""
echo "📋 Next steps:"
echo "  1. Push to Docker Hub: ./push-backend.sh"
echo "  2. Or start locally: docker-compose up -d backend"
echo ""
