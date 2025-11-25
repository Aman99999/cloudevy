#!/bin/bash

set -e

echo "🛑 Stopping existing containers..."
docker-compose down

echo "🐳 Rebuilding Docker Images"

# Build frontend
echo "🎨 Building frontend..."
docker-compose build frontend

# Start containers
echo "🚀 Starting all containers..."
docker-compose up -d

echo "✅ All images built and containers started successfully"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:8001"


