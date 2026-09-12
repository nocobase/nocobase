---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Nguồn dữ liệu bên ngoài - OceanBase"
description: "Tìm hiểu cách kết nối OceanBase với NocoBase dưới dạng cơ sở dữ liệu bên ngoài, bao gồm phiên bản được hỗ trợ, chế độ tương thích MySQL, cấu hình kết nối, phạm vi bảng, quyền và ánh xạ trường."
keywords: "Nguồn dữ liệu bên ngoài,OceanBase,Cơ sở dữ liệu bên ngoài,chế độ tương thích MySQL,ánh xạ trường,NocoBase"
---

# OceanBase

## Giới thiệu

OceanBase có thể được kết nối với NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong OceanBase, đồng thời sử dụng chúng làm các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Khác với [cơ sở dữ liệu chính](../main/index.md), cấu trúc bảng thực tế của OceanBase bên ngoài vẫn do hệ thống nghiệp vụ ban đầu, ứng dụng khách cơ sở dữ liệu hoặc tập lệnh di chuyển quản lý. NocoBase chịu trách nhiệm đọc cấu trúc, lưu siêu dữ liệu trường, cấu hình khối giao diện, quyền, quy trình làm việc và API.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | OceanBase >= 4.3. |
| Phiên bản thương mại | Hỗ trợ phiên bản Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-oceanbase`. |
| Chế độ cơ sở dữ liệu | Chỉ hỗ trợ chế độ tương thích MySQL. |

Các trường hợp phù hợp để sử dụng OceanBase bên ngoài:

- Kết nối cơ sở dữ liệu nghiệp vụ trong tenant OceanBase tương thích MySQL hiện có
- Tạo giao diện quản trị bằng NocoBase mà không cần di chuyển dữ liệu lịch sử
- Thiết lập quyền, xử lý quy trình, chỉnh sửa dữ liệu hoặc hiển thị báo cáo cho các bảng hiện có
- Cấu trúc cơ sở dữ liệu tiếp tục do DBA, tập lệnh di chuyển hoặc hệ thống ban đầu quản lý

:::warning Lưu ý

Khi sử dụng OceanBase làm cơ sở dữ liệu bên ngoài, chỉ hỗ trợ chế độ tương thích MySQL. Nếu sử dụng chế độ tương thích Oracle, NocoBase không thể đọc cấu trúc bảng và kiểu trường theo plugin hiện tại.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết chi tiết về cách kích hoạt, vui lòng tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn dữ liệu

Trong「Quản lý nguồn dữ liệu」, nhấp vào「Add new」, chọn OceanBase, sau đó điền thông tin kết nối.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Cấu hình kết nối thường dùng:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên định danh của nguồn dữ liệu, dùng để tham chiếu trong các khối giao diện, quyền, quy trình làm việc và API. Không thể thay đổi sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trong giao diện. Nên sử dụng tên dễ hiểu đối với nhân viên nghiệp vụ, chẳng hạn như「Cơ sở dữ liệu nghiệp vụ OceanBase」「Cơ sở dữ liệu báo cáo」. |
| Host / Port | Địa chỉ và cổng kết nối OceanBase tương thích MySQL. Cổng thực tế phụ thuộc vào cấu hình của tenant hoặc proxy. |
| Database | Tên cơ sở dữ liệu OceanBase cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối OceanBase. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này có quyền truy cập, không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu và chế độ xem khớp với tiền tố này, đồng thời tạo tên bảng không có tiền tố trong NocoBase. |
| Collections / Add all collections | Kiểm soát phạm vi kết nối. Khi bật「Add all collections」, NocoBase sẽ kết nối tất cả bảng và chế độ xem trong phạm vi hiện tại; khi tắt, chỉ kết nối các đối tượng được chọn trong「Collections」. |
| Enabled the data source | Có bật nguồn dữ liệu này hay không. Khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối giao diện, quyền, quy trình làm việc và API không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Mẹo

Nếu có nhiều đối tượng trong OceanBase, hãy ưu tiên thu hẹp phạm vi bằng `Database`, `Table prefix` và「Collections」. Chỉ kết nối các bảng và chế độ xem mà ứng dụng hiện tại cần sử dụng để việc cấu hình quyền, xây dựng giao diện và bảo trì đồng bộ sau này trở nên nhẹ nhàng hơn.

:::

## Chọn bảng dữ liệu

Sau khi điền thông tin kết nối, bạn có thể nhấp vào「Load Collections」để đọc các bảng dữ liệu và chế độ xem có sẵn trong OceanBase. Kết quả đọc sẽ chịu ảnh hưởng bởi tài khoản kết nối, `Database`, `Table prefix` và cấu hình「Collections」.

Theo mặc định,「Add all collections」được bật, nghĩa là kết nối tất cả bảng và chế độ xem trong phạm vi hiện tại. Nếu chỉ muốn kết nối một phần đối tượng, hãy tắt「Add all collections」, sau đó chọn các bảng dữ liệu hoặc chế độ xem cần thiết trong danh sách.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu có nhiều đối tượng trong OceanBase, bạn nên thu hẹp phạm vi trước bằng `Database`, `Table prefix` hoặc「Collections」.

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng của OceanBase bên ngoài được quản lý ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, thay đổi kiểu trường hoặc xóa trường thực tế trong OceanBase bên ngoài.

Khi cấu trúc bảng ở phía OceanBase thay đổi, bạn có thể thực hiện「Sync from database」trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Quá trình đồng bộ sẽ cập nhật thông tin về bảng dữ liệu, trường, khóa chính, khóa duy nhất và ánh xạ kiểu trường được lưu trong NocoBase, nhưng không xóa các bảng hoặc dữ liệu thực tế trong OceanBase.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường（Field type）và giao diện trường（Field interface）trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và không tự động thêm trường khóa ngoại thực tế vào bảng OceanBase.

## Ánh xạ kiểu trường

NocoBase nhận diện kiểu trường OceanBase theo logic tương thích MySQL và tự động ánh xạ sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị giao diện trong cấu hình trường.

Các ánh xạ thường gặp:

| Kiểu trường OceanBase | NocoBase Field type | Field interface có thể chọn |
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

Các kiểu trường OceanBase không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Những trường này cần được phát triển phần tương thích trước khi có thể sử dụng như trường thông thường trong NocoBase.

:::

## Khóa chính và định danh duy nhất của bản ghi

Đối với các bảng dữ liệu dùng để hiển thị và chỉnh sửa trong các khối giao diện, nên có khóa chính hoặc trường duy nhất. NocoBase sẽ ưu tiên sử dụng khóa chính làm định danh duy nhất của bản ghi.

Nếu kết nối một chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính kết hợp, bạn cần thiết lập thủ công「Record unique key」trong cấu hình bảng dữ liệu. Khi không có định danh duy nhất khả dụng, các khối giao diện có thể không xem, chỉnh sửa hoặc xóa bản ghi chính xác.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

## Liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem hướng dẫn chung về cấu hình và quản lý cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem cách truy cập và quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem hướng dẫn về kiểu trường và ánh xạ trường