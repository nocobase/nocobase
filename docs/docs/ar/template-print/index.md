---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



# طباعة القوالب

## مقدمة

تتيح إضافة طباعة القوالب تصميم القوالب في Word و Excel و PowerPoint (التي تدعم صيغ `.docx` و `.xlsx` و `.pptx`)، وتحديد العناصر النائبة (placeholders) والهياكل المنطقية داخل القالب، لإنشاء مخرجات بتنسيقات محددة ديناميكيًا مثل ملفات `.docx` و `.xlsx` و `.pptx` وملفات PDF. تُستخدم هذه الإضافة على نطاق واسع لإنشاء مستندات الأعمال المختلفة، مثل عروض الأسعار والفواتير والعقود وغيرها.

### الميزات الرئيسية

- **دعم متعدد التنسيقات**: متوافق مع قوالب Word و Excel و PowerPoint لتلبية احتياجات إنشاء المستندات المختلفة.
- **تعبئة البيانات ديناميكيًا**: يقوم بتعبئة وإنشاء محتوى المستند تلقائيًا عبر العناصر النائبة والهياكل المنطقية.
- **إدارة مرنة للقوالب**: يتيح إضافة القوالب وتعديلها وحذفها وتصنيفها لسهولة الصيانة وإعادة الاستخدام.
- **صيغة قوالب غنية**: يدعم الاستبدال الأساسي، والوصول إلى المصفوفات، والحلقات التكرارية، والعبارات الشرطية للتعامل مع منطق المستندات المعقدة.
- **دعم أدوات التنسيق**: يوفر إخراجًا شرطيًا، وتنسيق التاريخ، وتنسيق الأرقام، وما إلى ذلك، لتحسين قابلية قراءة المستند واحترافيته.
- **إخراج فعال**: يدعم إنشاء ملفات PDF مباشرة لتسهيل المشاركة والطباعة.

## التثبيت

### تثبيت الإضافات

راجع [تثبيت وترقية الإضافات التجارية](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### تثبيت LibreOffice (اختياري)

يتطلب إنشاء ملفات PDF تثبيت LibreOffice. [يرجى تنزيله من الموقع الرسمي](https://www.libreoffice.org/download/download-libreoffice). بالنسبة لإصدار Docker، يمكنك إنشاء نص برمجي مباشرة في المجلد `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

محتوى ملف `install-libreoffice.sh` هو كما يلي:

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

أعد تشغيل حاوية `app`:

```bash
docker compose restart app
# عرض السجلات
docker compose logs app
```

تحقق من نجاح التثبيت:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```