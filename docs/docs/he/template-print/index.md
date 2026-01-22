---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::



# הדפסת תבניות

## מבוא

תוסף הדפסת התבניות מאפשר לכם לעצב קובצי תבנית ב-Word, Excel ו-PowerPoint (תומך בפורמטים `.docx`, `.xlsx`, `.pptx`), להגדיר בהם מצייני מיקום ומבנים לוגיים, וליצור באופן דינמי קבצים בפורמטים מוגדרים מראש כגון `.docx`, `.xlsx`, `.pptx` וקבצי PDF. הוא נמצא בשימוש נרחב ליצירת מגוון מסמכים עסקיים, כמו הצעות מחיר, חשבוניות וחוזים.

### תכונות עיקריות

-   **תמיכה בריבוי פורמטים**: תואם לתבניות Word, Excel ו-PowerPoint כדי לענות על צרכי יצירת מסמכים שונים.
-   **מילוי נתונים דינמי**: ממלא ויוצר אוטומטית תוכן מסמכים באמצעות מצייני מיקום ומבנים לוגיים.
-   **ניהול תבניות גמיש**: מאפשר הוספה, עריכה, מחיקה וסיווג תבניות לתחזוקה ושימוש קלים.
-   **תחביר תבניות עשיר**: תומך בתחבירי תבניות מגוונים כמו החלפה בסיסית, גישה למערכים, לולאות והצהרות תנאי, כדי לטפל בלוגיקת מסמכים מורכבת.
-   **תמיכה בפורמטרים**: מספק פלט מותנה, עיצוב תאריכים, עיצוב מספרים ועוד, כדי לשפר את קריאות המסמך ואת המראה המקצועי שלו.
-   **פלט יעיל**: תומך ביצירת קובצי PDF ישירות, לנוחות שיתוף והדפסה.

## התקנה

### התקנת תוספים

עיינו ב-[התקנה ושדרוג של תוספים מסחריים](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### התקנת LibreOffice (אופציונלי)

יצירת קובצי PDF דורשת התקנה של LibreOffice. [אנא הורידו אותו מהאתר הרשמי](https://www.libreoffice.org/download/download-libreoffice). עבור גרסת Docker, באפשרותכם ליצור סקריפט ישירות בספריית `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

התוכן של `install-libreoffice.sh` הוא כדלקמן:

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

הפעילו מחדש את קונטיינר ה-`app`:

```bash
docker compose restart app
# 查看日志
docker compose logs app
```

ודאו שההתקנה הצליחה:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```