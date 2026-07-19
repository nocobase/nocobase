---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Nguồn dữ liệu chính - OceanBase"
description: "Tìm hiểu về các phiên bản được hỗ trợ, cách cài đặt plugin, hướng dẫn sử dụng và ánh xạ trường khi sử dụng OceanBase làm cơ sở dữ liệu chính của NocoBase."
keywords: "Nguồn dữ liệu chính,OceanBase,Cơ sở dữ liệu chính,Ánh xạ trường,NocoBase"
---

# OceanBase

## Giới thiệu

OceanBase có thể được sử dụng làm cơ sở dữ liệu chính của NocoBase để lưu trữ dữ liệu bảng hệ thống NocoBase và dữ liệu nghiệp vụ trong nguồn dữ liệu chính. Cơ sở dữ liệu chính được cấu hình khi triển khai NocoBase và không thể xóa sau khi ứng dụng đi vào hoạt động.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | >= 4.3. |
| Phiên bản thương mại | Được hỗ trợ trong phiên bản Enterprise. |
| Loại cơ sở dữ liệu | Chế độ tương thích MySQL. |

:::warning Lưu ý

Khi được sử dụng làm cơ sở dữ liệu chính, OceanBase chỉ hỗ trợ chế độ tương thích MySQL.

:::

## Cài đặt plugin

OceanBase được cung cấp bởi `@nocobase/plugin-data-source-oceanbase` và yêu cầu giấy phép thương mại.

## Hướng dẫn sử dụng

1. Khi triển khai NocoBase, hãy chọn hoặc nhập các tham số kết nối tương ứng với OceanBase trong cấu hình kết nối cơ sở dữ liệu.
2. Sau khi khởi động NocoBase, vào nguồn dữ liệu 「Main」 trong 「Quản lý nguồn dữ liệu」 để quản lý các bảng và trường dữ liệu trong cơ sở dữ liệu chính.
3. Nếu cần kết nối các bảng đã tồn tại trong cơ sở dữ liệu, bạn có thể sử dụng 「Đồng bộ từ cơ sở dữ liệu」 trên trang quản lý cơ sở dữ liệu chính.
4. Khi cấu hình các trường của bảng dữ liệu, bạn có thể tham khảo danh mục [Bảng dữ liệu](../data-modeling/collection.md) và [Trường](../data-modeling/collection-fields/index.md) để chọn loại trường và giao diện trường.

## Ánh xạ loại trường

Trong cơ sở dữ liệu chính, khi tạo trường thông qua trang NocoBase, NocoBase sẽ tạo trường OceanBase tương ứng dựa trên cấu hình trường. Khi kết nối các bảng hiện có bằng 「Đồng bộ từ cơ sở dữ liệu」, NocoBase sẽ nhận diện loại trường OceanBase theo logic tương thích MySQL và tự động ánh xạ sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ phổ biến như sau:

| Loại trường OceanBase | Field type của NocoBase | Field interface có thể chọn |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Lưu ý

Các loại trường OceanBase không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Cần phát triển khả năng tương thích cho các trường này trước khi có thể sử dụng chúng như các trường thông thường trong NocoBase.

:::

Xem thêm các cấu hình chung tại [Giới thiệu về nguồn dữ liệu chính](./index.md)。