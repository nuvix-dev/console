# syntax=docker.io/docker/dockerfile:1

# -----------------------
# Stage 0: Base
# -----------------------
FROM node:20-alpine AS base
WORKDIR /app

# Install curl and certificates required by bun installer, then install bun
RUN apk add --no-cache curl ca-certificates \
 && curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# -----------------------
# Stage 1: Prune
# -----------------------
FROM base AS pruner
# Use bunx to run turbo for pruning (no global package manager install required)
COPY . .
RUN bunx turbo prune console --out-dir=out --docker

# -----------------------
# Stage 2: Dependencies
# -----------------------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy full pruned workspace first
COPY --from=pruner /app/out/full/ ./

# If a bun.lockb exists in the pruned output it will be used; otherwise bun will create one
RUN bun install

# -----------------------
# Stage 3: Builder
# -----------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app ./

ENV NEXT_PUBLIC_NUVIX_ENDPOINT=__NUVIX_DYNAMIC_NUVIX_ENDPOINT__
ENV NEXT_PUBLIC_SERVER_ENDPOINT=__NUVIX_DYNAMIC_SERVER_ENDPOINT__
ENV NEXT_TELEMETRY_DISABLED=1

# Build only the console app using turbo via bunx
RUN bunx turbo build --filter=console

# -----------------------
# Stage 4: Runtime
# -----------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# OCI metadata
ARG VERSION=dev
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="Nuvix Console" \
      org.opencontainers.image.version=$VERSION

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy standalone output from the monorepo structure
COPY --from=builder --chown=nextjs:nodejs /app/apps/console/public ./apps/console/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/console/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/console/.next/static ./apps/console/.next/static

# Fallback values
ENV NEXT_PUBLIC_NUVIX_ENDPOINT=http://localhost:4000/v1
ENV NEXT_PUBLIC_SERVER_ENDPOINT=http://localhost:4100

# Refined Entrypoint script
RUN printf '#!/bin/sh\n\
set -e\n\
echo "Generating runtime env.js..."\n\
mkdir -p /app/apps/console/public\n\
cat <<EOF > /app/apps/console/public/env.js\n\
window.__NUVIX__ = {\n\
  API_ENDPOINT: "${NUVIX_API_ENDPOINT}",\n\
  PLATFORM_ENDPOINT: "${NUVIX_CONSOLE_API_ENDPOINT}"\n\
}\n\
EOF\n\
exec node apps/console/server.js\n' > /entrypoint.sh \
 && chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/api/health >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
