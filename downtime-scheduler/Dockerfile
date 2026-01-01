# Build from root context to access backend's prisma schema
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY downtime-scheduler/package*.json ./

# Copy backend's prisma schema and config (shared)
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./prisma.config.ts

# Install dependencies and generate Prisma Client
RUN npm ci --only=production

# Set dummy DATABASE_URL for prisma generate (not used, just needed for config validation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate

# Copy scheduler source code
COPY downtime-scheduler/src ./src

# Expose health check port
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the scheduler
CMD ["node", "src/index.js"]

