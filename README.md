# CloudEvy - Visual Infrastructure Control Platform

Multi-cloud infrastructure management platform for AWS, Azure, GCP, and on-premise environments.

## 🏗️ Architecture

- **Frontend**: Vue 3 + Vite + Tailwind CSS + Pinia
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (metadata) + InfluxDB (metrics)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Option 1: Development (Local)

```bash
# Run setup script
./dev.sh

# Then start services in separate terminals:
cd backend && npm run dev
cd frontend && npm run dev
```

### Option 2: Docker (Production-like)

```bash
# Build and start all containers
chmod +x build-images.sh
./build-images.sh
```

### Access
- Frontend: http://localhost:8001
- Backend API: http://localhost:8002
- PostgreSQL: localhost:5433
- InfluxDB: http://localhost:8087

## 📦 Project Structure

```
cloudevy/
├── frontend/              # Vue 3 application
│   ├── src/
│   │   ├── views/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── stores/       # Pinia stores
│   │   ├── router/       # Vue Router
│   │   └── assets/       # Static assets
│   └── package.json
│
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation
│   │   ├── models/       # Database models
│   │   └── config/       # Configuration
│   └── package.json
│
└── docker-compose.yml    # PostgreSQL + InfluxDB
```

## 🔐 Authentication

Hardcoded users for development:
- `admin` / `admin123` (super_admin)
- `user` / `user123` (viewer)

## 📝 Development Status

- [x] Project setup
- [ ] Authentication & RBAC
- [ ] AWS integration
- [ ] Docker container management
- [ ] Metrics dashboard
- [ ] Cost tracking

