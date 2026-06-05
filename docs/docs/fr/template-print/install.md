:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

### Installation des plugins

Veuillez consulter la documentation sur l'installation et la mise à niveau des plugins commerciaux.

### Installer LibreOffice (facultatif)

Pour générer des PDF, vous devez installer LibreOffice. [Veuillez le télécharger depuis le site officiel](https://www.libreoffice.org/download/download-libreoffice). Pour la version Docker, vous pouvez créer un script directement dans le répertoire `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Le contenu de `install-libreoffice.sh` est le suivant :

```sh
#!/bin/bash

# Définition des variables
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Vérifier si LibreOffice est déjà installé
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice est déjà installé, l'installation est ignorée."
    exit 0
fi

# Mettre à jour les sources APT
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

# Mettre à jour APT et installer les dépendances
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

# Télécharger et installer LibreOffice si ce n'est pas déjà fait
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Échec du téléchargement de LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Échec de l'extraction de LibreOffice."
        exit 1
    fi
fi

# Installer LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Échec de l'installation de LibreOffice."
    exit 1
fi

echo "L'installation de LibreOffice s'est terminée avec succès."
```

Redémarrer le conteneur `app`

```bash
docker compose restart app
# Afficher les logs
docker compose logs app
```

Vérifier que l'installation a réussi :

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```