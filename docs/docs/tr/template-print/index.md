---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Şablon Yazdırma

## Giriş

Şablon Yazdırma eklentisi, Word, Excel ve PowerPoint'te (desteklenen formatlar: `.docx`, `.xlsx`, `.pptx`) şablon dosyaları tasarlamanıza olanak tanır. Bu şablonlarda yer tutucular ve mantıksal yapılar tanımlayarak, `.docx`, `.xlsx`, `.pptx` ve PDF gibi önceden belirlenmiş formatlarda dosyaları dinamik olarak oluşturabilirsiniz. Bu eklenti, teklifler, faturalar, sözleşmeler gibi çeşitli iş belgelerini üretmek için yaygın olarak kullanılabilir.

### Temel Özellikler

- **Çoklu Format Desteği**: Farklı belge oluşturma ihtiyaçlarınızı karşılamak için Word, Excel ve PowerPoint şablonlarıyla uyumludur.
- **Dinamik Veri Doldurma**: Yer tutucular ve mantıksal yapılar aracılığıyla belge içeriğini otomatik olarak doldurur ve oluşturur.
- **Esnek Şablon Yönetimi**: Şablonları ekleme, düzenleme, silme ve kategorize etme desteği sunarak kolay bakım ve yeniden kullanım sağlar.
- **Zengin Şablon Sözdizimi**: Temel değiştirme, dizi erişimi, döngüler ve koşullu ifadeler gibi çeşitli şablon sözdizimlerini destekleyerek karmaşık belge oluşturma ihtiyaçlarını karşılar.
- **Biçimlendirici Desteği**: Belgenin okunabilirliğini ve profesyonelliğini artırmak için koşullu çıktı, tarih biçimlendirme, sayı biçimlendirme gibi özellikler sunar.
- **Verimli Çıktı**: Kolay paylaşım ve yazdırma için doğrudan PDF dosyaları oluşturmayı destekler.

## Kurulum

### Eklentileri Kurma

[Ticari Eklentileri Kurma ve Yükseltme](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide) bölümüne bakın.

### LibreOffice Kurulumu (İsteğe Bağlı)

PDF oluşturmak için LibreOffice'in kurulu olması gerekmektedir. [Lütfen resmi web sitesinden indirin](https://www.libreoffice.org/download/download-libreoffice). Docker sürümü için, doğrudan `./storage/scripts` dizininde bir betik oluşturabilirsiniz.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

`install-libreoffice.sh` dosyasının içeriği aşağıdaki gibidir:

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