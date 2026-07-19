---
title: "Proxy ngược môi trường sản xuất"
description: "Tạo và quản lý cấu hình proxy ngược cho NocoBase env được lưu trữ trên CLI dựa trên nb proxy nginx và nb proxy caddy."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy, proxy ngược, Nginx, Caddy, môi trường sản xuất"
---


# Proxy ngược

Bài viết này chỉ áp dụng cho các ứng dụng được cài đặt bằng `nb init`.

Trong NocoBase, proxy ngược của môi trường production không chỉ chuyển tiếp request đến process ứng dụng. Nó còn phải xử lý WebSocket, subpath, tài nguyên tĩnh frontend, thư mục tải lên, route truy cập file `/files/` và các trang fallback SPA.

Chức năng của `nb proxy` là thu thập những chi tiết dễ bị bỏ sót này thành một tập hợp các mục lệnh ổn định.

##Quy trình cốt lõi

Nếu bạn chỉ nhìn vào quy trình cốt lõi, chỉ cần nhớ ba lệnh sau là đủ:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Nếu bạn đang sử dụng Caddy, chỉ cần thay thế `nginx` trong lệnh bằng `caddy`.

`use local` và `use docker` có thể được đánh giá trực tiếp như thế này:

- Nếu Nginx hoặc Caddy đã được cài đặt cục bộ, hãy sử dụng `use local`
- Không có cài đặt cục bộ. Nếu bạn định cho phép CLI sử dụng Docker để quản lý tác nhân, hãy sử dụng `use docker`

Trong hầu hết các trường hợp, chỉ cần thực thi `use` trước, sau đó là `generate` và cuối cùng là `reload` là đủ. Để biết chi tiết về Nginx hoặc Caddy, hãy tiếp tục đến các trang tương ứng của chúng.

## Khi nào nên chọn Nginx và khi nào nên chọn Caddy

Nó thường có thể được đánh giá như thế này:

| Kịch bản | Khuyến nghị |
| --- | --- |
| Bạn đã sử dụng Nginx để quản lý trang web, chứng chỉ, bộ đệm hoặc kiểm soát truy cập của mình | [Nginx](./nginx.md) |
| Bạn đã có tên miền và muốn chạy HTTPS càng sớm càng tốt và lưu một số chi tiết TLS để duy trì | [Caddy](./caddy.md) |

## Đọc tiếp phần bên dưới

| Tôi muốn... | Tìm ở đâu |
| --- | --- |
| Theo lối vào trang quản lý Nginx | [Nginx](./nginx.md) |
| Kết nối HTTPS càng sớm càng tốt | [Caddy](./caddy.md) |
| Trước tiên hãy điều chỉnh cấu hình env sẽ ảnh hưởng đến kết quả proxy, chẳng hạn như `app-port`, `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Đầu tiên hãy xác nhận cài đặt và cấu hình env của ứng dụng | [Cài đặt bằng CLI (được khuyến nghị)](../../installation/cli.md) |
