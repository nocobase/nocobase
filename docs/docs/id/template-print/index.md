---
title: "Template Print"
description: "NocoBase Template Print: Template Word/Excel/PPT, placeholder, pengisian data dinamis, output PDF, generate Penawaran, kontrak, faktur."
keywords: "Template Print,Word,Excel,PDF,Placeholder,NocoBase"
---

# Template Print

<PluginInfo commercial="true" name="action-template-print"></PluginInfo>

## Pengantar

Plugin Template Print mendukung penggunaan Word, Excel, dan PowerPoint untuk mengedit file Template (mendukung format `.docx`, `.xlsx`, `.pptx`), mengatur placeholder dan struktur logika pada Template, sehingga dapat secara dinamis menghasilkan file dengan format yang ditentukan, seperti file `.docx`, `.xlsx`, `.pptx`, dan PDF. Dapat digunakan secara luas untuk menghasilkan berbagai dokumen bisnis, seperti Penawaran, faktur, kontrak, dll.

### Fitur Utama

- **Dukungan Multi-format**: Kompatibel dengan Template Word, Excel, dan PowerPoint, memenuhi berbagai kebutuhan generate dokumen.
- **Pengisian Data Dinamis**: Otomatis mengisi dan menghasilkan konten dokumen melalui placeholder dan struktur logika.
- **Manajemen Template Fleksibel**: Mendukung penambahan, pengeditan, penghapusan, dan manajemen kategori Template, memudahkan pemeliharaan dan penggunaan.
- **Sintaks Template Kaya**: Mendukung berbagai sintaks Template seperti penggantian dasar, akses array, loop, output kondisional, memenuhi kebutuhan generate dokumen kompleks.
- **Dukungan Formatter**: Menyediakan output kondisional, Format tanggal, Format angka, dll., meningkatkan keterbacaan dan profesionalisme dokumen.
- **Dukungan Field Gambar**: Mendukung output gambar lampiran dan gambar tanda tangan tulisan tangan dalam Template.
- **Format Output Efisien**: Mendukung pembuatan langsung file PDF, memudahkan untuk berbagi dan mencetak.

## Instalasi

### Instalasi Plugin

Untuk metode instalasi dan upgrade yang detail, silakan merujuk ke: [Panduan Aktivasi Plugin Komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

### Instal LibreOffice (Opsional)

Untuk menghasilkan PDF, harus menginstal LibreOffice, [silakan unduh dari situs resmi](
https://www.libreoffice.org/download/download-libreoffice). Versi Docker, Anda dapat langsung menulis script di direktori `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Konten `install-libreoffice.sh` adalah sebagai berikut:

```sh
#!/bin/bash

# Define variables
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Check if LibreOffice is already installed
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice is already installed, skipping installation."
    exit 0
fi

# Update APT sources
tee /etc/apt/sources.list > /dev/null <<EOF
deb http://mirrors.aliyun.com/debian/ bookworm main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm main contrib non-free
deb http://mirrors.aliyun.com/debian-security/ bookworm-security main contrib non-free
deb-src http://mirrors.aliyun.com/debian-security/ bookworm-security main contrib non-free
deb http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free
deb http://mirrors.aliyun.com/debian/ bookworm-backports main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm-backports main contrib non-free
EOF

# Update APT and install dependencies
apt-get update

apt-get install -y \
    libfreetype6 \
    fontconfig \
    libgssapi-krb5-2 \
    libxml2 \
    libnss3 \
    libdbus-1-3 \
    libcairo2 \
    libxslt1.1 \
    libglib2.0-0 \
    libcups2 \
    libx11-xcb1 \
    fonts-liberation \
    fonts-noto-cjk \
    wget

rm -rf /var/lib/apt/lists/*

cd /app/nocobase/storage/scripts

# Download and install LibreOffice if not already present
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Failed to download LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Failed to extract LibreOffice."
        exit 1
    fi
fi

# Install LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Failed to install LibreOffice."
    exit 1
fi

echo "LibreOffice installation completed successfully."
```

Restart container app

```bash
docker compose restart app
# Lihat log
docker compose logs app
```

Periksa apakah instalasi berhasil

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```
