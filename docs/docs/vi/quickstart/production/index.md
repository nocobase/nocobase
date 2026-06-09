---
title: "Triển khai production"
description: "Hoàn tất triển khai production cho NocoBase một cách nhanh chóng: trước tiên cấu hình auto-start cho ứng dụng, sau đó cấu hình reverse proxy."
keywords: "NocoBase,production deployment,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Triển khai production

Nếu ứng dụng NocoBase của bạn đã có thể chạy bình thường trên server, thì để rollout production thông thường chỉ còn cần thêm hai việc:

1. đảm bảo ứng dụng có thể tự khôi phục sau khi máy được khởi động lại
2. thêm một reverse proxy entrypoint để ứng dụng có thể được truy cập ổn định từ bên ngoài

Trong NocoBase CLI, hai nhóm lệnh chính cho việc này là:

- `nb app autostart`
- `nb proxy`

Trang này giải thích trước toàn bộ lộ trình. Với chi tiết về Nginx hoặc Caddy, hãy tiếp tục sang các trang riêng theo từng provider.

## Bước 1: cấu hình auto-start cho ứng dụng

Trong môi trường production, ưu tiên đầu tiên không phải là domain name, mà là đảm bảo bản thân dịch vụ có thể tự phục hồi một cách ổn định. Nếu không, sau khi máy khởi động lại, container được tạo lại, hoặc có thao tác vận hành, ứng dụng có thể sẽ không tự chạy lại.

Các subcommand `nb app autostart` thường dùng nhất là:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Bật auto-start cho env hiện tại:

```bash
nb app autostart enable
```

Nếu đích không phải là env hiện tại, hãy chỉ rõ:

```bash
nb app autostart enable --env app1 --yes
```

Kiểm tra env nào đang được đánh dấu để auto-start:

```bash
nb app autostart list
```

Sau khi hệ thống khởi động, chạy tất cả các env đã được bật:

```bash
nb app autostart run
```

Nếu bạn muốn xem log khởi động chi tiết khi debug:

```bash
nb app autostart run --verbose
```

:::tip Bước này thực sự làm gì

`nb app autostart enable` đánh dấu một env do CLI quản lý là được phép tự khởi động. `nb app autostart run` sẽ thực sự khởi động tất cả các env đã bật auto-start.

Trong môi trường production, thông thường bạn vẫn cần nối `nb app autostart run` vào luồng khởi động hệ thống riêng của mình, như `systemd`, startup script của nền tảng container, hoặc một cơ chế auto-start cấp máy chủ khác mà bạn đang dùng.

:::

### Phạm vi áp dụng

`nb app autostart` chỉ hoạt động với các env có runtime do CLI quản lý:

- `local`
- `docker`

Nếu một env chỉ là kết nối API từ xa, hoặc ứng dụng không được CLI quản lý cục bộ trên máy hiện tại, thì nhóm lệnh này không phải là cách phù hợp để xử lý auto-start.

## Bước 2: cấu hình reverse proxy

Sau khi ứng dụng đã có thể tự phục hồi, bước tiếp theo là xử lý entrypoint bên ngoài. Trong production, reverse proxy thường chịu trách nhiệm:

- bind domain name hoặc cổng entry
- chuyển tiếp request HTTP và WebSocket tới NocoBase
- xử lý HTTPS, chứng chỉ, cache hoặc kiểm soát truy cập

Các CLI entrypoint được khuyến nghị là:

- `nb proxy nginx`
- `nb proxy caddy`

### Luồng mặc định

Nếu ứng dụng đã được lưu thành một CLI env và env đó là `local` hoặc `docker`, cách thông thường nhất là để CLI tự sinh cấu hình trực tiếp:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

Sau đó khởi động provider đã chọn:

```bash
nb proxy nginx start
nb proxy caddy start
```

CLI cũng hỗ trợ xử lý những chi tiết rất dễ bị bỏ sót trong cấu hình viết tay, chẳng hạn như:

- chuyển tiếp WebSocket
- URL entry và asset dưới các subpath
- trang fallback cho SPA
- các file cấu hình dùng chung ở cấp provider

### Khi nào nên chọn Nginx hoặc Caddy

| Tình huống | Khuyến nghị |
| --- | --- |
| Bạn đã dùng Nginx để quản lý site, cache, chứng chỉ hoặc kiểm soát truy cập | [Nginx](./reverse-proxy/nginx.md) |
| Bạn đã có domain và muốn bật HTTPS nhanh với ít chi tiết TLS phải tự duy trì hơn | [Caddy](./reverse-proxy/caddy.md) |
| Bạn muốn xem phần giới thiệu tổng quan trước | [Reverse Proxy trong production](./reverse-proxy/index.md) |

Nếu sau đó bạn thay đổi các thiết lập env như `app-port` hoặc `app-public-path` có ảnh hưởng tới hành vi proxy, hãy chạy lại subcommand proxy tương ứng.

## Lộ trình rollout mặc định

Đối với rollout production đơn giản nhất, trình tự sau thường là đủ:

1. xác nhận ứng dụng đã có thể khởi động bình thường ngay trên chính server đó
2. chạy `nb app autostart enable`
3. nối `nb app autostart run` vào luồng khởi động hệ thống
4. chọn Nginx hoặc Caddy và chạy subcommand `nb proxy` tương ứng
5. xác minh truy cập từ bên ngoài bằng domain name hoặc địa chỉ entry

## Chỉ mục nhanh

| Tôi muốn... | Xem tại đây |
| --- | --- |
| Đọc phần giới thiệu tổng quan về reverse proxy trước | [Reverse Proxy trong production](./reverse-proxy/index.md) |
| Tiếp tục dùng Nginx ở lớp entry | [Nginx](./reverse-proxy/nginx.md) |
| Dùng Caddy để bật HTTPS nhanh hơn | [Caddy](./reverse-proxy/caddy.md) |
| Xem các thao tác start, stop, log và upgrade của ứng dụng | [Quản lý ứng dụng](../operations/manage-app.md) |
| Đọc tài liệu CLI cho `nb proxy nginx` | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Đọc tài liệu CLI cho `nb proxy caddy` | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Lệnh liên quan

```bash
# Bật auto-start cho một env
nb app autostart enable --env app1 --yes

# Kiểm tra trạng thái auto-start
nb app autostart list

# Khởi động tất cả env đã được bật
nb app autostart run

# Chọn runtime Nginx và sinh cấu hình
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Chọn runtime Caddy và sinh cấu hình
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
