---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Impresión de Plantillas

## Introducción

El plugin de Impresión de Plantillas le permite diseñar plantillas en Word, Excel y PowerPoint (compatible con los formatos `.docx`, `.xlsx`, `.pptx`), definir marcadores de posición y estructuras lógicas en la plantilla, y generar dinámicamente archivos con formatos preestablecidos como `.docx`, `.xlsx`, `.pptx` y PDF. Se utiliza ampliamente para producir documentos comerciales como presupuestos, facturas, contratos, etc.

### Características Principales

- **Soporte multiformato**: Compatible con plantillas de Word, Excel y PowerPoint para satisfacer diversas necesidades de generación de documentos.
- **Relleno dinámico de datos**: Rellena y genera automáticamente el contenido del documento mediante marcadores de posición y estructuras lógicas.
- **Gestión flexible de plantillas**: Permite añadir, editar, eliminar y clasificar plantillas para facilitar su mantenimiento y reutilización.
- **Sintaxis de plantilla enriquecida**: Admite reemplazo básico, acceso a arrays, bucles y sentencias condicionales para manejar lógicas de documentos complejas.
- **Soporte de formateadores**: Ofrece salida condicional, formato de fecha, formato de número, etc., para mejorar la legibilidad y profesionalidad del documento.
- **Salida eficiente**: Permite la generación directa de archivos PDF para facilitar su compartición e impresión.

## Instalación

### Instalar plugins

Consulte [Instalación y actualización de plugins comerciales](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Instalar LibreOffice (Opcional)

Para generar archivos PDF, es necesario instalar LibreOffice. [Por favor, descárguelo desde el sitio web oficial](https://www.libreoffice.org/download/download-libreoffice). Para la versión de Docker, puede crear un script directamente en el directorio `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

El contenido de `install-libreoffice.sh` es el siguiente:

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

Reinicie el contenedor `app`:

```bash
docker compose restart app
# 查看日志
docker compose logs app
```

Verifique que la instalación se haya realizado correctamente:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```