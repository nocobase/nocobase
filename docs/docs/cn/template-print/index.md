# 模板打印

<PluginInfo commercial="true" name="action-template-print"></PluginInfo>

## 介绍

模板打印插件支持使用 Word、Excel 和 PowerPoint 编辑模板文件（支持 `.docx`、`.xlsx`、`.pptx` 格式），在模板中设置占位符和逻辑结构，从而动态生成预定格式的文件，如 `.docx`、`.xlsx`、`.pptx` 以及 PDF 文件。可以广泛应用于生成各类业务文档，例如报价单、发票、合同等。

### 主要功能

- **多格式支持**：兼容 Word、Excel 和 PowerPoint 模板，满足不同文档生成需求。
- **动态数据填充**：通过占位符和逻辑结构，自动填充和生成文档内容。
- **灵活的模板管理**：支持添加、编辑、删除和分类管理模板，便于维护和使用。
- **丰富的模板语法**：支持基本替换、数组访问、循环、条件输出等多种模板语法，满足复杂文档生成需求。
- **格式化器支持**：提供条件输出、日期格式化、数字格式化等功能，提升文档的可读性和专业性。
- **高效的输出格式**：支持直接生成 PDF 文件，方便分享和打印。

## 安装

### 安装插件

详细的安装与升级方式请参考：[商业插件激活指南](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

### 安装 LibreOffice(可选)

生成 PDF 必须安装 LibreOffice,[请前往官网下载](
https://www.libreoffice.org/download/download-libreoffice)。Docker 版本,可以直接在 `./storage/scripts` 目录下,编写一段脚本。

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

`install-libreoffice.sh` 的内容如下:

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

重启 app 容器

```bash
docker compose restart app
# 查看日志
docker compose logs app
```

检测是否安装成功

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```
