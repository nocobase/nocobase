---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Pencetakan Template

## Pendahuluan

Plugin Pencetakan Template mendukung Anda untuk mendesain file template menggunakan Word, Excel, dan PowerPoint (mendukung format `.docx`, `.xlsx`, `.pptx`). Anda dapat mengatur placeholder dan struktur logis dalam template untuk menghasilkan file dengan format yang sudah ditentukan secara dinamis, seperti `.docx`, `.xlsx`, `.pptx`, dan juga file PDF. Plugin ini banyak digunakan untuk membuat berbagai dokumen bisnis, misalnya penawaran harga, faktur, dan kontrak.

### Fitur Utama

- **Dukungan Multi-format**: Kompatibel dengan template Word, Excel, dan PowerPoint untuk memenuhi berbagai kebutuhan pembuatan dokumen.
- **Pengisian Data Dinamis**: Secara otomatis mengisi dan menghasilkan konten dokumen melalui placeholder dan struktur logis.
- **Manajemen Template Fleksibel**: Mendukung penambahan, pengeditan, penghapusan, dan pengelolaan template berdasarkan kategori untuk memudahkan pemeliharaan dan penggunaan.
- **Sintaks Template yang Kaya**: Mendukung penggantian dasar, akses array, perulangan, dan pernyataan kondisional untuk menangani logika dokumen yang kompleks.
- **Dukungan Formatter**: Menyediakan output kondisional, pemformatan tanggal, pemformatan angka, dan fitur lainnya untuk meningkatkan keterbacaan dan profesionalisme dokumen.
- **Output Efisien**: Mendukung pembuatan file PDF secara langsung untuk kemudahan berbagi dan pencetakan.

## Instalasi

### Menginstal Plugin

Lihat [Menginstal dan Memperbarui Plugin Komersial](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Menginstal LibreOffice (Opsional)

Untuk menghasilkan PDF, Anda harus menginstal LibreOffice. [Silakan unduh dari situs web resmi](https://www.libreoffice.org/download/download-libreoffice). Untuk versi Docker, Anda dapat membuat skrip langsung di direktori `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Isi dari `install-libreoffice.sh` adalah sebagai berikut:

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

Mulai ulang kontainer `app`:

```bash
docker compose restart app
# Lihat log
docker compose logs app
```

Verifikasi instalasi berhasil:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```