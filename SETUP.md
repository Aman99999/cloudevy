# 🚀 CloudEvy Setup Guide

## ✅ What's Been Created

### Project Structure
```
cloudevy/
├── frontend/              # Vue 3 + Vite + Tailwind + Pinia
│   ├── src/
│   │   ├── views/        # Login, Dashboard, Servers, Containers, Costs
│   │   ├── stores/       # Pinia auth store
│   │   ├── router/       # Vue Router with auth guard
│   │   ├── api/          # Axios client with interceptors
│   │   └── main.js
│   ├── package.json      # ✅ Dependencies installed
│   └── tailwind.config.js
│
├── backend/              # Node.js + Express
│   ├── src/
│   │   ├── routes/       # Auth routes
│   │   ├── middleware/   # Auth & RBAC middleware
│   │   ├── config/       # Database, hardcoded users
│   │   └── index.js      # Main server file
│   └── package.json      # ✅ Dependencies installed
│
└── docker-compose.yml    # PostgreSQL + InfluxDB
```

## 📋 Manual Steps Required

### 1. Create Environment Files

**Backend** - Create `backend/.env`:
```bash
cd backend
cat > .env << 'EOF'
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
```

**Frontend** - Create `frontend/.env`:
```bash
cd frontend
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8002/api
EOF
```

### 2. Start Services

**Terminal 1 - Start Databases:**
```bash
cd cloudevy
docker-compose up -d
```

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:8001
- **Backend API**: http://localhost:8002
- **Health Check**: http://localhost:8002/health
- **PostgreSQL**: localhost:5433
- **InfluxDB**: http://localhost:8087

### 4. Login Credentials

Use these hardcoded users:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | super_admin |
| `manager` | `manager123` | admin |
| `user` | `user123` | viewer |

## ✅ What's Working

- ✅ Vue 3 with Composition API
- ✅ Tailwind CSS styling
- ✅ Pinia state management
- ✅ Vue Router with auth guards
- ✅ Axios API client with interceptors
- ✅ Node.js Express backend
- ✅ JWT authentication
- ✅ RBAC middleware
- ✅ Hardcoded users
- ✅ CORS configured
- ✅ Docker Compose for databases

## 🔧 Quick Commands

```bash
# Check if databases are running
docker-compose ps

# View backend logs
cd backend && npm run dev

# View frontend logs
cd frontend && npm run dev

# Stop databases
docker-compose down

# Restart databases
docker-compose restart
```

## 🎯 Next Steps

1. **Test Authentication**: Login with `admin/admin123`
2. **Add AWS Integration**: Create AWS SDK service
3. **Build Server Management**: Implement SSH connections
4. **Add Docker Management**: Integrate Docker API
5. **Cost Tracking**: Implement AWS Cost Explorer

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 8002
lsof -ti:8002 | xargs kill -9

# Kill process on port 8001
lsof -ti:8001 | xargs kill -9
```

**Docker issues:**
```bash
# Reset Docker containers
docker-compose down -v
docker-compose up -d
```

**Dependencies issue:**
```bash
# Reinstall frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Reinstall backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tech Stack Reference

### Frontend
- Vue 3.5+ (Composition API)
- Vite 7.2+ (Build tool)
- Tailwind CSS 3.4+ (Styling)
- Pinia 2.3+ (State management)
- Vue Router 4.5+ (Routing)
- Axios 1.7+ (HTTP client)

### Backend
- Node.js 20+ (Runtime)
- Express 4.21+ (Web framework)
- bcryptjs 2.4+ (Password hashing)
- jsonwebtoken 9.0+ (JWT auth)
- pg 8.13+ (PostgreSQL client)
- node-cron 3.0+ (Scheduled jobs)

### Databases
- PostgreSQL 15 (Main database)
- InfluxDB 2.7 (Time-series metrics)

## 🎨 UI Preview

- Clean, modern Tailwind-based design
- Responsive layout
- Authentication flow
- Dashboard with stats cards
- Navigation between pages

---

**Ready to code!** 🚀

