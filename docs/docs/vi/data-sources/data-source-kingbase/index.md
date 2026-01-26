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
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
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
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
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