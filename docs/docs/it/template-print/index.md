---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: "@nocobase/plugin-action-template-print"
---

# Stampa da Modello



## Introduzione

Il plugin Stampa da Modello Le permette di creare modelli in Word, Excel e PowerPoint (supporta i formati `.docx`, `.xlsx`, `.pptx`), definire segnaposto e strutture logiche all'interno del modello, e generare dinamicamente documenti pre-formattati come `.docx`, `.xlsx`, `.pptx` e PDF. È ampiamente utilizzato per produrre documenti aziendali di vario tipo, come preventivi, fatture, contratti, ecc.

### Caratteristiche Principali

- **Supporto multi-formato**: Compatibile con i modelli Word, Excel e PowerPoint per soddisfare diverse esigenze di generazione documenti.
- **Compilazione dinamica dei dati**: Popola e genera automaticamente il contenuto dei documenti tramite segnaposto e strutture logiche.
- **Gestione flessibile dei modelli**: Permette di aggiungere, modificare, eliminare e categorizzare i modelli per una facile manutenzione e riutilizzo.
- **Sintassi ricca per i modelli**: Supporta la sostituzione di base, l'accesso agli array, i cicli e le istruzioni condizionali per gestire logiche di documento complesse.
- **Supporto per i formattatori**: Offre output condizionale, formattazione di date, formattazione di numeri, ecc., per migliorare la leggibilità e la professionalità dei documenti.
- **Output efficiente**: Supporta la generazione diretta di file PDF per una comoda condivisione e stampa.

## Installazione

### Installare i plugin

Faccia riferimento a [Installazione e aggiornamento dei plugin commerciali](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Installare LibreOffice (Opzionale)

La generazione di PDF richiede l'installazione di LibreOffice. [La preghiamo di scaricarlo dal sito ufficiale](https://www.libreoffice.org/download/download-libreoffice). Per la versione Docker, può creare uno script direttamente nella directory `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Il contenuto di `install-libreoffice.sh` è il seguente:

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

Riavviare il container `app`:

```bash
docker compose restart app
# Visualizzare i log
docker compose logs app
```

Verificare che l'installazione sia andata a buon fine:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002