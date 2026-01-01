FROM node:20-alpine

LABEL maintainer="Cloudevy <support@cloudevy.io>"
LABEL description="Cloudevy Monitoring Agent - Collects system metrics"
LABEL version="1.2.0"

WORKDIR /app

# Install procps (provides full ps command with --sort support)
RUN apk add --no-cache procps

# Copy agent files
COPY releases/v1.2.0/package.json .
COPY releases/v1.2.0/cloudevy-agent.js .

# Make executable
RUN chmod +x cloudevy-agent.js

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Run agent
CMD ["node", "cloudevy-agent.js"]

