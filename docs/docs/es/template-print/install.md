:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

### Instalar plugins

Consulte la documentación sobre [Instalación y actualización de plugins comerciales](#).

### Instalar LibreOffice (Opcional)

Para generar archivos PDF, es indispensable instalar LibreOffice. [Puede descargarlo desde el sitio web oficial](https://www.libreoffice.org/download/download-libreoffice). Si utiliza la versión de Docker, puede crear un script directamente en el directorio `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

El contenido de `install-libreoffice.sh` es el siguiente:

```sh
#!/bin/bash

# Definir variables
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Verificar si LibreOffice ya está instalado
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice ya está instalado, se omite la instalación."
    exit 0
fi

# Actualizar fuentes de APT
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

# Actualizar APT e instalar dependencias
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

# Descargar e instalar LibreOffice si aún no está presente
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Error al descargar LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Error al extraer LibreOffice."
        exit 1
    fi
fi

# Instalar LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Error al instalar LibreOffice."
    exit 1
fi

echo "La instalación de LibreOffice se completó con éxito."
```

Reinicie el contenedor `app`:

```bash
docker compose restart app
# Ver registros
docker compose logs app
```

Verifique que la instalación se haya realizado correctamente:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```