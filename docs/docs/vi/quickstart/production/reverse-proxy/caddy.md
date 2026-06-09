---
title: "Caddy"
description: "Dùng nb proxy caddy để tạo và quản lý cấu hình reverse proxy Caddy cho các env NocoBase do CLI quản lý."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,production"
---

# Caddy

Nếu bạn đã có domain và muốn bật HTTPS thật nhanh, `nb proxy caddy` thường là điểm vào đơn giản nhất.

## Thứ tự được khuyến nghị

Với một env do CLI quản lý thuộc loại `local` hoặc `docker`, thứ tự mặc định là:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Hoặc chạy bằng tiến trình cục bộ:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Các lệnh theo sau thường dùng là:

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

## Dữ liệu đầu vào cho `generate`

Cách dùng phổ biến nhất là:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Nếu bạn cũng muốn chỉ định cổng entry:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Trong đó:

- `--env`: env CLI nào sẽ được tạo cấu hình
- `--host`: tên miền công khai
- `--port`: cổng entry của proxy

Với Caddy, `--host` đặc biệt quan trọng vì địa chỉ site ảnh hưởng trực tiếp đến luồng HTTPS.

## Các tệp do CLI quản lý

Lấy `test2` làm ví dụ, workflow của Caddy thường quản lý:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

Trong đó:

- `nocobase.caddy` là tệp entry ở cấp provider, dùng để import tất cả các tệp `app.caddy` của env
- `app.caddy` là cấu hình site đầy đủ cho một env và sẽ bị ghi đè toàn bộ khi bạn tạo lại

## Cấu hình viết tay

Nếu ứng dụng không do CLI quản lý, hoặc bạn cố ý muốn tự duy trì toàn bộ cấu hình Caddy, bạn vẫn có thể viết tay.

Nhưng với NocoBase, một entry Caddy sẵn sàng cho production thường phải xử lý nhiều hơn một dòng `reverse_proxy` đơn giản. Thông thường nó cũng bao gồm uploads, tài nguyên frontend, các route `.well-known`, WebSocket và các trang fallback SPA.

Khi ứng dụng dùng triển khai theo subpath, hoặc khi tài nguyên, uploads và lớp entry không cùng chia sẻ một góc nhìn đường dẫn, cấu hình viết tay sẽ dễ sai hơn. Trong những trường hợp như vậy, thường an toàn hơn nếu tạo cấu hình trước bằng:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

## Liên kết liên quan

- [Reverse proxy trong môi trường production](./index.md)
- [Nginx](./nginx.md)
- [Cài bằng CLI](../../installation/cli.md)
