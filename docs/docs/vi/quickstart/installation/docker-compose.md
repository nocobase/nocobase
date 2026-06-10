# Cài đặt qua Docker Compose

Nếu bạn muốn chạy NocoBase trực tiếp trên máy chủ thì `docker compose` vẫn là cách trực tiếp nhất. Một khẩu phần `docker-compose.yml` là đủ cho hầu hết các trường hợp.

Tuy nhiên, trong môi trường sản xuất, bạn nên sửa số phiên bản cụ thể và không sử dụng trực tiếp `latest` trong thời gian dài. Điều này sẽ làm cho việc nâng cấp dễ kiểm soát hơn.

## Điều kiện tiên quyết

- Đã cài đặt Docker và Docker Compose
- Đảm bảo dịch vụ Docker được khởi động
- Một cổng mở ra thế giới bên ngoài đã được chuẩn bị sẵn, chẳng hạn như `13000`

## Bước 1: Tạo thư mục dự án

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Bước 2: Tạo `docker-compose.yml`

Ví dụ sau đây sử dụng PostgreSQL, đây cũng là sự kết hợp an toàn nhất theo mặc định:

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

TRONG:

- `APP_KEY` Nhớ đổi thành chuỗi ngẫu nhiên của riêng bạn
- `13000:80` thể hiện việc ánh xạ cổng `13000` của máy chủ tới cổng `80` của vùng chứa
- Nếu bạn đã có dịch vụ cơ sở dữ liệu, bạn có thể xóa phần `postgres` và thay đổi `DB_HOST` thành địa chỉ cơ sở dữ liệu hiện có

Nếu bạn sử dụng MySQL hoặc MariaDB, hãy nhớ thay đổi `DB_DIALECT` thành loại tương ứng và thêm:

```bash
DB_UNDERSCORED=true
```

## Bước 3: Khởi động ứng dụng

```bash
docker compose up -d
```

Kiểm tra nhật ký:

```bash
docker compose logs -f app
```

## Bước 4: Truy cập ứng dụng

Sau khi ứng dụng đã khởi động, hãy mở:

```text
http://<服务器IP>:13000
```

Nếu đây là lần đầu tiên bắt đầu, chỉ cần làm theo lời nhắc trên trang để khởi tạo tài khoản quản trị viên.

## Các lệnh thông dụng

Bắt đầu hoặc cập nhật vùng chứa:

```bash
docker compose up -d
```

Dừng ứng dụng:

```bash
docker compose down
```

Kiểm tra nhật ký:

```bash
docker compose logs -f app
```

## Nơi để tìm tiếp theo

- Nếu bạn muốn điều chỉnh cấu hình khóa, cổng, cơ sở dữ liệu, v.v., hãy tiếp tục xem [Biến môi trường ứng dụng](./env.md)
- Nếu bạn đã sẵn sàng lên mạng chính thức, hãy tiếp tục đọc [Nginx](../production/reverse-proxy/nginx.md) hoặc [Caddy](../production/reverse-proxy/caddy.md)
- Nếu bạn muốn sao lưu dữ liệu sau, hãy tiếp tục xem [Backup and Restore](../Operations/backup-restore.md)
