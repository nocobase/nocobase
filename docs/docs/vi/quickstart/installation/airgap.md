#Cài đặt mạng nội bộ

Nếu máy chủ của bạn không thể truy cập mạng công cộng, phương pháp cài đặt yêu cầu bạn chuẩn bị trước các hình ảnh, phần phụ thuộc và gói plugin cần thiết để sử dụng ngoại tuyến. Theo mặc định, nên sử dụng Docker trước, vì nó có đường đi ngắn nhất và dễ tái tạo nhất.

## Khuyến nghị mặc định: Chuẩn bị Docker image offline

Trên máy có thể truy cập mạng công cộng, trước tiên hãy kéo xuống hình ảnh ứng dụng và hình ảnh cơ sở dữ liệu:

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Sau đó xuất dưới dạng tệp ngoại tuyến:

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Nếu bạn vẫn cần các plug-in thương mại, bạn cũng nên chuẩn bị gói plug-in trong môi trường mạng bên ngoài rồi đưa nó vào mạng nội bộ cùng nhau.

## Sao chép tệp vào máy chủ mạng nội bộ

Chuẩn bị ít nhất những tài liệu sau:

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` hoặc hướng dẫn triển khai của riêng bạn

## Nhập hình ảnh vào máy chủ mạng nội bộ

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## Bắt đầu ứng dụng

Sau khi chuẩn bị `docker-compose.yml`, hãy bắt đầu trực tiếp:

```bash
docker compose up -d
docker compose logs -f app
```

Nếu bạn chưa viết tệp soạn thảo, trước tiên hãy đọc [Cài đặt qua Docker Compose](./docker-compose.md) và lưu cục bộ các ví dụ vào đó.

## Phải làm gì nếu bạn không thể sử dụng Docker

Nếu không thể sử dụng Docker trong môi trường mạng nội bộ của bạn, bạn cũng có thể sử dụng `create-nocobase-app` để tạo một dự án hoàn chỉnh trong môi trường mạng bên ngoài, cài đặt các phần phụ thuộc và đóng gói nó, sau đó sao chép toàn bộ dự án vào máy chủ mạng nội bộ.

Đường dẫn này sẽ dài hơn nhưng thực tế hơn trong môi trường không có khả năng chứa. Quá trình tổng thể thường là:

1. Tạo một dự án trong môi trường mạng bên ngoài và cài đặt các phần phụ thuộc.
2. Đóng gói thư mục dự án.
3. Sao chép vào máy chủ mạng nội bộ.
4. Giải nén tệp trên mạng nội bộ, hoàn thành `.env` và khởi động ứng dụng.

## Nơi để tìm tiếp theo

- Nếu bạn chưa xác nhận cấu hình ứng dụng, hãy tiếp tục xem [Biến môi trường ứng dụng](./env.md)
- Nếu bạn đã sẵn sàng mở ứng dụng chính thức cho người dùng doanh nghiệp, hãy tiếp tục đọc [Nginx](../production/reverse-proxy/nginx.md) hoặc [Caddy](../production/reverse-proxy/caddy.md)
