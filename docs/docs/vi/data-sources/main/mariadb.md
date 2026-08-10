---
pkg: "@nocobase/plugin-data-source-manager"
title: "Nguồn dữ liệu chính - MariaDB"
description: "Tìm hiểu về các phiên bản được hỗ trợ, cách cài đặt plugin, hướng dẫn sử dụng và ánh xạ trường khi sử dụng MariaDB làm cơ sở dữ liệu chính của NocoBase."
keywords: "nguồn dữ liệu chính,MariaDB,cơ sở dữ liệu chính,ánh xạ trường,NocoBase"
---

# MariaDB

## Giới thiệu

MariaDB có thể được sử dụng làm cơ sở dữ liệu chính của NocoBase, dùng để lưu trữ dữ liệu bảng hệ thống NocoBase và dữ liệu nghiệp vụ trong nguồn dữ liệu chính. Cơ sở dữ liệu chính được cấu hình khi triển khai NocoBase và không thể xóa sau khi ứng dụng đi vào hoạt động.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | >= 10.9. |
| Phiên bản thương mại | Đều được hỗ trợ trong các phiên bản Cộng đồng, Tiêu chuẩn, Chuyên nghiệp và Doanh nghiệp. |
| Loại cơ sở dữ liệu | MariaDB. |

MariaDB tương tự MySQL và phù hợp làm cơ sở dữ liệu chính cho các hệ thống nghiệp vụ thông thường.

## Cài đặt plugin

MariaDB là tính năng tích hợp sẵn, không cần cài đặt plugin riêng.

## Hướng dẫn sử dụng

1.  Khi triển khai NocoBase, hãy chọn hoặc điền các tham số kết nối tương ứng với MariaDB trong cấu hình kết nối cơ sở dữ liệu.
2.  Sau khi khởi động NocoBase, vào nguồn dữ liệu 「Main」 trong 「Quản lý nguồn dữ liệu」 để quản lý các bảng và trường dữ liệu trong cơ sở dữ liệu chính.
3.  Nếu cần kết nối các bảng đã tồn tại trong cơ sở dữ liệu, bạn có thể sử dụng 「Đồng bộ từ cơ sở dữ liệu」 trên trang quản lý cơ sở dữ liệu chính.
4.  Khi cấu hình các trường của bảng dữ liệu, bạn có thể tham khảo danh mục [bảng dữ liệu](../data-modeling/collection.md), [trường](../data-modeling/collection-fields/index.md) để chọn loại trường và giao diện trường.

## Ánh xạ loại trường

Trong cơ sở dữ liệu chính, khi tạo trường thông qua trang NocoBase, NocoBase sẽ tạo trường MariaDB tương ứng dựa trên cấu hình trường. Khi kết nối các bảng hiện có bằng 「Đồng bộ từ cơ sở dữ liệu」, NocoBase sẽ tự động ánh xạ sang Field type và Field interface phù hợp dựa trên loại trường MariaDB. Ánh xạ các trường phổ biến của MariaDB về cơ bản giống với MySQL; bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ phổ biến như sau:

| Loại trường MariaDB | NocoBase Field type | Field interface có thể chọn |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Lưu ý

Các loại trường MariaDB không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Những trường này cần được phát triển phần tương thích trước khi có thể sử dụng như các trường thông thường trong NocoBase.

:::

Xem thêm các cấu hình chung tại [giới thiệu về nguồn dữ liệu chính](./index.md).
