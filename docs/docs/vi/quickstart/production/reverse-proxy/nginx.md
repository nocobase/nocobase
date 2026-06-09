---
title: "Nginx"
description: "Dùng nb proxy nginx để tạo và quản lý cấu hình reverse proxy Nginx cho các env NocoBase do CLI quản lý."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,production"
---

# Nginx

Nếu bạn đã dùng Nginx trên máy chủ để quản lý site, hoặc vẫn muốn tự quản lý chứng chỉ, cache và kiểm soát truy cập, thì `nb proxy nginx` là lựa chọn được khuyến nghị.

## Thứ tự được khuyến nghị

Với một env do CLI quản lý thuộc loại `local` hoặc `docker`, thứ tự mặc định là:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Hoặc chạy bằng tiến trình cục bộ:

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Các lệnh theo sau thường dùng là:

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

## Dữ liệu đầu vào cho `generate`

Cách dùng phổ biến nhất là:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Nếu bạn cũng muốn chỉ định cổng entry:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Trong đó:

- `--env`: env CLI nào sẽ được tạo cấu hình
- `--host`: tên miền công khai
- `--port`: cổng entry của proxy, không phải `appPort` của chính ứng dụng

Nếu env chưa có `appPort`, hãy lưu trước bằng `nb env update test2 --app-port 56575`.

## Các tệp do CLI quản lý

Lấy `test2` làm ví dụ, workflow của Nginx thường quản lý:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

Một entry Nginx được tạo đầy đủ thường bao phủ các khu vực sau:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

Điều đó có nghĩa là một cấu hình production thực tế của NocoBase thường không chỉ là một khối `proxy_pass` đơn giản.

## Cấu hình viết tay

Nếu ứng dụng không do CLI quản lý, hoặc bạn cố ý muốn tự duy trì toàn bộ cấu hình Nginx, bạn vẫn có thể viết tay.

Nhưng với NocoBase, một reverse proxy sẵn sàng cho production thường không chỉ xử lý việc proxy tới backend, mà còn phải xử lý uploads, tài nguyên frontend, WebSocket, các route `.well-known` và các trang fallback SPA.

Khi ứng dụng dùng triển khai theo subpath, hoặc khi tài nguyên, uploads và proxy không cùng chia sẻ một góc nhìn đường dẫn, cấu hình viết tay sẽ dễ sai hơn. Trong những trường hợp như vậy, thường an toàn hơn nếu tạo cấu hình trước bằng:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

## Liên kết liên quan

- [Reverse proxy trong môi trường production](./index.md)
- [Caddy](./caddy.md)
- [Cài bằng CLI](../../installation/cli.md)
