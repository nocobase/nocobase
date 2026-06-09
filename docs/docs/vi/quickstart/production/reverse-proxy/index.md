---
title: "Reverse proxy trong môi trường production"
description: "Dùng nb proxy nginx và nb proxy caddy để tạo và quản lý cấu hình reverse proxy cho các env NocoBase do CLI quản lý."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,production"
---

# Reverse proxy trong môi trường production

Trong NocoBase CLI, các điểm vào được khuyến nghị cho reverse proxy production là:

- `nb proxy nginx`
- `nb proxy caddy`

Trong đó:

- `proxy` quản lý lớp entry
- `nginx` và `caddy` là các provider implementation
- `docker` và `local` là runtime driver
- `--env <name>` chọn env CLI mà bạn muốn tạo cấu hình cho

Miễn là ứng dụng của bạn đã được lưu dưới dạng env do CLI quản lý và env đó là `local` hoặc `docker`, thông thường chỉ cần để CLI tạo và quản lý cấu hình reverse proxy. Cách này giúp việc xử lý WebSocket, subpath, trang fallback SPA và các lần cập nhật sau đó luôn nhất quán ở một nơi.

Nếu ứng dụng không do CLI quản lý, hoặc bạn muốn tự tay duy trì toàn bộ cấu hình proxy, hãy chuyển sang phần cấu hình thủ công trong các trang provider tương ứng.

## Trước khi bắt đầu

Hãy chắc chắn rằng:

- ứng dụng đã có thể truy cập nội bộ, ví dụ như `http://127.0.0.1:13000`
- ứng dụng đã được lưu thành một CLI env, và env đó là `local` hoặc `docker`
- env đó đã lưu `appPort`

Nếu lệnh cho biết env còn thiếu `appPort`, hãy cập nhật trước bằng [`nb env update`](../../../api/cli/env/update.md).

Nếu sau đó bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` làm ảnh hưởng đến hành vi proxy, hãy chạy lại lệnh `generate` tương ứng.

## Luồng mặc định

Với Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Với Caddy:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Vai trò của từng bước là:

- `use docker|local`: chọn runtime driver cho provider hiện tại
- `generate --env <name> --host <domain>`: tạo cấu hình reverse proxy cho một env
- `start`: khởi động tiến trình cục bộ hoặc container Docker của provider hiện tại

## CLI duy trì những gì

CLI không chỉ tạo ra một đoạn proxy. Nó còn giữ cho các tệp trợ giúp và cấu trúc entry của site luôn đồng bộ với provider:

- Nginx duy trì `snippets`, `app.conf`, `public/index-v1.html` và `public/index-v2.html` dùng chung
- Caddy duy trì `nocobase.caddy`, `app.caddy`, `public/index-v1.html` và `public/index-v2.html`, trong đó `app.caddy` là cấu hình site đầy đủ cho một env

## Nên mở trang nào trước

| Tôi muốn... | Xem ở đâu |
| --- | --- |
| Tiếp tục dùng Nginx cho site, chứng chỉ, cache hoặc kiểm soát truy cập | [Nginx](./nginx.md) |
| Bật HTTPS nhanh và tự quản ít chi tiết TLS hơn | [Caddy](./caddy.md) |
| Điều chỉnh các thiết lập env có thể ảnh hưởng đến hành vi proxy như `app-port` hoặc `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Cài ứng dụng thành env do CLI quản lý trước | [Cài bằng CLI](../../installation/cli.md) |
