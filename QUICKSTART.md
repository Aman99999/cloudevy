# ⚡ CloudEvy - Quick Start (3 Steps)

## Step 1: Create .env Files

```bash
cd /Users/amankhare/Desktop/cloudevy

# Backend .env
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

# Frontend .env
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:8002/api
EOF
```

## Step 2: Start Databases

```bash
docker-compose up -d
```

## Step 3: Start Backend & Frontend

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## 🎉 Done!

Open: **http://localhost:8001**

Login: **admin / admin123**

---

## 📦 What You Have

✅ Vue 3 + Vite + Tailwind frontend
✅ Node.js + Express backend  
✅ JWT authentication
✅ RBAC (super_admin, admin, viewer)
✅ PostgreSQL + InfluxDB ready
✅ API client with interceptors
✅ Responsive dashboard UI

## 🚀 Ready to Build Features!

