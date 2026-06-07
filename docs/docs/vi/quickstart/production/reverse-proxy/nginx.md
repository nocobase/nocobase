# Nginx

Nếu ứng dụng NocoBase của bạn đã có thể truy cập bình thường qua `http://127.0.0.1:13000`, bước tiếp theo thường là đặt thêm một lớp Nginx phía trước. Cách này thường có hai lợi ích trực tiếp: bên ngoài chỉ cần mở các cổng chuẩn `80/443`, đồng thời cũng thuận tiện hơn khi bổ sung HTTPS, chứng chỉ và chính sách cache về sau.

## Cấu hình tối thiểu có thể chạy

Trước tiên, hãy tạo một tệp cấu hình trên máy chủ, ví dụ `/etc/nginx/conf.d/nocobase.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Trong đó:

- đổi `server_name` thành tên miền của bạn
- đổi `127.0.0.1:13000` thành địa chỉ thực tế mà NocoBase đang lắng nghe
- bạn có thể tăng `client_max_body_size` thêm tùy theo nhu cầu upload

## Kiểm tra và nạp lại cấu hình

```bash
nginx -t
systemctl reload nginx
```

Nếu bạn không quản lý Nginx bằng `systemd`, hãy dùng quy trình reload riêng của bạn.

## Truy cập sau khi cấu hình xong

Nếu DNS đã trỏ về máy chủ này, hãy truy cập:

```text
http://your-domain.com
```

Lúc này Nginx sẽ chuyển tiếp yêu cầu tới NocoBase.

## Còn HTTPS thì sao

Nếu bạn cũng cần HTTPS, thông thường có hai cách phổ biến:

- tiếp tục cấu hình chứng chỉ ngay trên Nginx
- chuyển hẳn sang [Caddy](./caddy.md) để Caddy tự động xin và gia hạn chứng chỉ

## Xem tiếp ở đâu

- Nếu ứng dụng của bạn vẫn chưa chạy, hãy xem [Cài đặt bằng Docker Compose](../../installation/docker-compose.md) trước
- Nếu bạn vẫn cần kiểm tra cổng hoặc khóa, hãy xem tiếp [Biến môi trường của ứng dụng](../../installation/env.md)
