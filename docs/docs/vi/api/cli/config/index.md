---
title: 'nb config'
description: 'Tài liệu tham khảo lệnh nb config: quản lý các mục cấu hình mặc định của NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,cấu hình,cấu hình mặc định'
---

# nb config

Quản lý cấu hình mặc định của CLI. Các mục cấu hình বর্তমানে được hỗ trợ bao gồm:

- `locale`
- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Các mục cấu hình thường dùng

| Mục cấu hình              | Giá trị mặc định                             | Mô tả                                                          |
| ------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `locale`                  | Được phân giải theo quy tắc hiện tại của CLI | Ghi đè ngôn ngữ được CLI sử dụng                               |
| `update.policy`           | `prompt`                                     | Chính sách cập nhật khi khởi động: `prompt`, `auto` hoặc `off` |
| `docker.network`          | `nocobase`                                   | Mạng mặc định cho các ứng dụng Docker do CLI quản lý           |
| `docker.container-prefix` | `nb`                                         | Tiền tố mặc định cho các container Docker do CLI quản lý       |
| `bin.docker`              | `docker`                                     | Ghi đè đường dẫn tệp thực thi Docker                           |
| `bin.git`                 | `git`                                        | Ghi đè đường dẫn tệp thực thi Git                              |
| `bin.yarn`                | `yarn`                                       | Ghi đè đường dẫn tệp thực thi Yarn                             |

## Cách dùng

```bash
nb config <command>
```

## Lệnh con

| Lệnh                              | Mô tả                                               |
| --------------------------------- | --------------------------------------------------- |
| [`nb config get`](./get.md)       | Đọc giá trị có hiệu lực của một mục cấu hình        |
| [`nb config set`](./set.md)       | Thiết lập một mục cấu hình                          |
| [`nb config delete`](./delete.md) | Xóa một mục cấu hình được đặt rõ ràng               |
| [`nb config list`](./list.md)     | Liệt kê các mục cấu hình hiện đang được đặt rõ ràng |

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

## Các lệnh liên quan

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
