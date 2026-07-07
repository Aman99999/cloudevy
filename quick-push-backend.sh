#!/bin/bash

# Quick Backend Update Script
# This rebuilds and pushes only the backend

echo "🔧 Quick Backend Update"
echo "======================="

# Step 1: Build backend
echo ""
echo "📦 Building backend image..."
docker buildx build --platform linux/amd64 -t cloudevy-backend:latest --load ./backend

if [ $? -ne 0 ]; then
  echo "❌ Backend build failed!"
  exit 1
fi

echo "✅ Backend built successfully"

# Step 2: Save and compress
echo ""
echo "💾 Saving and compressing backend image..."
docker save cloudevy-backend:latest | gzip > backend-image.tar.gz

if [ $? -ne 0 ]; then
  echo "❌ Failed to save backend image!"
  exit 1
fi

echo "✅ Image saved: backend-image.tar.gz ($(du -h backend-image.tar.gz | cut -f1))"

# Step 3: Upload to server
echo ""
echo "📤 Uploading to server..."
scp backend-image.tar.gz ec2-user@cloudevy.in:/home/ec2-user/

if [ $? -ne 0 ]; then
  echo "❌ Failed to upload to server!"
  exit 1
fi

echo "✅ Uploaded to server"

# Step 4: Load and restart on server
echo ""
echo "🔄 Loading image and restarting backend on server..."
ssh ec2-user@cloudevy.in << 'EOF'
  cd /home/ec2-user
  docker load < backend-image.tar.gz
  cd cloudevy
  docker-compose up -d backend
  echo "✅ Backend restarted"
  
  # Cleanup
  rm -f /home/ec2-user/backend-image.tar.gz
EOF

if [ $? -ne 0 ]; then
  echo "❌ Failed to restart backend on server!"
  exit 1
fi

# Cleanup local file
rm -f backend-image.tar.gz

echo ""
echo "✅ Backend update complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test cluster creation"
echo "   2. Check logs: docker-compose logs -f backend"



