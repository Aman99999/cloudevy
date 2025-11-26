FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Expose port
EXPOSE 8002

# Start app
CMD ["node", "src/index.js"]

