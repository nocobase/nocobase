---
title: "nb config"
description: "Tài liệu lệnh nb config: quản lý cấu hình mặc định của CLI."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Quản lý cấu hình mặc định của CLI. Các khóa hiện được hỗ trợ:

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## Cách dùng

```bash
nb config <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb config get`](./get.md) | Lấy giá trị hiệu lực của một khóa cấu hình |
| [`nb config set`](./set.md) | Thiết lập một giá trị cấu hình |
| [`nb config delete`](./delete.md) | Xóa một giá trị đã được cấu hình rõ ràng |
| [`nb config list`](./list.md) | Liệt kê các giá trị đã được cấu hình rõ ràng |

## Ví dụ

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
