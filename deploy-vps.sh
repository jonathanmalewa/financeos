#!/bin/bash
# =========================================================
#  FinanceOS — Deploy Script for Oracle Cloud VPS (Ubuntu)
#  Jalankan: bash deploy-vps.sh
# =========================================================

set -e  # Hentikan jika ada error

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ---- CONFIG — WAJIB DIISI ----
DOMAIN=""          # Contoh: finance.namadomain.com
APP_DIR="/opt/finance-os"
REPO_URL=""        # Contoh: https://github.com/username/finance-os.git
# --------------------------------

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   FinanceOS VPS Deployment Script   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ---- Validasi ----
if [ -z "$DOMAIN" ] || [ -z "$REPO_URL" ]; then
    log_error "Isi variabel DOMAIN dan REPO_URL di dalam script ini terlebih dahulu!"
fi

# ---- 1. Install dependencies ----
log_info "Menginstall Docker dan dependensi..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    log_success "Docker terinstall"
else
    log_success "Docker sudah ada: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    sudo apt install -y docker-compose-plugin
fi

# ---- 2. Clone atau update repo ----
if [ -d "$APP_DIR" ]; then
    log_info "Update kode dari repository..."
    cd $APP_DIR
    git pull origin main
else
    log_info "Clone repository ke $APP_DIR..."
    sudo git clone $REPO_URL $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    cd $APP_DIR
fi

# ---- 3. Cek .env file ----
if [ ! -f "$APP_DIR/.env" ]; then
    log_warn "File .env tidak ditemukan!"
    log_warn "Salin .env.production.example ke .env dan isi konfigurasinya:"
    log_warn "  cp $APP_DIR/.env.production.example $APP_DIR/.env"
    log_warn "  nano $APP_DIR/.env"
    log_error "Buat .env terlebih dahulu, lalu jalankan script ini lagi."
fi

# ---- 4. Update nginx domain config ----
log_info "Mengatur konfigurasi Nginx untuk domain $DOMAIN..."
sed -i "s/DOMAIN_ANDA/$DOMAIN/g" $APP_DIR/nginx/conf.d/finance-os.conf

# ---- 5. Buat config nginx sementara (HTTP only, untuk certbot) ----
cat > /tmp/finance-os-init.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        proxy_pass http://finance-os:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

cp /tmp/finance-os-init.conf $APP_DIR/nginx/conf.d/finance-os-init.conf

# ---- 6. Build dan jalankan hanya app + nginx (HTTP dulu) ----
log_info "Build Docker image FinanceOS..."
cd $APP_DIR
docker compose -f docker-compose.prod.yml build finance-os

log_info "Jalankan container (HTTP mode untuk SSL setup)..."
docker compose -f docker-compose.prod.yml up -d finance-os nginx certbot

# Tunggu app siap
log_info "Menunggu aplikasi siap..."
sleep 15

# ---- 7. Issue SSL Certificate ----
log_info "Mengambil SSL Certificate dari Let's Encrypt..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Hapus config sementara
rm -f $APP_DIR/nginx/conf.d/finance-os-init.conf

# ---- 8. Restart dengan config HTTPS penuh ----
log_info "Restart Nginx dengan konfigurasi HTTPS..."
docker compose -f docker-compose.prod.yml restart nginx

# ---- 9. Setup prisma migration ----
log_info "Menjalankan database migration..."
docker exec finance-os-app npx prisma migrate deploy
docker exec finance-os-app npx prisma db seed || log_warn "Seed sudah pernah dijalankan, skip."

# ---- 10. Setup auto-renewal SSL (cronjob) ----
log_info "Setup auto-renewal SSL certificate..."
(crontab -l 2>/dev/null; echo "0 12 * * * cd $APP_DIR && docker compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker compose -f docker-compose.prod.yml restart nginx") | crontab -

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT BERHASIL!                    ║"
echo "║   Web Anda aktif di: https://$DOMAIN        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
log_success "Cek status: docker compose -f $APP_DIR/docker-compose.prod.yml ps"
log_success "Lihat log:  docker compose -f $APP_DIR/docker-compose.prod.yml logs -f"
