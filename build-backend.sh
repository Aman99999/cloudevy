#!/bin/bash

set -e

echo "🛑 Stopping existing containers..."
docker-compose down

echo "🐳 Rebuilding Docker Images"

# Build backend
echo "🔧 Building backend..."
docker-compose build backend


# Start containers
echo "🚀 Starting all containers..."
docker-compose up -

echo "✅ All images built and containers started successfully"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:8001"
echo "  Backend:  http://localhost:8002"


