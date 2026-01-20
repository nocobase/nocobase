---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: "@nocobase/plugin-action-template-print"
---

# Sjabloonafdrukken

## Introductie

De **plugin** voor sjabloonafdrukken stelt u in staat om sjablonen te ontwerpen in Word, Excel en PowerPoint (met ondersteuning voor de formaten `.docx`, `.xlsx`, `.pptx`), plaatsaanduidingen en logische structuren in het sjabloon te definiëren, en zo dynamisch vooraf opgemaakte bestanden te genereren, zoals `.docx`, `.xlsx`, `.pptx` en PDF-bestanden. Dit wordt veel gebruikt voor het genereren van diverse zakelijke documenten, zoals offertes, facturen en contracten.

### Belangrijkste functies

- **Ondersteuning voor meerdere formaten**: Compatibel met Word-, Excel- en PowerPoint-sjablonen om aan diverse documentgeneratiebehoeften te voldoen.
- **Dynamische gegevensvulling**: Vult en genereert automatisch documentinhoud via plaatsaanduidingen en logische structuren.
- **Flexibel sjabloonbeheer**: U kunt sjablonen toevoegen, bewerken, verwijderen en categoriseren voor eenvoudig onderhoud en hergebruik.
- **Rijke sjabloonsyntaxis**: Ondersteunt basale vervanging, **array**-toegang, lussen en voorwaardelijke instructies om complexe documentlogica te verwerken.
- **Ondersteuning voor formatters**: Biedt functies zoals voorwaardelijke uitvoer, datumopmaak en getalopmaak om de leesbaarheid en professionaliteit van documenten te verbeteren.
- **Efficiënte uitvoer**: Ondersteunt directe PDF-generatie voor gemakkelijk delen en afdrukken.

## Installatie

### **Plugins** installeren

Raadpleeg [Commerciële **plugins** installeren en upgraden](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### LibreOffice installeren (optioneel)

Voor het genereren van PDF's is de installatie van LibreOffice vereist. [Download het van de officiële website](https://www.libreoffice.org/download/download-libreoffice). Voor de Docker-versie kunt u direct een script aanmaken in de map `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

De inhoud van `install-libreoffice.sh` is als volgt:

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