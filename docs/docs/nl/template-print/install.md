:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

### Plugins installeren

Raadpleeg de documentatie over het installeren en upgraden van commerciële plugins.

### LibreOffice installeren (optioneel)

Voor het genereren van PDF's is het noodzakelijk om LibreOffice te installeren. [U kunt het downloaden via de officiële website](https://www.libreoffice.org/download/download-libreoffice). Voor de Docker-versie kunt u direct een script aanmaken in de map `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

De inhoud van `install-libreoffice.sh` is als volgt:

```sh
#!/bin/bash

# Variabelen definiëren
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Controleren of LibreOffice al is geïnstalleerd
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice is al geïnstalleerd, installatie wordt overgeslagen."
    exit 0
fi

# APT-bronnen bijwerken
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

# APT bijwerken en afhankelijkheden installeren
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

# LibreOffice downloaden en installeren indien nog niet aanwezig
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Downloaden van LibreOffice mislukt."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Uitpakken van LibreOffice mislukt."
        exit 1
    fi
fi

# LibreOffice installeren
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Installatie van LibreOffice mislukt."
    exit 1
fi

echo "LibreOffice installatie succesvol voltooid."
```

Herstart de `app`-container:

```bash
docker compose restart app
# Logs bekijken
docker compose logs app
```

Controleer of de installatie succesvol was:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```