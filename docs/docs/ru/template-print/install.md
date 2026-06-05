:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

### Установка плагинов

Обратитесь к документации по [установке и обновлению коммерческих плагинов](#).

### Установка LibreOffice (необязательно)

Для генерации PDF-файлов необходимо установить LibreOffice. [Загрузите его с официального сайта](https://www.libreoffice.org/download/download-libreoffice). Для версии Docker вы можете создать скрипт прямо в директории `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Содержимое файла `install-libreoffice.sh` следующее:

```sh
#!/bin/bash

# Определение переменных
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Проверка, установлен ли LibreOffice
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice уже установлен, пропуск установки."
    exit 0
fi

# Обновление источников APT
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

# Обновление APT и установка зависимостей
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

# Загрузка и установка LibreOffice, если он еще не установлен
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Не удалось загрузить LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Не удалось извлечь LibreOffice."
        exit 1
    fi
fi

# Установка LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Не удалось установить LibreOffice."
    exit 1
fi

echo "Установка LibreOffice успешно завершена."
```

Перезапустите контейнер `app`:

```bash
docker compose restart app
# Просмотр логов
docker compose logs app
```

Убедитесь, что установка прошла успешно:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```