# CloudEvy User Management Service

Microservice for handling workspace invitations and team management.

## Features

- **Workspace Invitations**: Send email invitations to join workspaces
- **Email Service**: Gmail SMTP integration with beautiful HTML templates
- **Role-Based Access**: Support for admin, member, and viewer roles
- **Token-Based Invites**: Secure invitation links with expiration (7 days)
- **Multi-Workspace Support**: Users can be members of multiple workspaces

## Environment Variables

```bash
# Service Config
NODE_ENV=production
PORT=8004

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/cloudevy?schema=public

# CORS & Frontend
CORS_ORIGIN=https://cloudevy.in
FRONTEND_URL=https://cloudevy.in

# Gmail SMTP (Use App Password, not regular password)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Gmail App Password Setup

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `GMAIL_APP_PASSWORD`

## API Routes

### Protected Routes (Require Authentication)
- `POST /api/invitations` - Send invitation
- `GET /api/invitations` - List invitations
- `DELETE /api/invitations/:id` - Revoke invitation

### Public Routes
- `GET /api/invitations/verify/:token` - Verify invitation token
- `POST /api/invitations/accept/:token` - Accept invitation

## Local Development

```bash
cd user-management
npm install
npm run dev
```

## Docker

```bash
# Build
docker build -t cloudevy-user-management:latest -f user-management/Dockerfile .

# Run
docker run -p 8004:8004 \
  -e DATABASE_URL="postgresql://..." \
  -e GMAIL_USER="..." \
  -e GMAIL_APP_PASSWORD="..." \
  cloudevy-user-management:latest
```

## Integration

The backend (`/api/team/*`) proxies requests to this service. Frontend calls:
- `/api/team/invitations` → `user-management:8004/api/invitations`
- `/api/team/members` → Backend direct (faster)

