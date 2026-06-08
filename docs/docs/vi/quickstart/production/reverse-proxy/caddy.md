# Caddy

Nếu bạn đã có tên miền và muốn cấu hình luôn HTTPS càng sớm càng tốt, Caddy thường là lựa chọn nhẹ đầu hơn. Trong phần lớn trường hợp, chỉ cần một `Caddyfile` ngắn là đủ.

## Cấu hình tối thiểu có thể chạy

Hãy chỉnh sửa `/etc/caddy/Caddyfile`:

```text
your-domain.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:13000
}
```

Trong đó:

- đổi `your-domain.com` thành tên miền của bạn
- đổi `127.0.0.1:13000` thành địa chỉ thực tế mà NocoBase đang lắng nghe

Nếu tên miền đã trỏ đúng về máy chủ hiện tại, Caddy thường sẽ tự động xử lý việc xin và gia hạn chứng chỉ HTTPS.

## Kiểm tra và nạp lại cấu hình

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Nếu bạn không quản lý Caddy bằng `systemd`, hãy dùng quy trình khởi động và reload riêng của bạn.

## Nếu trước mắt chỉ muốn chạy HTTP

Nếu bạn chưa có tên miền, bạn cũng có thể tạm thời lắng nghe một cổng để kiểm tra trước:

```shell
:80 {
  reverse_proxy 127.0.0.1:13000
}
```

Tuy vậy, trong production thực tế, bạn vẫn nên sớm chuyển sang cấu hình có tên miền.

## Khi nào Caddy phù hợp hơn

- bạn muốn bật HTTPS nhanh hơn
- bạn không muốn tự duy trì quá nhiều cấu hình reverse proxy
- hiện tại bạn chỉ cần một lớp entry đơn giản và ổn định

## Xem tiếp ở đâu

- Nếu ứng dụng của bạn vẫn chưa chạy, hãy xem [Cài đặt bằng Docker Compose](../../installation/docker-compose.md) trước
- Nếu bạn vẫn cần kiểm tra cổng hoặc khóa, hãy xem tiếp [Biến môi trường của ứng dụng](../../installation/env.md)
