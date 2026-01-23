---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



pkg: "@nocobase/plugin-action-template-print"
---

# Vorlagendruck



## Einführung

Das Plugin für den Vorlagendruck ermöglicht es Ihnen, Vorlagen in Word, Excel und PowerPoint zu gestalten (unterstützt die Formate `.docx`, `.xlsx`, `.pptx`). Dabei können Sie Platzhalter und logische Strukturen in der Vorlage definieren, um dynamisch vordefinierte Dateien wie `.docx`, `.xlsx`, `.pptx` und PDF zu erstellen. Dies findet breite Anwendung bei der Erstellung verschiedener Geschäftsunterlagen, zum Beispiel Angebote, Rechnungen oder Verträge.

### Hauptfunktionen

- **Unterstützung mehrerer Formate**: Kompatibel mit Word-, Excel- und PowerPoint-Vorlagen, um unterschiedliche Anforderungen an die Dokumentenerstellung zu erfüllen.
- **Dynamische Datenbefüllung**: Füllt und generiert Dokumentinhalte automatisch mithilfe von Platzhaltern und logischen Strukturen.
- **Flexible Vorlagenverwaltung**: Ermöglicht das Hinzufügen, Bearbeiten, Löschen und Kategorisieren von Vorlagen für eine einfache Wartung und Wiederverwendung.
- **Umfassende Vorlagensyntax**: Unterstützt grundlegende Ersetzungen, Array-Zugriffe, Schleifen und bedingte Anweisungen, um komplexe Dokumentlogik zu verarbeiten.
- **Unterstützung von Formatierern**: Bietet Funktionen wie bedingte Ausgabe, Datumsformatierung und Zahlenformatierung, um die Lesbarkeit und Professionalität der Dokumente zu verbessern.
- **Effiziente Ausgabeformate**: Unterstützt die direkte Generierung von PDF-Dateien für eine bequeme Freigabe und den Druck.

## Installation

### Plugins installieren

Beachten Sie [Installation und Upgrade kommerzieller Plugins](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide)

### LibreOffice installieren (Optional)

Für die PDF-Generierung ist die Installation von LibreOffice erforderlich. [Bitte laden Sie es von der offiziellen Website herunter](https://www.libreoffice.org/download/download-libreoffice). Für die Docker-Version können Sie ein Skript direkt im Verzeichnis `./storage/scripts` erstellen.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Der Inhalt von `install-libreoffice.sh` ist wie folgt:

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

Starten Sie den `app`-Container neu:

```bash
docker compose restart app
# View logs
docker compose logs app
```

Überprüfen Sie, ob die Installation erfolgreich war:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```