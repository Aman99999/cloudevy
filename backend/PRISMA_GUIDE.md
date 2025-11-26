# Prisma Database Guide for CloudEvy

## ✅ What We're Using

- **ORM:** Prisma
- **Database:** PostgreSQL
- **Port:** 5433 (configured in docker-compose.yml)

## 🚀 Quick Commands

### Generate Prisma Client (after schema changes)
```bash
npm run db:generate
```

### Create and Apply Migration
```bash
DATABASE_URL="postgresql://cloudevy:cloudevy_dev_password@localhost:5433/cloudevy" npm run db:migrate
```

### View Database in Browser (Prisma Studio)
```bash
DATABASE_URL="postgresql://cloudevy:cloudevy_dev_password@localhost:5433/cloudevy" npm run db:studio
```

### Reset Database (DEV ONLY!)
```bash
DATABASE_URL="postgresql://cloudevy:cloudevy_dev_password@localhost:5433/cloudevy" npx prisma migrate reset
```

## 📊 Database Schema

### Multi-Tenant Architecture
- Every table has `workspaceId` for data isolation
- First user in workspace gets `owner` role
- 14-day free trial by default

### Tables
- **Workspace** - Tenants/organizations
- **User** - Users (linked to workspaces)
- **CloudAccount** - AWS/Azure/GCP connections
- **Server** - Infrastructure resources
- **Container** - Docker/Podman containers
- **AuditLog** - Activity tracking

## 💡 Using Prisma in Code

### Import Prisma Client
```javascript
import prisma from '../config/prisma.js'
```

### Create a User
```javascript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
    fullName: 'John Doe',
    role: 'owner',
    workspace: {
      create: {
        name: 'Acme Corp',
        slug: 'acme-corp'
      }
    }
  }
})
```

### Query with Relations
```javascript
const workspace = await prisma.workspace.findUnique({
  where: { id: 1 },
  include: {
    users: true,
    servers: true,
    cloudAccounts: true
  }
})
```

### Transaction
```javascript
const result = await prisma.$transaction(async (tx) => {
  const workspace = await tx.workspace.create({ ... })
  const user = await tx.user.create({ ... })
  return { workspace, user }
})
```

## 🔒 Data Isolation

Every query automatically filters by `workspaceId`:

```javascript
// Get all servers for a workspace
const servers = await prisma.server.findMany({
  where: { workspaceId: user.workspaceId }
})
```

## 📝 Schema Location

- **Schema:** `prisma/schema.prisma`
- **Migrations:** `prisma/migrations/`
- **Client:** Auto-generated in `node_modules/@prisma/client`

## 🎯 Benefits

✅ Type-safe queries
✅ Auto-completion in IDE
✅ Easy migrations
✅ Relationship management
✅ Transaction support
✅ Query optimization

