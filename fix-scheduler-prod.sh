#!/bin/bash

echo "🔧 Complete Scheduler Fix for Production"
echo "========================================"
echo ""

echo "Step 1: Check if schedules table exists in DB"
docker exec cloudevy-postgres psql -U cloudevy -d cloudevy -c "\dt schedules"

echo ""
echo "Step 2: Check scheduler container build date"
docker inspect cloudevy-downtime-scheduler | grep Created | head -1

echo ""
echo "Step 3: Force remove old scheduler container and image"
docker stop cloudevy-downtime-scheduler 2>/dev/null || true
docker rm cloudevy-downtime-scheduler 2>/dev/null || true
docker rmi cloudevy/cloudevy-downtime-scheduler:latest 2>/dev/null || true

echo ""
echo "Step 4: Pull fresh image from Docker Hub"
docker pull cloudevy/cloudevy-downtime-scheduler:latest

echo ""
echo "Step 5: Restart all containers"
cd ~/cloudevy
docker compose -f server-docker.yml up -d

echo ""
echo "Step 6: Wait 10 seconds..."
sleep 10

echo ""
echo "Step 7: Check scheduler logs"
docker logs --tail 30 cloudevy-downtime-scheduler

echo ""
echo "✅ Done! Check logs above for errors."
