:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


### Встановлення плагінів

Зверніться до документації зі [встановлення та оновлення комерційних плагінів](#).

### Встановлення LibreOffice (необов'язково)

Для генерації PDF-файлів необхідно встановити LibreOffice. [Будь ласка, завантажте його з офіційного сайту](https://www.libreoffice.org/download/download-libreoffice). Якщо ви використовуєте версію Docker, ви можете створити скрипт безпосередньо в директорії `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Вміст файлу `install-libreoffice.sh` такий:

```sh
#!/bin/bash

# Визначення змінних
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Перевірка, чи LibreOffice вже встановлено
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice вже встановлено, пропускаємо інсталяцію."
    exit 0
fi

# Оновлення джерел APT
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

# Оновлення APT та встановлення залежностей
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

# Завантаження та встановлення LibreOffice, якщо його ще немає
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Не вдалося завантажити LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Не вдалося розпакувати LibreOffice."
        exit 1
    fi
fi

# Встановлення LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Не вдалося встановити LibreOffice."
    exit 1
fi

echo "Встановлення LibreOffice успішно завершено."
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