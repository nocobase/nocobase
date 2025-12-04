---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# In Tài liệu Mẫu



## Giới thiệu

Plugin In Tài liệu Mẫu cho phép bạn thiết kế các tệp mẫu bằng Word, Excel và PowerPoint (hỗ trợ định dạng `.docx`, `.xlsx`, `.pptx`). Bạn có thể đặt các phần giữ chỗ (placeholder) và cấu trúc logic trong mẫu để tự động tạo ra các tệp theo định dạng đã định sẵn như `.docx`, `.xlsx`, `.pptx` và PDF. Plugin này được ứng dụng rộng rãi để tạo các loại tài liệu kinh doanh như báo giá, hóa đơn, hợp đồng, v.v.

### Các tính năng chính

- **Hỗ trợ đa định dạng**: Tương thích với các mẫu Word, Excel và PowerPoint, đáp ứng nhiều nhu cầu tạo tài liệu khác nhau.
- **Điền dữ liệu động**: Tự động điền và tạo nội dung tài liệu thông qua các phần giữ chỗ và cấu trúc logic.
- **Quản lý mẫu linh hoạt**: Hỗ trợ thêm, chỉnh sửa, xóa và phân loại mẫu để dễ dàng bảo trì và sử dụng lại.
- **Cú pháp mẫu phong phú**: Hỗ trợ thay thế cơ bản, truy cập mảng, vòng lặp và các câu lệnh điều kiện, đáp ứng nhu cầu tạo tài liệu phức tạp.
- **Hỗ trợ định dạng (Formatter)**: Cung cấp các chức năng như xuất có điều kiện, định dạng ngày tháng, định dạng số, v.v., giúp cải thiện khả năng đọc và tính chuyên nghiệp của tài liệu.
- **Đầu ra hiệu quả**: Hỗ trợ tạo tệp PDF trực tiếp, thuận tiện cho việc chia sẻ và in ấn.

## Cài đặt

### Cài đặt plugin

Tham khảo [Hướng dẫn cài đặt và nâng cấp các plugin thương mại](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide)

### Cài đặt LibreOffice (Tùy chọn)

Để tạo tệp PDF, bạn cần cài đặt LibreOffice. [Vui lòng tải xuống từ trang web chính thức](https://www.libreoffice.org/download/download-libreoffice). Đối với phiên bản Docker, bạn có thể tạo một script trực tiếp trong thư mục `./storage/scripts`.

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

Nội dung của tệp `install-libreoffice.sh` như sau:

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

Khởi động lại container `app`:

```bash
docker compose restart app
# Xem nhật ký
docker compose logs app
```

Kiểm tra xem cài đặt đã thành công chưa:

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```