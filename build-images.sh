#!/bin/bash

set -e

echo "🐳 Building Production Images (linux/amd64)"
echo ""

# Build backend for production
echo "🔧 Building backend for linux/amd64..."
docker buildx build --platform linux/amd64 -t cloudevy-backend:latest --load ./backend

# Build frontend for production
echo "🎨 Building frontend for linux/amd64..."
docker buildx build --platform linux/amd64 -t cloudevy-frontend:latest --load ./frontend

# Build agent for production
echo "📊 Building agent for linux/amd64..."
docker buildx build --platform linux/amd64 -t cloudevy-agent:latest --load ./agent

# Build downtime-scheduler for production (from root context to access backend/prisma)
echo "🕐 Building downtime-scheduler for linux/amd64..."
docker buildx build --platform linux/amd64 -f downtime-scheduler/Dockerfile -t cloudevy-downtime-scheduler:latest --load .

# Build user-management for production (from root context to access backend/prisma)
echo "👥 Building user-management for linux/amd64..."
docker buildx build --platform linux/amd64 -f user-management/Dockerfile -t cloudevy-user-management:latest --load .

echo ""
echo "✅ All production images built successfully!"
echo ""
echo "📋 Images built:"
echo "  - cloudevy-backend:latest"
echo "  - cloudevy-frontend:latest"
echo "  - cloudevy-agent:latest"
echo "  - cloudevy-downtime-scheduler:latest"
echo "  - cloudevy-user-management:latest"
echo ""
echo "📋 Next steps:"
echo "  1. Push to Docker Hub: ./push-images.sh"
echo ""
