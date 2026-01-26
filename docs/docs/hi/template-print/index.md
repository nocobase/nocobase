---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::



# टेम्पलेट प्रिंटिंग

## परिचय

टेम्पलेट प्रिंटिंग प्लगइन आपको Word, Excel और PowerPoint (जो `.docx`, `.xlsx`, `.pptx` फ़ॉर्मेट को सपोर्ट करते हैं) में टेम्पलेट फ़ाइलें डिज़ाइन करने, टेम्पलेट में प्लेसहोल्डर और लॉजिकल स्ट्रक्चर सेट करने और फिर `.docx`, `.xlsx`, `.pptx` और PDF जैसी पहले से तय फ़ॉर्मेट वाली फ़ाइलें डायनामिक रूप से जनरेट करने की सुविधा देता है। इसका व्यापक रूप से कोटेशन, इनवॉइस, कॉन्ट्रैक्ट जैसे विभिन्न व्यावसायिक दस्तावेज़ बनाने के लिए उपयोग किया जाता है।

### मुख्य विशेषताएँ

-   **कई फ़ॉर्मेट का समर्थन**: विभिन्न दस्तावेज़ जनरेशन की ज़रूरतों को पूरा करने के लिए Word, Excel और PowerPoint टेम्पलेट के साथ संगत।
-   **डायनामिक डेटा भरना**: प्लेसहोल्डर और लॉजिकल स्ट्रक्चर के ज़रिए दस्तावेज़ की सामग्री को स्वचालित रूप से भरता और जनरेट करता है।
-   **लचीला टेम्पलेट प्रबंधन**: आसान रखरखाव और दोबारा उपयोग के लिए टेम्पलेट को जोड़ने, एडिट करने, हटाने और वर्गीकृत करने का समर्थन करता है।
-   **समृद्ध टेम्पलेट सिंटैक्स**: जटिल दस्तावेज़ लॉजिक को संभालने के लिए बेसिक रिप्लेसमेंट, ऐरे एक्सेस, लूप और कंडीशनल स्टेटमेंट का समर्थन करता है।
-   **फ़ॉर्मेटर समर्थन**: पठनीयता और व्यावसायिकता को बेहतर बनाने के लिए कंडीशनल आउटपुट, डेट फ़ॉर्मेटिंग, नंबर फ़ॉर्मेटिंग आदि जैसी सुविधाएँ प्रदान करता है।
-   **कुशल आउटपुट**: सुविधाजनक शेयरिंग और प्रिंटिंग के लिए सीधे PDF जनरेशन का समर्थन करता है।

## इंस्टॉलेशन

### प्लगइन इंस्टॉल करें

[कमर्शियल प्लगइन इंस्टॉल और अपग्रेड करना](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide) देखें।

### LibreOffice इंस्टॉल करें (वैकल्पिक)

PDF जनरेट करने के लिए LibreOffice इंस्टॉल करना ज़रूरी है। [कृपया इसे आधिकारिक वेबसाइट से डाउनलोड करें](https://www.libreoffice.org/download/download-libreoffice)। डॉकर वर्ज़न के लिए, आप सीधे `./storage/scripts` डायरेक्टरी में एक स्क्रिप्ट बना सकते हैं।

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

`install-libreoffice.sh` की सामग्री इस प्रकार है:

```sh
#!/bin/bash

# वेरिएबल परिभाषित करें
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# जाँच करें कि क्या LibreOffice पहले से इंस्टॉल है
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice पहले से इंस्टॉल है, इंस्टॉलेशन छोड़ रहे हैं।"
    exit 0
fi

# APT स्रोत अपडेट करें
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

# APT अपडेट करें और डिपेंडेंसी इंस्टॉल करें
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

# LibreOffice डाउनलोड और इंस्टॉल करें यदि पहले से मौजूद नहीं है
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "LibreOffice डाउनलोड करने में विफल रहा।"
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "LibreOffice निकालने में विफल रहा।"
        exit 1
    fi
fi

# LibreOffice इंस्टॉल करें
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "LibreOffice इंस्टॉल करने में विफल रहा।"
    exit 1
fi

echo "LibreOffice इंस्टॉलेशन सफलतापूर्वक पूरा हुआ।"
```

`app` कंटेनर को रीस्टार्ट करें:

```bash
docker compose restart app
# लॉग देखें
docker compose logs app
```

जाँच करें कि इंस्टॉलेशन सफल रहा:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```