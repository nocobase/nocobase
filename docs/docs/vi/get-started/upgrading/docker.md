---
title: "Hướng dẫn nâng cấp bản cài đặt Docker"
description: "Nâng cấp NocoBase cài đặt Docker: cập nhật version image, docker compose up, image Aliyun, version chỉ tăng không giảm."
keywords: "Nâng cấp Docker, version image, docker compose up, image Aliyun, nocobase/nocobase, NocoBase"
---

# Nâng cấp bản cài đặt Docker

:::warning Chuẩn bị trước khi nâng cấp

- Bắt buộc phải backup database trước

:::

## 1. Chuyển vào thư mục chứa docker-compose.yml

Ví dụ

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Cập nhật version image

:::tip Hướng dẫn về version

- Version dạng alias như `latest` `latest-full` `beta` `beta-full` `alpha` `alpha-full`, thường không cần sửa
- Version dạng số như `1.7.14` `1.7.14-full` cần sửa thành version đích
- Version chỉ hỗ trợ nâng cấp, không hỗ trợ hạ cấp!!!
- Môi trường sản xuất khuyến nghị cố định version số cụ thể, tránh việc tự động nâng cấp ngoài ý muốn. [Xem tất cả version](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Khuyến nghị dùng image Aliyun (mạng nội địa Trung Quốc ổn định hơn)
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:1.7.14-full
    # Cũng có thể dùng version alias (có thể tự động nâng cấp, dùng thận trọng cho sản xuất)
    # image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    # image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:beta-full
    # Docker Hub (tại Trung Quốc có thể chậm/lỗi)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Khởi động lại container

```bash
# Pull image mới nhất
docker compose pull app

# Build lại container
docker compose up -d app

# Xem trạng thái tiến trình app
docker compose logs -f app
```

## 4. Nâng cấp Plugin bên thứ ba

Tham khảo [Cài đặt và nâng cấp Plugin](../install-upgrade-plugins.mdx)

## 5. Hướng dẫn rollback

NocoBase không hỗ trợ hạ cấp. Nếu cần rollback, vui lòng khôi phục backup database trước khi nâng cấp và đổi version image về version cũ.

## 6. Câu hỏi thường gặp (FAQ)

**Q: Pull image chậm hoặc lỗi**

Sử dụng image accelerator hoặc dùng image Aliyun `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:<tag>`

**Q: Version không thay đổi**

Xác nhận đã sửa `image` thành version mới và đã thực thi thành công `docker compose pull app` và `up -d app`

**Q: Plugin thương mại tải hoặc cập nhật lỗi**

Đối với Plugin thương mại, vui lòng xác minh mã ủy quyền trong hệ thống, sau khi xác minh khởi động lại container Docker. Xem chi tiết tại [Hướng dẫn kích hoạt ủy quyền thương mại NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).
