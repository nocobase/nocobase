---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Nguồn dữ liệu - KingbaseES

## Giới thiệu

KingbaseES có thể được sử dụng làm nguồn dữ liệu, hoạt động như cơ sở dữ liệu chính hoặc cơ sở dữ liệu bên ngoài.

:::warning
Hiện tại, chỉ hỗ trợ cơ sở dữ liệu KingbaseES chạy ở chế độ pg.
:::

## Cài đặt

### Sử dụng làm cơ sở dữ liệu chính

Để biết quy trình cài đặt, vui lòng tham khảo tài liệu cài đặt. Điểm khác biệt chính nằm ở các biến môi trường.

#### Biến môi trường

Chỉnh sửa tệp .env để thêm hoặc sửa đổi các cấu hình biến môi trường sau:

```bash
# Điều chỉnh các tham số DB theo thực tế
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Cài đặt bằng Docker

```yml
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # Khóa ứng dụng, dùng để tạo token người dùng, v.v.
      # Nếu APP_KEY được thay đổi, các token cũ cũng sẽ không còn hiệu lực.
      # Có thể là bất kỳ chuỗi ngẫu nhiên nào và đảm bảo không tiết lộ ra bên ngoài.
      - APP_KEY=your-secret-key
      # Loại cơ sở dữ liệu
      - DB_DIALECT=kingbase
      # Máy chủ cơ sở dữ liệu, có thể thay thế bằng IP máy chủ cơ sở dữ liệu hiện có.
      - DB_HOST=kingbase
      # Tên cơ sở dữ liệu
      - DB_DATABASE=kingbase
      # Người dùng cơ sở dữ liệu
      - DB_USER=nocobase
      # Mật khẩu cơ sở dữ liệu
      - DB_PASSWORD=nocobase
      # Múi giờ
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Dịch vụ kingbase chỉ dùng cho mục đích thử nghiệm
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Phải là no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Chỉ dành cho pg
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Cài đặt bằng create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Sử dụng làm cơ sở dữ liệu bên ngoài

Thực thi lệnh cài đặt hoặc nâng cấp:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Kích hoạt plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Hướng dẫn sử dụng

- Cơ sở dữ liệu chính: Tham khảo [Nguồn dữ liệu chính](/data-sources/data-source-main/)
- Cơ sở dữ liệu bên ngoài: Xem [Nguồn dữ liệu / Cơ sở dữ liệu bên ngoài](/data-sources/data-source-manager/external-database)