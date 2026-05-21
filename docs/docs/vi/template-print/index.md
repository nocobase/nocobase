---
title: "Template In ấn"
description: "Template In ấn NocoBase: Template Word/Excel/PPT, placeholder, điền dữ liệu động, xuất PDF, sinh báo giá hợp đồng hóa đơn."
keywords: "Template In ấn,Word,Excel,PDF,placeholder,NocoBase"
---

# Template In ấn

<PluginInfo commercial="true" name="action-template-print"></PluginInfo>

## Giới thiệu

Plugin Template In ấn hỗ trợ chỉnh sửa file Template bằng Word, Excel và PowerPoint (hỗ trợ định dạng `.docx`, `.xlsx`, `.pptx`), thiết lập placeholder và cấu trúc logic trong Template, từ đó sinh động các file có định dạng quy định, như `.docx`, `.xlsx`, `.pptx` và file PDF. Có thể được ứng dụng rộng rãi để sinh các loại tài liệu nghiệp vụ, ví dụ như báo giá, hóa đơn, hợp đồng...

### Tính năng chính

- **Hỗ trợ đa định dạng**: Tương thích với Template Word, Excel và PowerPoint, đáp ứng nhu cầu sinh tài liệu khác nhau.
- **Điền dữ liệu động**: Thông qua placeholder và cấu trúc logic, tự động điền và sinh nội dung tài liệu.
- **Quản lý Template linh hoạt**: Hỗ trợ thêm, chỉnh sửa, xóa và quản lý phân loại Template, dễ dàng bảo trì và sử dụng.
- **Cú pháp Template phong phú**: Hỗ trợ thay thế cơ bản, truy cập mảng, vòng lặp, đầu ra điều kiện... và các loại cú pháp Template, đáp ứng nhu cầu sinh tài liệu phức tạp.
- **Hỗ trợ Formatter**: Cung cấp đầu ra điều kiện, định dạng ngày, định dạng số... và các tính năng, nâng cao khả năng đọc và tính chuyên nghiệp của tài liệu.
- **Hỗ trợ trường hình ảnh**: Hỗ trợ xuất hình ảnh tệp đính kèm và hình ảnh chữ ký tay trong Template.
- **Định dạng đầu ra hiệu quả**: Hỗ trợ sinh trực tiếp file PDF, tiện chia sẻ và in ấn.

## Cài đặt

### Cài đặt Plugin

Cách cài đặt và nâng cấp chi tiết vui lòng tham khảo: [Hướng dẫn kích hoạt Plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

### Cài đặt LibreOffice (tùy chọn)

Để sinh PDF phải cài đặt LibreOffice, [vui lòng truy cập trang chính thức để tải xuống](
https://www.libreoffice.org/download/download-libreoffice). Phiên bản Docker, có thể trực tiếp viết một đoạn script trong thư mục `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Nội dung của `install-libreoffice.sh` như sau:

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

Khởi động lại container app

```bash
docker compose restart app
# Xem log
docker compose logs app
```

Kiểm tra cài đặt thành công không

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```
