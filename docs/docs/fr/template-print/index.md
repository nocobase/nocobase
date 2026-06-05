---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Impression de modèles

## Introduction

Le plugin d'Impression de modèles vous permet de concevoir des modèles dans Word, Excel et PowerPoint (prenant en charge les formats `.docx`, `.xlsx`, `.pptx`). Vous pouvez y définir des espaces réservés et des structures logiques pour générer dynamiquement des fichiers au format prédéfini, tels que `.docx`, `.xlsx`, `.pptx` et PDF. Il est largement utilisé pour produire divers documents commerciaux comme des devis, des factures, des contrats, etc.

### Fonctionnalités clés

- **Prise en charge multi-formats** : Compatible avec les modèles Word, Excel et PowerPoint pour répondre à divers besoins de génération de documents.
- **Remplissage dynamique des données** : Remplit et génère automatiquement le contenu des documents via des espaces réservés et des structures logiques.
- **Gestion flexible des modèles** : Permet d'ajouter, de modifier, de supprimer et de classer les modèles pour une maintenance et une réutilisation facilitées.
- **Syntaxe de modèle riche** : Prend en charge le remplacement de base, l'accès aux tableaux, les boucles et les instructions conditionnelles pour gérer la logique complexe des documents.
- **Prise en charge des formateurs** : Offre des fonctionnalités telles que la sortie conditionnelle, le formatage des dates et des nombres, pour améliorer la lisibilité et le professionnalisme des documents.
- **Sortie efficace** : Permet la génération directe de fichiers PDF pour un partage et une impression pratiques.

## Installation

### Installer le plugin

Veuillez consulter [Installation et mise à niveau des plugins commerciaux](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Installer LibreOffice (facultatif)

La génération de PDF nécessite l'installation de LibreOffice. [Veuillez le télécharger depuis le site officiel](https://www.libreoffice.org/download/download-libreoffice). Pour la version Docker, vous pouvez créer un script directement dans le répertoire `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Le contenu de `install-libreoffice.sh` est le suivant :

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

Redémarrez le conteneur `app` :

```bash
docker compose restart app
# Consulter les logs
docker compose logs app
```

Vérifiez que l'installation a réussi :

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```