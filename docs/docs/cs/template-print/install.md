:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


### Instalace pluginů

Viz dokumentaci k [instalaci a upgradu komerčních pluginů](#).

### Instalace LibreOffice (volitelné)

Pro generování PDF souborů je nutné nainstalovat LibreOffice. [Stáhněte si jej prosím z oficiálních stránek](https://www.libreoffice.org/download/download-libreoffice). Pro verzi Dockeru můžete skript vytvořit přímo v adresáři `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Obsah souboru `install-libreoffice.sh` je následující:

```sh
#!/bin/bash

# Definice proměnných
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Kontrola, zda je LibreOffice již nainstalován
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice je již nainstalován, instalace přeskočena."
    exit 0
fi

# Aktualizace zdrojů APT
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

# Aktualizace APT a instalace závislostí
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

# Stáhnout a nainstalovat LibreOffice, pokud ještě není přítomen
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Stažení LibreOffice se nezdařilo."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Extrakce LibreOffice se nezdařila."
        exit 1
    fi
fi

# Instalace LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Instalace LibreOffice se nezdařila."
    exit 1
fi

echo "Instalace LibreOffice byla úspěšně dokončena."
```

Restartujte kontejner `app`:

```bash
docker compose restart app
# Prohlédněte si logy
docker compose logs app
```

Ověřte, zda byla instalace úspěšná:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```