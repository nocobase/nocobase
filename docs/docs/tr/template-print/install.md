:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


### Eklentileri Kurma

Ticari Eklentileri Kurma ve Yükseltme belgelerine bakınız.

### LibreOffice Kurulumu (İsteğe Bağlı)

PDF oluşturmak için LibreOffice'in kurulu olması gerekmektedir. [Resmi web sitesinden indirebilirsiniz](https://www.libreoffice.org/download/download-libreoffice). Docker sürümü için, doğrudan `./storage/scripts` dizininde bir betik oluşturabilirsiniz.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

`install-libreoffice.sh` dosyasının içeriği aşağıdaki gibidir:

```sh
#!/bin/bash

# Değişkenleri tanımlayın
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# LibreOffice'in zaten kurulu olup olmadığını kontrol edin
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice zaten kurulu, kurulum atlanıyor."
    exit 0
fi

# APT kaynaklarını güncelleyin
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

# APT'yi güncelleyin ve bağımlılıkları kurun
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

# LibreOffice henüz mevcut değilse indirin ve kurun
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "LibreOffice indirilemedi."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "LibreOffice çıkarılamadı."
        exit 1
    fi
fi

# LibreOffice'i kurun
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "LibreOffice kurulamadı."
    exit 1
fi

echo "LibreOffice kurulumu başarıyla tamamlandı."
```

`app` kapsayıcısını yeniden başlatın:

```bash
docker compose restart app
# Günlükleri görüntüle
docker compose logs app
```

Kurulumun başarılı olup olmadığını doğrulayın:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```