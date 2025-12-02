:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

### Plugins installieren

Beachten Sie die Dokumentation zur Installation und Aktualisierung von kommerziellen Plugins.

### LibreOffice installieren (Optional)

Zum Generieren von PDFs ist die Installation von LibreOffice erforderlich. [Bitte laden Sie es von der offiziellen Website herunter](https://www.libreoffice.org/download/download-libreoffice). Für die Docker-Version können Sie ein Skript direkt im Verzeichnis `./storage/scripts` erstellen.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Der Inhalt von `install-libreoffice.sh` sieht wie folgt aus:

```sh
#!/bin/bash

# Variablen definieren
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Prüfen, ob LibreOffice bereits installiert ist
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice ist bereits installiert, die Installation wird übersprungen."
    exit 0
fi

# APT-Quellen aktualisieren
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

# APT aktualisieren und Abhängigkeiten installieren
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

# LibreOffice herunterladen und installieren, falls noch nicht vorhanden
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Fehler beim Herunterladen von LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Fehler beim Entpacken von LibreOffice."
        exit 1
    fi
fi

# LibreOffice installieren
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Fehler bei der Installation von LibreOffice."
    exit 1
fi

echo "Die Installation von LibreOffice wurde erfolgreich abgeschlossen."
```

Starten Sie den `app`-Container neu:

```bash
docker compose restart app
# Protokolle anzeigen
docker compose logs app
```

Überprüfen Sie, ob die Installation erfolgreich war:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```