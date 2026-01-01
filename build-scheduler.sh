#!/bin/bash

set -e

echo "🐳 Building Production Images (linux/amd64)"
echo ""

# Build downtime-scheduler for production (from root context to access backend/prisma)
echo "🕐 Building downtime-scheduler for linux/amd64..."
docker buildx build --platform linux/amd64 -f downtime-scheduler/Dockerfile -t cloudevy-downtime-scheduler:latest --load .

echo ""
echo "✅ All production images built successfully!"
echo ""
echo "📋 Images built:"
echo "  - cloudevy-downtime-scheduler:latest"
echo ""
echo "📋 Next steps:"
echo "  1. Push to Docker Hub: ./push-scheduler.sh"
echo ""
