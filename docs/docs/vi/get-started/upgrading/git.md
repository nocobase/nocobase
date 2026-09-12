---
title: "Hướng dẫn nâng cấp bản cài đặt mã nguồn Git"
description: "Nâng cấp NocoBase cài đặt từ mã nguồn Git: git pull, yarn install, yarn nocobase upgrade, xóa cache và cài lại phụ thuộc."
keywords: "Mã nguồn Git, nâng cấp, git pull, yarn nocobase upgrade, yarn install, NocoBase"
---

# Nâng cấp bản cài đặt từ mã nguồn Git

:::warning Chuẩn bị trước khi nâng cấp

- Bắt buộc phải backup database trước
- Dừng NocoBase đang chạy (`Ctrl + C`)

:::

## 1. Chuyển vào thư mục dự án NocoBase

```bash
cd my-nocobase-app
```

## 2. Pull code mới nhất

```bash
git pull
```

## 3. Xóa cache và phụ thuộc cũ (không bắt buộc)

Nếu quy trình nâng cấp thông thường thất bại, có thể thử xóa cache và phụ thuộc rồi tải lại

```bash
# Xóa cache nocobase
yarn nocobase clean
# Xóa phụ thuộc
yarn rimraf -rf node_modules # tương đương với rm -rf node_modules
```

## 4. Cập nhật phụ thuộc

Lưu ý: Do điều kiện mạng và cấu hình hệ thống, bước tiếp theo này có thể mất khoảng mười mấy phút.

```bash
yarn install
```

## 5. Thực thi lệnh nâng cấp

```bash
yarn nocobase upgrade
```

## 6. Khởi động NocoBase

```bash
yarn dev
```

:::tip Mẹo cho môi trường sản xuất

NocoBase cài đặt từ mã nguồn không khuyến nghị triển khai trực tiếp ở môi trường sản xuất (môi trường sản xuất vui lòng tham khảo [Triển khai môi trường sản xuất](../deployment/production.md)).

:::

## 7. Nâng cấp Plugin bên thứ ba

Tham khảo [Cài đặt và nâng cấp Plugin](../install-upgrade-plugins.mdx)
