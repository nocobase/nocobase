---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Nguồn dữ liệu bên ngoài - KingbaseES"
description: "Tìm hiểu cách tích hợp KingbaseES làm cơ sở dữ liệu bên ngoài vào NocoBase, bao gồm phiên bản được hỗ trợ, chế độ tương thích PostgreSQL, cấu hình kết nối, Schema, quyền và ánh xạ trường."
keywords: "Nguồn dữ liệu bên ngoài,KingbaseES,Nhân Đại Kim Thương,cơ sở dữ liệu bên ngoài,chế độ tương thích PostgreSQL,ánh xạ trường,NocoBase"
---

# KingbaseES

## Giới thiệu

KingbaseES có thể được tích hợp vào NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi tích hợp, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong KingbaseES, đồng thời sử dụng chúng làm các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Khác với [cơ sở dữ liệu chính](../main/index.md), cấu trúc bảng thực tế của KingbaseES bên ngoài vẫn được duy trì bởi hệ thống nghiệp vụ ban đầu, ứng dụng khách cơ sở dữ liệu hoặc tập lệnh di chuyển. NocoBase chịu trách nhiệm đọc cấu trúc, lưu siêu dữ liệu trường, cấu hình khối giao diện, quyền, quy trình công việc và API.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | KingbaseES >= V9. |
| Phiên bản thương mại | Hỗ trợ phiên bản Professional và Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-kingbase`. |
| Chế độ cơ sở dữ liệu | Chỉ hỗ trợ chế độ tương thích PostgreSQL. |

Các trường hợp phù hợp để sử dụng KingbaseES bên ngoài:

- Tích hợp cơ sở dữ liệu nghiệp vụ KingbaseES hiện có trong môi trường cơ quan, doanh nghiệp, mạng nội bộ hoặc môi trường nội địa hóa
- Dùng NocoBase để xây dựng giao diện quản trị mà không cần di chuyển dữ liệu lịch sử
- Kiểm soát quyền, xử lý quy trình, chỉnh sửa dữ liệu hoặc hiển thị báo cáo cho các bảng hiện có
- Cấu trúc cơ sở dữ liệu tiếp tục do DBA, tập lệnh di chuyển hoặc hệ thống ban đầu duy trì

:::warning Lưu ý

Khi được sử dụng làm cơ sở dữ liệu bên ngoài, KingbaseES chỉ hỗ trợ chế độ tương thích PostgreSQL. Nếu cơ sở dữ liệu không ở chế độ tương thích PostgreSQL, NocoBase không thể đọc cấu trúc bảng và kiểu trường theo plugin hiện tại.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết chi tiết về cách kích hoạt, vui lòng tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn KingbaseES, sau đó điền thông tin kết nối.

![20260709210325](https://static-docs.nocobase.com/20260709210325.png)

Các cấu hình kết nối thường dùng như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên nhận diện nguồn dữ liệu, dùng để tham chiếu trong các khối giao diện, quyền, quy trình công việc và API. Không thể thay đổi sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trên giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「KingbaseES cơ quan」 hoặc 「Cơ sở dữ liệu báo cáo」. |
| Host / Port | Địa chỉ máy chủ và cổng của KingbaseES. Cổng sử dụng cấu hình thực tế của cơ sở dữ liệu. |
| Database | Tên cơ sở dữ liệu KingbaseES cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối KingbaseES. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này được phép truy cập, không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Schema | Schema cần đọc. Nếu cơ sở dữ liệu có nhiều schema, nên chỉ điền schema cần tích hợp cho nghiệp vụ hiện tại. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu và chế độ xem khớp với tiền tố này, đồng thời tạo tên bảng dữ liệu không có tiền tố trong NocoBase. |
| Collections / Add all collections | Kiểm soát phạm vi tích hợp. Khi bật 「Add all collections」, NocoBase sẽ tích hợp tất cả bảng và chế độ xem trong phạm vi hiện tại; khi tắt, chỉ tích hợp các đối tượng được chọn trong 「Collections」. |
| Enabled the data source | Có bật nguồn dữ liệu này hay không. Khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối giao diện, quyền, quy trình công việc và API sẽ không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Gợi ý

Nếu có nhiều đối tượng trong KingbaseES, trước tiên hãy thu hẹp phạm vi thông qua `Schema`, `Table prefix` và 「Collections」. Chỉ tích hợp các bảng và chế độ xem mà ứng dụng hiện tại cần sử dụng để đơn giản hóa việc cấu hình quyền, xây dựng giao diện và duy trì đồng bộ về sau.

:::

## Chọn bảng dữ liệu

Sau khi điền thông tin kết nối, bạn có thể nhấp vào 「Load Collections」 để đọc các bảng dữ liệu và chế độ xem có sẵn trong KingbaseES. Kết quả đọc sẽ chịu ảnh hưởng bởi tài khoản kết nối, `Schema`, `Table prefix` và cấu hình 「Collections」.

Theo mặc định, 「Add all collections」 được bật, nghĩa là tất cả bảng và chế độ xem trong phạm vi hiện tại sẽ được tích hợp. Nếu chỉ muốn tích hợp một phần đối tượng, hãy tắt 「Add all collections」, sau đó chọn các bảng dữ liệu hoặc chế độ xem cần thiết trong danh sách.

![20260709210603](https://static-docs.nocobase.com/20260709210603.png)

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài chỉ có thể tích hợp tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu có nhiều đối tượng trong KingbaseES, nên thu hẹp phạm vi trước thông qua `Schema`, `Table prefix` hoặc 「Collections」.

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng của KingbaseES bên ngoài được duy trì ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, sửa kiểu trường hoặc xóa trường thực tế trong KingbaseES bên ngoài.

Khi cấu trúc bảng ở phía KingbaseES thay đổi, có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Quá trình đồng bộ sẽ cập nhật các thông tin về bảng dữ liệu, trường, khóa chính, khóa duy nhất và ánh xạ kiểu trường được lưu trong NocoBase, nhưng không xóa bảng hoặc dữ liệu thực tế trong KingbaseES.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và thành phần trường (Field interface) trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và không tự động thêm trường khóa ngoại thực tế vào bảng KingbaseES.

## Ánh xạ kiểu trường

NocoBase sẽ nhận diện kiểu trường KingbaseES theo logic tương thích PostgreSQL và tự động ánh xạ sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ thường gặp như sau:

| Kiểu trường KingbaseES | NocoBase Field type | Field interface có thể chọn |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID. |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON. |

:::warning Lưu ý

Các kiểu trường KingbaseES không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Những trường này cần được phát triển phần tương thích trước khi có thể sử dụng như các trường thông thường trong NocoBase.

:::

## Khóa chính và mã nhận diện duy nhất của bản ghi

Đối với các bảng dữ liệu dùng để hiển thị và chỉnh sửa trong các khối giao diện, nên có khóa chính hoặc trường duy nhất. NocoBase sẽ ưu tiên sử dụng khóa chính làm mã nhận diện duy nhất của bản ghi.

Nếu tích hợp chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính ghép, cần thiết lập thủ công 「Record unique key」 trong cấu hình bảng dữ liệu. Khi không có mã nhận diện duy nhất khả dụng, các khối giao diện có thể không xem, chỉnh sửa hoặc xóa bản ghi chính xác.

![20260709210636](https://static-docs.nocobase.com/20260709210636.png)
![20260709210651](https://static-docs.nocobase.com/20260709210651.png)

## Các liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem cấu hình chung và hướng dẫn quản lý cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem cách truy cập và quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem hướng dẫn về kiểu trường và ánh xạ trường