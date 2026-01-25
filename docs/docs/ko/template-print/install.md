:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

### 플러그인 설치

상업용 플러그인 설치 및 업그레이드 문서를 참조하세요.

### LibreOffice 설치 (선택 사항)

PDF를 생성하려면 LibreOffice를 설치해야 합니다. [공식 웹사이트에서 다운로드하세요.](https://www.libreoffice.org/download/download-libreoffice) Docker 버전의 경우, `./storage/scripts` 디렉터리에 스크립트를 직접 작성할 수 있습니다.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

`install-libreoffice.sh` 파일의 내용은 다음과 같습니다.

```sh
#!/bin/bash

# 변수 정의
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# LibreOffice가 이미 설치되어 있는지 확인
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice가 이미 설치되어 있습니다. 설치를 건너뜠니다."
    exit 0
fi

# APT 소스 업데이트
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

# APT 업데이트 및 종속성 설치
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

# LibreOffice가 없으면 다운로드하여 설치
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "LibreOffice 다운로드에 실패했습니다."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "LibreOffice 압축 해제에 실패했습니다."
        exit 1
    fi
fi

# LibreOffice 설치
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "LibreOffice 설치에 실패했습니다."
    exit 1
fi

echo "LibreOffice 설치가 성공적으로 완료되었습니다."
```

`app` 컨테이너를 재시작합니다.

```bash
docker compose restart app
# 로그 확인
docker compose logs app
```

설치가 성공적으로 완료되었는지 확인합니다.

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```