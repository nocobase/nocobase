---
title: 'nb config'
description: 'Tài liệu tham khảo lệnh nb config: quản lý các mục cấu hình mặc định của NocoBase CLI.'
keywords: 'nb config,NocoBase CLI,cấu hình,cấu hình mặc định'
---

# nb config

Quản lý cấu hình mặc định của CLI. Các mục cấu hình hiện được hỗ trợ bao gồm:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## Các mục cấu hình thường dùng

| Mục cấu hình | Giá trị mặc định | Mô tả |
| --- | --- | --- |
| `locale` | Được phân giải theo các quy tắc hiện tại của CLI | Ghi đè ngôn ngữ mà CLI sử dụng |
| `update.policy` | `prompt` | Chính sách cập nhật khi khởi động: `prompt`, `auto` hoặc `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Ghi đè URL tải xuống của các gói mở rộng thương mại |
| `docker.network` | `nocobase` | Mạng mặc định cho các ứng dụng Docker do CLI quản lý |
| `docker.container-prefix` | `nb` | Tiền tố mặc định cho các container Docker do CLI quản lý |
| `bin.docker` | `docker` | Ghi đè đường dẫn executable Docker |
| `bin.caddy` | `caddy` | Ghi đè đường dẫn executable Caddy |
| `bin.git` | `git` | Ghi đè đường dẫn executable Git |
| `bin.nginx` | `nginx` | Ghi đè đường dẫn executable Nginx |
| `bin.yarn` | `yarn` | Ghi đè đường dẫn executable Yarn |
| `proxy.provider` | `nginx` | Provider proxy mặc định được `nb env proxy` sử dụng |
| `proxy.nb-cli-root` | Root của CLI, thường là thư mục home của người dùng hiện tại | Ánh xạ đường dẫn `.nocobase` sang root path mà tiến trình proxy nhìn thấy |
| `proxy.upstream-host` | `127.0.0.1` | Host mà proxy dùng khi chuyển tiếp lưu lượng trở lại ứng dụng NocoBase |

## Cách dùng

```bash
nb config <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb config get`](./get.md)       | Đọc giá trị có hiệu lực của một mục cấu hình                  |
| [`nb config set`](./set.md)       | Thiết lập một mục cấu hình                                    |
| [`nb config delete`](./delete.md) | Xóa một mục cấu hình được đặt tường minh                      |
| [`nb config list`](./list.md)     | Liệt kê các mục cấu hình hiện đang được đặt tường minh        |

## Ví dụ

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
