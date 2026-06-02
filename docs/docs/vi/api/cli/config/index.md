---
title: "nb config"
description: "Tài liệu lệnh nb config: quản lý các mục cấu hình mặc định của CLI NocoBase."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Quản lý cấu hình mặc định của CLI. Các khóa hiện được hỗ trợ:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Các khóa thường dùng

| Khóa | Giá trị mặc định | Mô tả |
| --- | --- | --- |
| `locale` | quy tắc phân giải locale hiện tại của CLI | Ghi đè ngôn ngữ mà CLI sử dụng |
| `update.policy` | `prompt` | Hành vi cập nhật khi khởi động: `prompt`, `auto` hoặc `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Registry gói dùng cho các gói thương mại |
| `docker.network` | `nocobase` | Mạng Docker mặc định dùng bởi các ứng dụng Docker do CLI quản lý |
| `docker.container-prefix` | `nb` | Tiền tố container mặc định dùng bởi các ứng dụng Docker do CLI quản lý |
| `bin.docker` | `docker` | Ghi đè đường dẫn tới tệp thực thi Docker |
| `bin.git` | `git` | Ghi đè đường dẫn tới tệp thực thi Git |
| `bin.yarn` | `yarn` | Ghi đè đường dẫn tới tệp thực thi Yarn |

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
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
