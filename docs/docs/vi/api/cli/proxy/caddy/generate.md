---
title: "nb proxy caddy generate"
description: "Tài liệu tham khảo lệnh nb proxy caddy generate: tạo hoặc làm mới cấu hình Caddy cho một env do CLI quản lý."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy generate

Tạo hoặc làm mới cấu hình đầu vào của Caddy cho một env do CLI quản lý.

## Cách dùng

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env do CLI quản lý mà bạn muốn tạo cấu hình |
| `--host` | string | Host được ghi vào địa chỉ site, ví dụ `app1.example.com` |
| `--port` | string | Cổng lắng nghe được ghi vào địa chỉ site, ví dụ `8080` |

## Tệp được tạo

Lấy env `test2` làm ví dụ, lệnh này thường duy trì các tệp và thư mục sau:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

Trong thiết kế hiện tại, `app.caddy` đã là cấu hình site hoàn chỉnh cho một env và không còn được tách thành tệp `generated.caddy` riêng nữa.

## Ví dụ

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Ghi chú

- `generate` chỉ ghi hoặc làm mới cấu hình và không tự động khởi động Caddy
- Việc tạo lại cấu hình sẽ ghi đè toàn bộ `app.caddy`
- Nếu bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` bằng `nb env update`, thông thường bạn sẽ cần chạy lại lệnh này
- Chỉ các env `local` hoặc `docker` do CLI quản lý mới dùng được lệnh này

## Lệnh liên quan

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
