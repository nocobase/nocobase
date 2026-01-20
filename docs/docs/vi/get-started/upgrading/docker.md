:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Nâng cấp cài đặt Docker

:::warning Trước khi nâng cấp

- Hãy đảm bảo bạn đã sao lưu cơ sở dữ liệu.

:::

## 1. Chuyển đến thư mục chứa tệp docker-compose.yml

Ví dụ:

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Cập nhật số phiên bản image

:::tip Về các số phiên bản

- Các phiên bản bí danh, như `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, thường không cần thay đổi.
- Các số phiên bản cụ thể, như `1.7.14`, `1.7.14-full`, cần được thay đổi thành số phiên bản mục tiêu.
- Chỉ hỗ trợ nâng cấp, không hỗ trợ hạ cấp!!!
- Trong môi trường sản xuất, bạn nên ghim vào một phiên bản số cụ thể để tránh việc tự động nâng cấp không mong muốn. [Xem tất cả các phiên bản](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Nên sử dụng image của Alibaba Cloud (mạng nội địa ổn định hơn)
    image: nocobase/nocobase:1.7.14-full
    # Bạn cũng có thể sử dụng phiên bản bí danh (có thể tự động nâng cấp, hãy thận trọng khi dùng trong môi trường sản xuất)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (có thể chậm/thất bại ở Trung Quốc)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Khởi động lại container

```bash
# Kéo image mới nhất
docker compose pull app

# Xây dựng lại container
docker compose up -d app

# Kiểm tra trạng thái tiến trình của app
docker compose logs -f app
```

## 4. Nâng cấp các plugin bên thứ ba

Tham khảo [Cài đặt và Nâng cấp Plugin](../install-upgrade-plugins.mdx)

## 5. Hướng dẫn khôi phục (Rollback)

NocoBase không hỗ trợ hạ cấp. Nếu bạn cần khôi phục, vui lòng phục hồi bản sao lưu cơ sở dữ liệu từ trước khi nâng cấp và thay đổi phiên bản image trở lại phiên bản ban đầu.

## 6. Các câu hỏi thường gặp (FAQ)

**Hỏi: Kéo image chậm hoặc thất bại**

Sử dụng dịch vụ tăng tốc image, hoặc sử dụng image của Alibaba Cloud: `nocobase/nocobase:<tag>`

**Hỏi: Phiên bản chưa thay đổi**

Xác nhận rằng bạn đã sửa đổi `image` thành số phiên bản mới và đã thực thi thành công `docker compose pull app` và `up -d app`.

**Hỏi: Tải xuống hoặc cập nhật plugin thương mại thất bại**

Đối với các plugin thương mại, vui lòng xác minh mã ủy quyền trong hệ thống, sau đó khởi động lại container Docker. Chi tiết xem tại [Hướng dẫn kích hoạt giấy phép thương mại NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).