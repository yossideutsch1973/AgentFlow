# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (tsx is needed to run TypeScript server code)
RUN npm ci

# Copy built frontend assets from builder
COPY --from=builder /app/dist ./dist

# Copy server code and types
COPY server ./server
COPY types.ts ./types.ts
COPY config ./config
COPY operations ./operations

# Expose port (Cloud Run will set PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start the server and serve the built frontend
CMD ["npm", "run", "server"]
