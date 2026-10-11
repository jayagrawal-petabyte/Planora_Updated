FROM node:24-bookworm-slim

# Prisma's query engine requires OpenSSL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package.json and workspace package.jsons
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY web/backend/package.json ./web/backend/
COPY web/frontend/package.json ./web/frontend/
COPY app/package.json ./app/

# Install dependencies (workspaces)
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY web/backend ./web/backend

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
WORKDIR /app/web/backend
RUN npx prisma generate
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
