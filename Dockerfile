FROM node:20-slim AS builder

# Create app directory
WORKDIR /app

# Copy package files and tsconfig.json first
COPY package*.json tsconfig.json ./

# Install dependencies including tsx
RUN npm install

# Copy patches and apply them
COPY patches ./patches
RUN npx patch-package

# Copy source files needed for the build
COPY src ./src

# Final stage
FROM node:20-slim

WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 steammtxuser \
    && chown -R steammtxuser:nodejs /app

# Copy only the necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/patches ./patches
COPY --from=builder /app/src ./src

# Switch to non-root user
USER steammtxuser

# Expose the port your app runs on
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start"] 