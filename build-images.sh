#!/bin/bash

set -e

echo "🛑 Stopping existing containers..."
docker-compose down

echo "🐳 Rebuilding Docker Images"

# Build backend
echo "🔧 Building backend..."
docker-compose build backend

# Build frontend
echo "🎨 Building frontend..."
docker-compose build frontend

# Pull database images
echo "📦 Pulling database images..."
docker-compose pull postgres influxdb

# Start containers
echo "🚀 Starting all containers..."
docker-compose up -d

echo "✅ All images built and containers started successfully"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:8001"
echo "  Backend:  http://localhost:8002"
echo "  Login:    admin / admin123"

