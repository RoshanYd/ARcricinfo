# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

RUN npm run build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile --omit=dev

COPY --from=builder /app/dist ./dist

# Copy server file
COPY server.ts ./
RUN npm install -g tsx

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Runtime secrets injected via Kubernetes Secrets (env vars)
CMD ["tsx", "server.ts"]
