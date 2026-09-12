---
pkg: "@nocobase/plugin-data-source-manager"
title: "Nguồn dữ liệu chính - PostgreSQL"
description: "Tìm hiểu về các phiên bản được hỗ trợ, cách cài đặt plugin, hướng dẫn sử dụng và ánh xạ trường khi sử dụng PostgreSQL làm cơ sở dữ liệu chính của NocoBase."
keywords: "Nguồn dữ liệu chính,PostgreSQL,Cơ sở dữ liệu chính,Ánh xạ trường,NocoBase"
---

# PostgreSQL

## Giới thiệu

PostgreSQL có thể được sử dụng làm cơ sở dữ liệu chính của NocoBase để lưu trữ dữ liệu bảng hệ thống NocoBase và dữ liệu nghiệp vụ trong nguồn dữ liệu chính. Cơ sở dữ liệu chính được cấu hình khi triển khai NocoBase và không thể xóa sau khi ứng dụng đi vào hoạt động.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | >= 10. |
| Phiên bản thương mại | Được hỗ trợ trong tất cả các phiên bản Community, Standard, Professional và Enterprise. |
| Loại cơ sở dữ liệu | PostgreSQL. |

PostgreSQL hỗ trợ khả năng kế thừa bảng, phù hợp với các trường hợp cần kế thừa mô hình dữ liệu.

## Cài đặt plugin

PostgreSQL là tính năng tích hợp sẵn, không cần cài đặt plugin riêng.

## Hướng dẫn sử dụng

1.  Khi triển khai NocoBase, hãy chọn hoặc điền các tham số kết nối tương ứng với PostgreSQL trong cấu hình kết nối cơ sở dữ liệu.
2.  Sau khi khởi động NocoBase, vào nguồn dữ liệu 「Main」 trong 「Quản lý nguồn dữ liệu」 để quản lý các bảng và trường dữ liệu trong cơ sở dữ liệu chính.
3.  Nếu cần kết nối với các bảng đã tồn tại trong cơ sở dữ liệu, bạn có thể sử dụng 「Đồng bộ từ cơ sở dữ liệu」 trên trang quản lý cơ sở dữ liệu chính.
4.  Khi cấu hình trường của bảng dữ liệu, bạn có thể tham khảo danh mục [bảng dữ liệu](../data-modeling/collection.md) và [trường](../data-modeling/collection-fields/index.md) để chọn loại trường và thành phần trường.

## Ánh xạ loại trường

Trong cơ sở dữ liệu chính, khi tạo trường thông qua trang NocoBase, NocoBase sẽ tạo trường PostgreSQL tương ứng dựa trên cấu hình trường. Khi kết nối các bảng hiện có bằng 「Đồng bộ từ cơ sở dữ liệu」, NocoBase sẽ tự động ánh xạ loại trường PostgreSQL sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị giao diện trong cấu hình trường.

Các ánh xạ phổ biến như sau:

| Loại trường PostgreSQL | NocoBase Field type | Field interface khả dụng |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group、Unix timestamp、Created at、Updated at. |
| `REAL` | `float` | Number、Percent. |
| `DOUBLE PRECISION` | `double` | Number、Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID. |
| `TEXT` | `text`、`json` | Textarea、Markdown、Vditor、Rich text、URL、JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date、Time、Created at、Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point、Line string、Polygon、Circle、JSON. |
| `ARRAY` | `array` | Multiple select、Checkbox group. |

:::warning Lưu ý

Các loại trường PostgreSQL không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Những trường này cần được phát triển phần tương thích trước khi có thể sử dụng như các trường thông thường trong NocoBase.

:::

Xem thêm các cấu hình chung tại [giới thiệu về nguồn dữ liệu chính](./index.md).
