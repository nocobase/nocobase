---
title: "nb proxy"
description: "Tài liệu tham khảo nhóm lệnh nb proxy: chọn provider Nginx hoặc Caddy và quản lý reverse proxy entrypoint cho các env do CLI quản lý."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,cấu hình proxy"
---

# nb proxy

Trong NocoBase CLI, `nb proxy` là điểm vào thống nhất để quản lý reverse proxy.

CLI tách riêng việc quản lý env và quản lý lớp entry:

- `nb env` lưu và duy trì các env của ứng dụng
- `nb proxy` sinh và quản lý các entrypoint Nginx hoặc Caddy cho những env đó do CLI quản lý

Miễn là ứng dụng của bạn đã được lưu thành một env do CLI quản lý và env đó là `local` hoặc `docker`, thông thường chỉ cần chọn một subcommand của provider là đủ.

## Cách dùng

```bash
nb proxy <provider> <command>
```

## Cây lệnh

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Provider

| Tôi muốn... | Xem tại đây |
| --- | --- |
| Tiếp tục dùng Nginx cho site, chứng chỉ, cache hoặc kiểm soát truy cập | [`nb proxy nginx`](./nginx/index.md) |
| Bật HTTPS nhanh và tự quản lý ít chi tiết TLS hơn | [`nb proxy caddy`](./caddy/index.md) |
| Điều chỉnh các thiết lập env có thể ảnh hưởng đến kết quả proxy, như `app-port` hoặc `app-public-path` | [`nb env update`](../env/update.md) |

## Ghi chú

- Bản thân `nb proxy` không có flag độc lập
- Dùng `nb proxy nginx` hoặc `nb proxy caddy` để sinh và quản lý entrypoint
- Cả hai provider chỉ hoạt động với env được quản lý mà runtime của chúng có thể truy cập từ máy hiện tại, tức là `local` hoặc `docker`
- Cả hai provider đều hỗ trợ hai driver: `local` và `docker`
- `use` lưu driver mặc định, còn `current` in trực tiếp driver hiện tại
- `generate` ghi hoặc làm mới các file cấu hình entry và không tự động khởi động tiến trình proxy
- `start`, `restart`, `reload`, `stop`, `status`, và `info` đều hoạt động trên runtime của driver hiện tại
- Nếu bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` bằng `nb env update`, thông thường bạn sẽ cần chạy lại lệnh `generate` tương ứng sau đó
- Nhóm lệnh này hiện chưa hoạt động với các env chỉ có kết nối API từ xa hoặc với SSH env

## Quy trình điển hình

```bash
# 1. Chọn provider và driver runtime
nb proxy nginx use docker

# 2. Sinh cấu hình entry cho một env do CLI quản lý
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Khởi động proxy
nb proxy nginx start

# 4. Kiểm tra trạng thái và thông tin đường dẫn
nb proxy nginx status
nb proxy nginx info

# 5. Reload sau khi thay đổi cấu hình
nb proxy nginx reload
```

Nếu bạn chọn Caddy, hãy thay `nginx` bằng `caddy` trong các lệnh ở trên.

## Khác biệt thường gặp giữa các lệnh

| Lệnh | Mục đích |
| --- | --- |
| `use` | Chuyển driver mặc định của provider hiện tại |
| `current` | In ra driver hiện tại của provider, như `local` hoặc `docker` |
| `generate` | Sinh hoặc làm mới các file entry proxy cho một env |
| `start` | Khởi động proxy với driver hiện tại |
| `reload` | Tải lại cấu hình mà không dừng dịch vụ |
| `restart` | Dừng rồi khởi động lại |
| `stop` | Dừng proxy |
| `status` | Hiển thị trạng thái runtime |
| `info` | Hiển thị driver, đường dẫn config file, runtime root, upstream host và các chi tiết runtime liên quan |

## Ví dụ

```bash
# Sinh và khởi động Nginx cho một env
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Sinh và khởi động Caddy cho một env
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Lệnh liên quan

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
