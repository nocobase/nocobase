---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::



# Друк за шаблоном

## Вступ

Плагін **Друк за шаблоном** дозволяє створювати шаблони у Word, Excel та PowerPoint (підтримуються формати `.docx`, `.xlsx`, `.pptx`). Ви можете налаштовувати у шаблонах плейсхолдери та логічні структури, щоб динамічно генерувати документи у заданих форматах, таких як `.docx`, `.xlsx`, `.pptx`, а також PDF-файли. Цей плагін широко використовується для створення різноманітних бізнес-документів, наприклад, комерційних пропозицій, рахунків-фактур, договорів тощо.

### Основні можливості

- **Підтримка багатьох форматів**: Сумісний з шаблонами Word, Excel та PowerPoint для задоволення різних потреб у генерації документів.
- **Динамічне заповнення даних**: Автоматично заповнює та генерує вміст документів за допомогою плейсхолдерів та логічних структур.
- **Гнучке керування шаблонами**: Дозволяє додавати, редагувати, видаляти та класифікувати шаблони для легкого обслуговування та повторного використання.
- **Розширена синтаксична підтримка шаблонів**: Підтримує базову заміну, доступ до масивів, цикли та умовні оператори для обробки складної логіки документів.
- **Підтримка форматерів**: Надає функції умовного виведення, форматування дати, форматування чисел тощо, щоб покращити читабельність та професійний вигляд документів.
- **Ефективний вивід**: Підтримує пряму генерацію PDF-файлів для зручного обміну та друку.

## Встановлення

### Встановлення плагінів

Зверніться до [Встановлення та оновлення комерційних плагінів](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Встановлення LibreOffice (необов'язково)

Для генерації PDF-файлів необхідно встановити LibreOffice. [Будь ласка, завантажте його з офіційного сайту](https://www.libreoffice.org/download/download-libreoffice). Для версії Docker ви можете створити скрипт безпосередньо в каталозі `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Вміст файлу `install-libreoffice.sh` такий:

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

Перезапустіть контейнер `app`:

```bash
docker compose restart app
# Переглянути логи
docker compose logs app
```

Перевірте успішність встановлення:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```