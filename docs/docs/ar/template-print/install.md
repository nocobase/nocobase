:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

### تثبيت الإضافات

راجع وثائق [تثبيت وترقية الإضافات التجارية](#).

### تثبيت LibreOffice (اختياري)

يتطلب إنشاء ملفات PDF تثبيت LibreOffice. [يرجى تنزيله من الموقع الرسمي](https://www.libreoffice.org/download/download-libreoffice). بالنسبة لإصدار Docker، يمكنك إنشاء نص برمجي مباشرة في مجلد `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

محتوى ملف `install-libreoffice.sh` هو كما يلي:

```sh
#!/bin/bash

# تعريف المتغيرات
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# التحقق مما إذا كان LibreOffice مثبتًا بالفعل
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice مثبت بالفعل، سيتم تخطي التثبيت."
    exit 0
fi

# تحديث مصادر APT
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

# تحديث APT وتثبيت التبعيات
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

# تنزيل وتثبيت LibreOffice إذا لم يكن موجودًا بالفعل
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "فشل تنزيل LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "فشل استخراج LibreOffice."
        exit 1
    fi
fi

# تثبيت LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "فشل تثبيت LibreOffice."
    exit 1
fi

echo "اكتمل تثبيت LibreOffice بنجاح."
```

أعد تشغيل حاوية `app`:

```bash
docker compose restart app
# عرض السجلات
docker compose logs app
```

تحقق مما إذا كان التثبيت ناجحًا:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```