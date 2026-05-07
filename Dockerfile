# --- 1) deps stage: install all dependencies (incl. native sqlite & sharp) ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ pkgconfig vips-dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# --- 2) build stage: produce the standalone bundle ---
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat vips-dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- 3) runner: minimal image that runs the standalone server ---
FROM node:20-alpine AS runner
RUN apk add --no-cache vips libstdc++
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy standalone output
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

# better-sqlite3 needs node-gyp output - the build stage already compiled it,
# but the standalone bundle does NOT pull it in. We re-link it.
COPY --from=builder --chown=app:app /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=app:app /app/node_modules/sharp ./node_modules/sharp
# sharp depends on these native libs at runtime; install through npm cache
COPY --from=builder --chown=app:app /app/node_modules/@img ./node_modules/@img

# Volume mount target for sqlite + uploads
RUN mkdir -p /data/uploads && chown -R app:app /data
VOLUME ["/data"]

USER app
EXPOSE 3000
CMD ["node", "server.js"]
