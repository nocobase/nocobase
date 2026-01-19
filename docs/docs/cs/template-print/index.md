---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Tisk z šablon

## Úvod

Plugin pro tisk z šablon Vám umožňuje navrhovat šablony v aplikacích Word, Excel a PowerPoint (podporuje formáty `.docx`, `.xlsx`, `.pptx`). V těchto šablonách můžete definovat zástupné symboly a logické struktury, a následně dynamicky generovat soubory v předem určených formátech, jako jsou `.docx`, `.xlsx`, `.pptx` a PDF. Tento plugin je široce využíván pro tvorbu různých obchodních dokumentů, například cenových nabídek, faktur, smluv a podobně.

### Klíčové funkce

- **Podpora více formátů**: Kompatibilní se šablonami Word, Excel a PowerPoint, což splňuje různé požadavky na generování dokumentů.
- **Dynamické vyplňování dat**: Automaticky vyplňuje a generuje obsah dokumentů pomocí zástupných symbolů a logických struktur.
- **Flexibilní správa šablon**: Podporuje přidávání, úpravy, mazání a kategorizaci šablon pro snadnou údržbu a opětovné použití.
- **Bohatá syntaxe šablon**: Podporuje základní nahrazování, přístup k polím, cykly a podmíněné výstupy, což umožňuje zpracování složité logiky dokumentů.
- **Podpora formátovačů**: Poskytuje funkce pro podmíněný výstup, formátování data, formátování čísel a další, což zvyšuje čitelnost a profesionalitu dokumentů.
- **Efektivní výstup**: Podporuje přímé generování souborů PDF pro pohodlné sdílení a tisk.

## Instalace

### Instalace pluginů

Viz [Instalace a aktualizace komerčních pluginů](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Instalace LibreOffice (volitelné)

Pro generování PDF je nutné nainstalovat LibreOffice. [Stáhněte si jej prosím z oficiálních stránek](https://www.libreoffice.org/download/download-libreoffice). Pro verzi Docker můžete vytvořit skript přímo v adresáři `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Obsah souboru `install-libreoffice.sh` je následující:

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

Restartujte kontejner `app`:

```bash
docker compose restart app
# Zobrazit logy
docker compose logs app
```

Ověřte, zda byla instalace úspěšná:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```