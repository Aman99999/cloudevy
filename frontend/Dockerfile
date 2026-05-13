FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx:alpine envsubsts files in /etc/nginx/templates/*.template into
# /etc/nginx/conf.d/*.conf at startup, using env vars from the container.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Defaults work for local docker-compose; Fly overrides via fly.toml [env].
ENV BACKEND_HOST=backend \
    BACKEND_PORT=8002 \
    DNS_RESOLVER=127.0.0.11

EXPOSE 8001

CMD ["nginx", "-g", "daemon off;"]

