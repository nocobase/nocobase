---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Nguồn dữ liệu chính - KingbaseES"
description: "Tìm hiểu về các phiên bản được hỗ trợ, cài đặt plugin, biến môi trường, triển khai Docker, hướng dẫn sử dụng và ánh xạ trường khi sử dụng KingbaseES làm cơ sở dữ liệu chính của NocoBase."
keywords: "nguồn dữ liệu chính,KingbaseES,KingbaseES,cơ sở dữ liệu chính,chế độ tương thích PostgreSQL,ánh xạ trường,NocoBase"
---

# KingbaseES

## Giới thiệu

KingbaseES có thể được sử dụng làm cơ sở dữ liệu chính của NocoBase để lưu trữ dữ liệu bảng hệ thống NocoBase và dữ liệu nghiệp vụ trong nguồn dữ liệu chính. Cơ sở dữ liệu chính được cấu hình khi triển khai NocoBase và không thể xóa sau khi ứng dụng đi vào hoạt động.

Nếu muốn kết nối cơ sở dữ liệu KingbaseES hiện có dưới dạng cơ sở dữ liệu bên ngoài, hãy tham khảo[KingbaseES bên ngoài](../external/kingbase.md).

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | >= V9. |
| Phiên bản thương mại | Được hỗ trợ trong bản Professional và Enterprise. |
| Loại cơ sở dữ liệu | Chế độ tương thích PostgreSQL. |

:::warning Lưu ý

Hiện tại chỉ hỗ trợ cơ sở dữ liệu KingbaseES chạy ở chế độ tương thích PostgreSQL.

:::

## Cài đặt

### Sử dụng làm cơ sở dữ liệu chính

Tham khảo quy trình [cài đặt ứng dụng NocoBase](/ai/install-nocobase-app); điểm khác biệt chủ yếu nằm ở các biến môi trường cơ sở dữ liệu.

#### Biến môi trường

Chỉnh sửa tệp `.env`, thêm hoặc sửa các biến môi trường liên quan đến cơ sở dữ liệu sau:

```bash
# 根据实际情况调整 DB 相关参数
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
      # 用于生成用户 token 等内容的应用密钥。
      # 修改 APP_KEY 会导致旧 token 失效，请使用随机字符串并妥善保存。
      - APP_KEY=your-secret-key
      # 数据库类型
      - DB_DIALECT=kingbase
      # 数据库地址，如果使用已有数据库服务，可以替换为对应 IP。
      - DB_HOST=kingbase
      - DB_PORT=54321
      # 数据库名称
      - DB_DATABASE=kingbase
      # 数据库用户
      - DB_USER=nocobase
      # 数据库密码
      - DB_PASSWORD=nocobase
      # 时区
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase 测试服务，仅用于本地体验。
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
      DB_MODE: pg  # 仅支持 pg 模式
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

Nếu muốn kết nối KingbaseES dưới dạng cơ sở dữ liệu bên ngoài, hãy tham khảo[KingbaseES bên ngoài](../external/kingbase.md) để biết入口 cấu hình, tham số kết nối và quy tắc đồng bộ.

## Hướng dẫn sử dụng

Nguồn dữ liệu chính KingbaseES tương thích với chế độ PostgreSQL; có thể tham khảo[nguồn dữ liệu chính PostgreSQL](./postgresql.md) để biết cách quản lý hằng ngày.

1.  Khi triển khai NocoBase, hãy chọn hoặc điền các tham số kết nối tương ứng với KingbaseES trong cấu hình kết nối cơ sở dữ liệu.
2.  Sau khi khởi động NocoBase, vào nguồn dữ liệu「Main」 trong「Quản lý nguồn dữ liệu」 để quản lý các bảng và trường dữ liệu trong cơ sở dữ liệu chính.
3.  Nếu cần kết nối các bảng đã tồn tại trong cơ sở dữ liệu, bạn có thể sử dụng「Đồng bộ từ cơ sở dữ liệu」trên trang quản lý cơ sở dữ liệu chính.
4.  Khi cấu hình các trường của bảng dữ liệu, có thể tham khảo danh mục [bảng dữ liệu](../data-modeling/collection.md), [trường](../data-modeling/collection-fields/index.md) để chọn loại trường và giao diện trường.

## Ánh xạ loại trường

Trong cơ sở dữ liệu chính, khi tạo trường thông qua giao diện NocoBase, NocoBase sẽ tạo trường KingbaseES tương ứng dựa trên cấu hình trường. Khi kết nối các bảng hiện có bằng「Đồng bộ từ cơ sở dữ liệu」, NocoBase sẽ nhận diện loại trường KingbaseES theo logic tương thích PostgreSQL và tự động ánh xạ sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ phổ biến như sau:

| Loại trường KingbaseES | NocoBase Field type | Field interface khả dụng |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json`、`array` | JSON。 |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME WITHOUT TIME ZONE` | `time` | Time。 |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON。 |

:::warning Lưu ý

Các loại trường KingbaseES không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Những trường này cần được phát triển khả năng tương thích trước khi có thể sử dụng như các trường thông thường trong NocoBase.

:::

Xem thêm các cấu hình chung tại [giới thiệu về nguồn dữ liệu chính](./index.md).
