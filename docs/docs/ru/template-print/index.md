---
pkg: "@nocobase/plugin-action-template-print"
---


# Печать шаблонов

## Введение

Плагин «Печать шаблонов» позволяет проектировать шаблоны в Word, Excel и PowerPoint (поддерживаются форматы `.docx`, `.xlsx`, `.pptx`), задавать в шаблоне заполнители и логические структуры и динамически получать готовые выходные файлы с сохранённым форматированием — `.docx`, `.xlsx`, `.pptx` и PDF. Широко используется для деловых документов: коммерческие предложения, счета, договоры и т. п.

### Ключевые возможности

- **Поддержка нескольких форматов**: совместимость с шаблонами Word, Excel и PowerPoint для разных сценариев генерации документов.
- **Динамическое заполнение данных**: автоматическое заполнение и генерация содержимого через заполнители и логические конструкции.
- **Гибкое управление шаблонами**: добавление, правка, удаление и категоризация шаблонов для удобного сопровождения и переиспользования.
- **Выразительный синтаксис шаблонов**: базовая подстановка, доступ к массивам, циклы и условия для сложной логики документов.
- **Поддержка форматтеров**: условный вывод, форматирование дат, чисел и др. для читаемости и аккуратного вида.
- **Эффективный вывод**: прямая генерация PDF для удобной отправки и печати.

## Установка

### Установка плагинов

Подробные инструкции по установке и обновлению см. в: [Руководство по активации коммерческих плагинов](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide)

### Установка LibreOffice (необязательно)

Для генерации PDF требуется LibreOffice. [Скачайте его с официального сайта](https://www.libreoffice.org/download/download-libreoffice). В Docker-версии можно создать скрипт в каталоге `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Содержимое `install-libreoffice.sh`:

```sh
#!/bin/bash

# Определяем переменные
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Проверяем, установлен ли уже LibreOffice
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

# Обновляем APT и устанавливаем зависимости
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

# Скачиваем и устанавливаем LibreOffice, если он ещё не загружен
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

# Устанавливаем LibreOffice
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
# Просматриваем логи
docker compose logs app
```

Убедитесь, что установка прошла успешно:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```