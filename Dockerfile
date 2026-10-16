FROM node:20-slim

WORKDIR /app

# Install build dependencies if needed for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy application source code
COPY . .

# Build bundled provider files
RUN npm run build

# Create data directory for persistent free KV store
RUN mkdir -p data

# Default environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start production server
CMD ["node", "website/server.js"]
