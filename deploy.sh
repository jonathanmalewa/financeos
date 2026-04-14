#!/bin/bash
set -e

echo "🚀 Memulai Deployment FinanceOS di Ubuntu..."

# 1. Pastikan Docker dan docker-compose terinstall
if ! command -v docker &> /dev/null; then
    echo "❌ Docker belum terinstall. Silahkan install Docker terlebih dahulu."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    # Coba docker compose (V2)
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        echo "❌ Docker Compose belum terinstall."
        exit 1
    fi
else
    DOCKER_COMPOSE="docker-compose"
fi

# 2. Build dan start container (di build ini prisma generate akan berjalan)
echo "📦 Build dan start container via Docker Compose..."
$DOCKER_COMPOSE up -d --build

# 3. Tunggu sebentar untuk memastikan kontainer ready
echo "⏳ Menunggu container siap..."
sleep 5

# 4. Jalankan schema migration dan seed di dalam container
echo "🌱 Menjalankan migrasi database dan seed data di dalam container..."
# Kita menggunakan prisma migrate dev untuk dev.db, atau bisa push.
docker exec -it finance-os-app npx prisma db push
docker exec -it finance-os-app node prisma/seed.js

echo "✅ Deployment Selesai!"
echo "🌐 Akses aplikasi di: http://your-ip-address:3000"
echo "Log aplikasi: docker logs finance-os-app"
