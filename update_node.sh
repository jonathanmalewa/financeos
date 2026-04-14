#!/bin/bash
echo "Membersihkan cache npm..."
npm cache clean -f

echo "Menginstal tools 'n' (Node Version Manager)..."
npm install -g n

echo "Menginstal Node.js versi 20.9.0..."
n 20.9.0

echo "Memperbarui konfigurasi..."
export PATH="/usr/local/bin:$PATH"
hash -r

echo "Versi Node.js saat ini:"
node -v

echo "Selesai! Sekarang coba jalankan 'npm run dev' kembali."
