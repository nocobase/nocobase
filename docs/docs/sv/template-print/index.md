---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Mallutskrift



## Introduktion

Plugin för mallutskrift gör att ni kan designa mallar i Word, Excel och PowerPoint (med stöd för formaten `.docx`, `.xlsx`, `.pptx`), definiera platshållare och logiska strukturer i mallen, och dynamiskt generera förformaterade filer som `.docx`, `.xlsx`, `.pptx` och PDF-filer. Det kan användas brett för att producera affärsdokument som offerter, fakturor, kontrakt med mera.

### Huvudfunktioner

- **Stöd för flera format**: Kompatibel med Word-, Excel- och PowerPoint-mallar för att möta olika behov för dokumentgenerering.
- **Dynamisk datafyllning**: Fyller automatiskt i och genererar dokumentinnehåll via platshållare och logiska strukturer.
- **Flexibel mallhantering**: Stödjer att lägga till, redigera, ta bort och kategorisera mallar för enkelt underhåll och återanvändning.
- **Rik mallsyntax**: Stödjer grundläggande ersättning, array-åtkomst, loopar och villkorliga satser för att hantera komplex dokumentlogik.
- **Stöd för formaterare**: Erbjuder villkorlig utdata, datumformatering, nummerformatering med mera för att förbättra läsbarheten och professionalismen i dokumenten.
- **Effektiv utdata**: Stödjer direkt PDF-generering för bekväm delning och utskrift.

## Installation

### Installera plugin

Se [Installation och uppgradering av kommersiella plugin](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Installera LibreOffice (valfritt)

För att generera PDF-filer måste ni installera LibreOffice. [Ladda ner det från den officiella webbplatsen](https://www.libreoffice.org/download/download-libreoffice). För Docker-versionen kan ni skapa ett skript direkt i katalogen `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Innehållet i `install-libreoffice.sh` är följande:

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

Starta om `app`-containern:

```bash
docker compose restart app
# Visa loggar
docker compose logs app
```

Verifiera att installationen lyckades:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```