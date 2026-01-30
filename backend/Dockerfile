# Stage 1: Build the TypeScript application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Install dependencies (handles missing lock file gracefully)
RUN npm install

# Build TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and lock file from builder (lock file now exists after npm install)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy migrations
COPY --from=builder /app/src/db/migrations ./dist/db/migrations

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

EXPOSE 3001

CMD ["node", "dist/server.js"]
