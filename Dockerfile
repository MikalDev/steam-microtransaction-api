# Build stage
FROM node:20-slim AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm install

# Copy app source
COPY . .

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies without running scripts
RUN npm install --production --ignore-scripts

# Copy patches and apply them
COPY patches ./patches
RUN npx patch-package

# Copy built JavaScript files from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port your app runs on
EXPOSE 8080

# Start the application
CMD ["node", "./dist/entrypoint.js"] 