---
title: "Triển khai production"
description: "Triển khai NocoBase lên production với hai bước cuối: bật tự khởi động ứng dụng và cấu hình reverse proxy."
keywords: "NocoBase,triển khai production,nb app autostart,nb env proxy,Nginx,Caddy"
---

# Triển khai production

Nếu ứng dụng NocoBase của bạn đã chạy đúng trên máy chủ, thông thường chỉ còn hai bước nữa để đưa vào production:

1. Đảm bảo ứng dụng tự khởi động lại sau khi máy được reboot
2. Đặt reverse proxy phía trước ứng dụng để cung cấp truy cập bên ngoài ổn định

Trong NocoBase CLI, các lệnh chính là:

- `nb app autostart`
- `nb env proxy`

Trang này giải thích trước luồng tổng thể. Với chi tiết của Nginx hoặc Caddy, hãy tiếp tục sang các trang con tương ứng.

## Bước 1: bật tự khởi động ứng dụng

Trong môi trường production, ưu tiên đầu tiên không phải là tên miền mà là đảm bảo dịch vụ có thể phục hồi ổn định sau khi reboot, tạo lại container hoặc thực hiện bảo trì.

Trong CLI, `nb app autostart` là một nhóm lệnh. Các lệnh được dùng nhiều nhất là:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Bật tự khởi động cho env hiện tại:

```bash
nb app autostart enable
```

Nếu bạn muốn chỉ định rõ một env khác:

```bash
nb app autostart enable --env app1 --yes
```

Sau đó, kiểm tra env nào đã được đánh dấu để tự khởi động:

```bash
nb app autostart list
```

Sau khi hệ thống khởi động, chạy lệnh sau để khởi động tất cả env đã bật autostart:

```bash
nb app autostart run
```

Nếu bạn muốn xem output startup tầng dưới để troubleshoot:

```bash
nb app autostart run --verbose
```

:::tip Lệnh này thực sự làm gì

`nb app autostart enable` đánh dấu một env do CLI quản lý là được phép tự khởi động.  
`nb app autostart run` là lệnh thực sự khởi động tất cả env đã được đánh dấu cho autostart.

Nói cách khác, trong môi trường production thực tế, bạn thường vẫn cần gắn `nb app autostart run` vào quy trình startup hệ thống của riêng mình, ví dụ như `systemd`, script khởi động của nền tảng container hoặc cơ chế boot ở cấp máy chủ mà bạn đang dùng.

:::

### Phạm vi áp dụng

`nb app autostart` chỉ áp dụng cho env có runtime do CLI quản lý trên chính máy hiện tại:

- `local`
- `docker`

Nếu env chỉ là kết nối API từ xa, hoặc ứng dụng không được CLI quản lý cục bộ trên máy này, các lệnh này không phải công cụ phù hợp cho autostart.

## Bước 2: cấu hình reverse proxy

Khi ứng dụng đã có thể tự phục hồi, bước tiếp theo là xử lý điểm vào từ bên ngoài. Trong production, reverse proxy thường chịu trách nhiệm:

- gắn domain hoặc cổng public
- chuyển tiếp lưu lượng HTTP và WebSocket tới NocoBase
- xử lý HTTPS, chứng chỉ, cache hoặc kiểm soát truy cập

Trong NocoBase CLI, các điểm vào được khuyến nghị là:

- `nb env proxy nginx`
- `nb env proxy caddy`

### Cách làm mặc định

Nếu ứng dụng của bạn đã được lưu thành một CLI env và là env `local` hoặc `docker`, thông thường chỉ cần để CLI sinh cấu hình proxy là đủ:

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

Nếu env hiện tại đã là env mục tiêu, bạn có thể bỏ `--env`:

```bash
nb env proxy nginx --host app.example.com
```

CLI giúp bao phủ những chi tiết dễ bị bỏ sót khi viết cấu hình thủ công, ví dụ:

- chuyển tiếp WebSocket
- đường dẫn entry và static asset trong triển khai theo subpath
- trang fallback cho SPA
- file cấu hình dùng chung của provider

### Khi nào chọn Nginx, khi nào chọn Caddy

Thông thường bạn có thể quyết định như sau:

| Tình huống | Khuyến nghị |
| --- | --- |
| Bạn đã dùng Nginx để quản lý website, cache, chứng chỉ hoặc kiểm soát truy cập | [Nginx](./reverse-proxy/nginx.md) |
| Bạn đã có domain và muốn bật HTTPS nhanh hơn với ít việc bảo trì TLS hơn | [Caddy](./reverse-proxy/caddy.md) |
| Bạn muốn đọc phần giải thích tổng quan của nhóm lệnh này trước | [Production Reverse Proxy](./reverse-proxy/index.md) |

Nếu bạn thay đổi cấu hình env ảnh hưởng đến kết quả proxy, như `app-port` hoặc `app-public-path`, hãy nhớ chạy lại subcommand proxy tương ứng.

## Lộ trình triển khai khuyến nghị

Nếu bạn muốn con đường đơn giản nhất để lên production, thứ tự này thường hoạt động tốt:

1. Đảm bảo ứng dụng đã có thể khởi động đúng ngay trên máy chủ
2. Chạy `nb app autostart enable`
3. Gắn `nb app autostart run` vào quy trình khởi động hệ thống
4. Chọn Nginx hoặc Caddy và chạy subcommand `nb env proxy` tương ứng
5. Kiểm tra truy cập từ bên ngoài qua domain cuối cùng hoặc địa chỉ public

## Liên kết nhanh

| Tôi muốn... | Xem tại đây |
| --- | --- |
| Bắt đầu từ phần giải thích tổng quan về reverse proxy | [Production Reverse Proxy](./reverse-proxy/index.md) |
| Tiếp tục dùng Nginx cho lớp entry | [Nginx](./reverse-proxy/nginx.md) |
| Dùng Caddy để thiết lập HTTPS nhanh hơn | [Caddy](./reverse-proxy/caddy.md) |
| Quản lý start, stop, log và upgrade | [Manage Apps](../operations/manage-app.md) |
| Đọc tài liệu tham chiếu CLI cho `nb env proxy` | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## Các lệnh liên quan

```bash
# Bật autostart cho một env
nb app autostart enable --env app1 --yes

# Liệt kê trạng thái autostart
nb app autostart list

# Khởi động tất cả env đã bật autostart
nb app autostart run

# Sinh cấu hình reverse proxy cho Nginx
nb env proxy nginx --env app1 --host app.example.com

# Sinh cấu hình reverse proxy cho Caddy
nb env proxy caddy --env app1 --host app.example.com
```
