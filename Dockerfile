# Gunakan image Node.js yang ringan
FROM node:20-alpine AS base

# Install dependencies yang dibutuhkan Prisma
RUN apk add --no-cache openssl libc6-compat

# 1. Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Copy prisma schema SEBELUM npm ci (dibutuhkan oleh postinstall: prisma generate)
COPY prisma ./prisma
# Install tanpa trigger postinstall dulu, lalu generate manual
RUN npm ci --ignore-scripts
RUN npx prisma generate

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Run Next.js Build
RUN npx prisma generate
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Buat user non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output dan static files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and engine
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Buat folder untuk public uploads agar writable
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs -R /app/public/uploads
RUN chown nextjs:nodejs -R /app/prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Mulai aplikasi start (standalone.js)
CMD ["node", "server.js"]
