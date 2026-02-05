:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

### Instalar Plugins

Consulte a documentação de [Instalação e Atualização de Plugins Comerciais](#).

### Instalar LibreOffice (Opcional)

Para gerar PDFs, você precisa instalar o LibreOffice. [Baixe-o no site oficial](https://www.libreoffice.org/download/download-libreoffice). Se estiver usando a versão Docker, você pode criar um script diretamente no diretório `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

O conteúdo de `install-libreoffice.sh` é o seguinte:

```sh
#!/bin/bash

# Define variáveis
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Verifica se o LibreOffice já está instalado
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice já está instalado, pulando a instalação."
    exit 0
fi

# Atualiza as fontes do APT
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

# Atualiza o APT e instala as dependências
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

# Baixa e instala o LibreOffice, se ainda não estiver presente
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Falha ao baixar o LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Falha ao extrair o LibreOffice."
        exit 1
    fi
fi

# Instala o LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Falha ao instalar o LibreOffice."
    exit 1
fi

echo "Instalação do LibreOffice concluída com sucesso."
```

Reinicie o contêiner `app`:

```bash
docker compose restart app
# Ver logs
docker compose logs app
```

Verifique se a instalação foi bem-sucedida:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```