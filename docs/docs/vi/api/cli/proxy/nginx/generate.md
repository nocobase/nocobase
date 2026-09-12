---
title: "nb proxy nginx generate"
description: "Tài liệu tham khảo lệnh nb proxy nginx generate: tạo hoặc làm mới cấu hình Nginx cho một env do CLI quản lý."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx generate

Tạo hoặc làm mới cấu hình đầu vào của Nginx cho một env do CLI quản lý.

## Cách dùng

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env do CLI quản lý mà bạn muốn tạo cấu hình |
| `--host` | string | Host được ghi vào cấu hình đầu vào, ví dụ `app1.example.com` |
| `--port` | string | Cổng lắng nghe được ghi vào cấu hình đầu vào, ví dụ `8080` |

## Tệp được tạo

Lấy env `test2` làm ví dụ, lệnh này thường duy trì các tệp và thư mục sau:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

Điểm vào Nginx được tạo ra bao phủ các nhóm khả năng chính sau:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Ví dụ

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Ghi chú

- `generate` chỉ ghi hoặc làm mới cấu hình và không tự động khởi động Nginx
- `app.conf` là tệp đầu vào có thể chỉnh sửa, nhưng khối được quản lý bên trong phải được giữ nguyên
- Nếu bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` bằng `nb env update`, thông thường bạn sẽ cần chạy lại lệnh này
- Chỉ các env `local` hoặc `docker` do CLI quản lý mới dùng được lệnh này

## Lệnh liên quan

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
