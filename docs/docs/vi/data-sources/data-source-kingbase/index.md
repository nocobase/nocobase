---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Data Source - KingbaseES"
description: "Sử dụng KingbaseES làm Database chính hoặc External Database, hỗ trợ chế độ pg, cấu hình biến môi trường và triển khai Docker."
keywords: "KingbaseES,KingbaseES,Database chính,External database,Domestic database,NocoBase"
---
# Data Source - KingbaseES

## Giới thiệu

Sử dụng database KingbaseES làm Data Source, có thể dùng làm Database chính, cũng có thể dùng làm External Database.

:::warning
Hiện tại chỉ hỗ trợ database KingbaseES chạy ở chế độ pg.
:::

## Cài đặt

### Sử dụng làm Database chính

Quy trình cài đặt tham khảo tài liệu cài đặt, sự khác biệt chủ yếu nằm ở biến môi trường.

#### Biến môi trường

Sửa file .env để thêm hoặc sửa các cấu hình biến môi trường liên quan sau

```bash
# Điều chỉnh các tham số DB liên quan theo tình huống thực tế
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Cài đặt Docker

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

#### Sử dụng create-nocobase-app để cài đặt

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Sử dụng làm External Database

Chạy lệnh cài đặt hoặc nâng cấp

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Kích hoạt plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Hướng dẫn sử dụng

- Database chính: Tham khảo Main Data Source
- External Database: Tham khảo [Data Source / External Database](/data-sources/data-source-manager/external-database) 
