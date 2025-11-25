#!/bin/bash

echo "🚀 CloudEvy Dev Setup"

# Create .env files
echo "📝 Creating .env files..."

cat > backend/.env << 'EOF'
PORT=8002
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5433
DB_NAME=cloudevy
DB_USER=cloudevy
DB_PASSWORD=cloudevy_dev_password
INFLUX_URL=http://localhost:8087
INFLUX_TOKEN=cloudevy_dev_token_12345
INFLUX_ORG=cloudevy
INFLUX_BUCKET=metrics
JWT_SECRET=dev_jwt_secret_key_12345
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:8001
EOF

cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8002/api
EOF

echo "✅ .env files created"

# Start databases
echo "📦 Starting databases..."
docker-compose up -d

echo "⏳ Waiting for databases..."
sleep 5

echo ""
echo "✅ Setup complete!"
echo ""
echo "Now run in separate terminals:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Access: http://localhost:8001"
echo "Login: admin / admin123"

