#!/bin/bash

set -e

echo "🐳 Building Production Images (linux/amd64)"
echo ""

# Build user-management for production (from root context to access backend/prisma)
echo "👥 Building user-management for linux/amd64..."
docker buildx build --platform linux/amd64 -f user-management/Dockerfile -t cloudevy-user-management:latest --load .

echo ""
echo "✅ All production images built successfully!"
echo ""
echo "📋 Images built:"
echo "  - cloudevy-user-management:latest"
echo ""
echo "📋 Next steps:"
echo "  1. Push to Docker Hub: ./push-images.sh"
echo ""
