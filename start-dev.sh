#!/bin/bash

echo "🚀 Starting CloudEvy Development Environment..."

# Start databases
echo "📦 Starting databases (PostgreSQL & InfluxDB)..."
docker-compose up -d

# Wait for databases
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Start backend
echo "🔧 Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ CloudEvy is running!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT
wait

