# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling (PID 1)
RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

# Stage: dependencies
FROM base AS dependencies
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Stage: production release
FROM base AS release
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy application source and public assets
COPY src/ ./src/
COPY public/ ./public/

# Set security ownership to non-root user (node)
RUN chown -R node:node /usr/src/app

# Run as non-root user
USER node

EXPOSE 3000

# Healthcheck using Node.js internal HTTP request
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
