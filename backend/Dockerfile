# ─────────────────────────────────────────────
# Stage 1: Install production dependencies only
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# ─────────────────────────────────────────────
# Stage 2: Build (all deps + compile TypeScript)
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Production runner (smallest image)
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nestjs && \
    adduser  --system --uid 1001 nestjs

WORKDIR /app

COPY --from=builder --chown=nestjs:nestjs /app/dist        ./dist
COPY --from=deps    --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --chown=nestjs:nestjs package.json ./

RUN mkdir -p uploads && chown nestjs:nestjs uploads

USER nestjs

ENV NODE_ENV=production \
    PORT=3001 \
    ORT_LOG_SEVERITY_LEVEL=3 \
    ORT_LOG_VERBOSITY_LEVEL=0

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/ || exit 1

CMD ["node", "dist/main"]
