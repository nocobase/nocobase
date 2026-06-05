---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::



# Печать по шаблону

## Введение

Плагин Печать по шаблону позволяет создавать шаблоны в Word, Excel и PowerPoint (поддерживаются форматы `.docx`, `.xlsx`, `.pptx`). Вы можете определять в шаблонах заполнители и логические структуры для динамической генерации документов в заданных форматах, таких как `.docx`, `.xlsx`, `.pptx` и PDF. Этот плагин широко используется для создания различных деловых документов, например, коммерческих предложений, счетов-фактур, договоров и т.д.

### Основные возможности

- **Поддержка нескольких форматов**: Совместимость с шаблонами Word, Excel и PowerPoint для удовлетворения различных потребностей в генерации документов.
- **Динамическое заполнение данных**: Автоматическое заполнение и генерация содержимого документов с помощью заполнителей и логических структур.
- **Гибкое управление шаблонами**: Возможность добавлять, редактировать, удалять и классифицировать шаблоны для удобства обслуживания и повторного использования.
- **Расширенный синтаксис шаблонов**: Поддержка базовой замены, доступа к массивам, циклов, условного вывода и других элементов синтаксиса шаблонов для решения сложных задач генерации документов.
- **Поддержка форматирования**: Предоставляет функции условного вывода, форматирования дат, чисел и т.д., повышая читаемость и профессионализм документов.
- **Эффективный вывод**: Поддержка прямой генерации файлов PDF для удобного обмена и печати.

## Установка

### Установка плагина

Ознакомьтесь с [Установкой и обновлением коммерческих плагинов](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Установка LibreOffice (необязательно)

Для генерации PDF-файлов необходимо установить LibreOffice. [Пожалуйста, загрузите его с официального сайта](https://www.libreoffice.org/download/download-libreoffice). Для версии Docker вы можете создать скрипт непосредственно в директории `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Содержимое файла `install-libreoffice.sh` следующее:

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

Перезапустите контейнер `app`:

```bash
docker compose restart app
# Просмотр логов
docker compose logs app
```

Проверьте успешность установки:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```