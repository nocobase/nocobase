:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

### Installare i Plugin

Faccia riferimento alla documentazione sull'installazione e l'aggiornamento dei plugin commerciali.

### Installare LibreOffice (Opzionale)

Per generare PDF è necessario installare LibreOffice. [La invitiamo a scaricarlo dal sito ufficiale](https://www.libreoffice.org/download/download-libreoffice). Per la versione Docker, può creare uno script direttamente nella directory `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Il contenuto di `install-libreoffice.sh` è il seguente:

```sh
#!/bin/bash

# Definisce le variabili
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Verifica se LibreOffice è già installato
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice è già installato, si salta l'installazione."
    exit 0
fi

# Aggiorna le sorgenti APT
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

# Aggiorna APT e installa le dipendenze
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

# Scarica e installa LibreOffice se non è già presente
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Download di LibreOffice fallito."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Estrazione di LibreOffice fallita."
        exit 1
    fi
fi

# Installa LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Installazione di LibreOffice fallita."
    exit 1
fi

echo "Installazione di LibreOffice completata con successo."
```

Riavviare il container `app`:

```bash
docker compose restart app
# Visualizza i log
docker compose logs app
```

Verificare che l'installazione sia avvenuta con successo:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```