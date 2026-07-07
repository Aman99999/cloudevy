# Multi-stage build for user-management service
FROM node:20-alpine AS builder

# Install Prisma dependencies
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY user-management/package*.json ./

# Copy Prisma schema from backend
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./

# Set dummy DATABASE_URL for build
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY user-management/src ./src

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 8004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "src/index.js"]

