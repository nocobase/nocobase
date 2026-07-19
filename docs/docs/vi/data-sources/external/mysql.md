---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Nguồn dữ liệu bên ngoài - MySQL"
description: "Tìm hiểu cách kết nối MySQL với NocoBase dưới dạng cơ sở dữ liệu bên ngoài, bao gồm phiên bản được hỗ trợ, cài đặt plugin, cấu hình kết nối, phạm vi bảng, quyền và ánh xạ trường."
keywords: "nguồn dữ liệu bên ngoài,MySQL,cơ sở dữ liệu bên ngoài,ánh xạ trường,NocoBase"
---

# MySQL

## Giới thiệu

MySQL có thể được kết nối với NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng, trường và chế độ xem trong MySQL, đồng thời sử dụng chúng làm bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Khác với [cơ sở dữ liệu chính](../main/index.md), cấu trúc bảng thực tế của MySQL bên ngoài vẫn do hệ thống nghiệp vụ ban đầu, ứng dụng khách cơ sở dữ liệu hoặc tập lệnh di chuyển quản lý. NocoBase chịu trách nhiệm đọc cấu trúc, lưu siêu dữ liệu trường, cấu hình khối trên trang, quyền, quy trình làm việc và API.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | MySQL >= 5.7. |
| Phiên bản thương mại | Hỗ trợ các phiên bản Standard, Professional và Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-external-mysql`。 |
| Giao thức tương thích | Sử dụng giao thức MySQL để kết nối. |

Các trường hợp phù hợp để sử dụng MySQL bên ngoài:

- Kết nối với cơ sở dữ liệu MySQL của các hệ thống nghiệp vụ hiện có như ERP, MES, WMS và CRM
- Tạo giao diện quản lý bằng NocoBase mà không cần di chuyển dữ liệu lịch sử
- Thiết lập kiểm soát quyền, xử lý quy trình, điều chỉnh dữ liệu hoặc hiển thị báo cáo cho các bảng hiện có
- Cấu trúc cơ sở dữ liệu tiếp tục do DBA, tập lệnh di chuyển hoặc hệ thống ban đầu quản lý

:::warning Lưu ý

MySQL bên ngoài không phải là cơ sở dữ liệu hệ thống của NocoBase. NocoBase sẽ không tiếp quản việc sao lưu, khôi phục, di chuyển hoặc thay đổi cấu trúc bảng của cơ sở dữ liệu này.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết chi tiết về cách kích hoạt, hãy tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn MySQL, sau đó nhập thông tin kết nối.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Các cấu hình kết nối thường dùng như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên nhận diện nguồn dữ liệu, dùng để tham chiếu trong các khối trên trang, quyền, quy trình làm việc và API. Không thể thay đổi sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trong giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「ERP MySQL」 hoặc 「Cơ sở dữ liệu đơn hàng」. |
| Host / Port | Địa chỉ máy chủ và cổng MySQL. Cổng mặc định thường là `3306`。 |
| Database | Tên cơ sở dữ liệu MySQL cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối MySQL. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này được phép truy cập, không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng và chế độ xem khớp với tiền tố này, đồng thời tạo tên bảng không có tiền tố trong NocoBase. |
| Collections / Add all collections | Kiểm soát phạm vi kết nối. Khi bật 「Add all collections」, NocoBase sẽ kết nối tất cả bảng và chế độ xem trong phạm vi hiện tại; khi tắt, chỉ kết nối các đối tượng được chọn trong 「Collections」. |
| Enabled the data source | Có bật nguồn dữ liệu này hay không. Sau khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối trên trang, quyền, quy trình làm việc và API sẽ không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Mẹo

Nếu có nhiều đối tượng trong MySQL, trước tiên hãy thu hẹp phạm vi thông qua `Database`、`Table prefix` và 「Collections」. Chỉ kết nối các bảng và chế độ xem được ứng dụng hiện tại sử dụng để việc cấu hình quyền, xây dựng trang và bảo trì đồng bộ sau này trở nên nhẹ nhàng hơn.

:::

## Chọn bảng dữ liệu

Sau khi nhập thông tin kết nối, bạn có thể nhấp vào 「Load Collections」 để đọc các bảng dữ liệu và chế độ xem có sẵn trong MySQL. Kết quả đọc sẽ bị ảnh hưởng bởi tài khoản kết nối, `Database`、`Table prefix` và cấu hình 「Collections」.

Theo mặc định, 「Add all collections」 sẽ được bật, nghĩa là kết nối tất cả bảng và chế độ xem trong phạm vi hiện tại. Nếu chỉ muốn kết nối một số đối tượng, hãy tắt 「Add all collections」, sau đó chọn các bảng dữ liệu hoặc chế độ xem cần thiết trong danh sách.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài chỉ có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu có nhiều đối tượng trong MySQL, bạn nên thu hẹp phạm vi trước thông qua `Database`、`Table prefix` hoặc 「Collections」.

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng MySQL bên ngoài được quản lý ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, thay đổi kiểu trường hoặc xóa trường thực tế trong MySQL bên ngoài.

Khi cấu trúc bảng ở phía MySQL thay đổi, bạn có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Quá trình đồng bộ sẽ cập nhật thông tin về bảng dữ liệu, trường, khóa chính, khóa duy nhất và ánh xạ kiểu trường được lưu trong NocoBase, nhưng sẽ không xóa bảng hoặc dữ liệu thực tế trong MySQL.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và thành phần trường (Field interface) trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng sẽ được lưu trong NocoBase và không tự động thêm trường khóa ngoại thực tế vào bảng MySQL.

## Ánh xạ kiểu trường

NocoBase sẽ tự động ánh xạ kiểu trường MySQL sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị giao diện trong cấu hình trường.

Các ánh xạ thường gặp như sau:

| Kiểu trường MySQL | NocoBase Field type | Field interface có thể chọn |
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

Các kiểu trường MySQL không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Những trường này cần được phát triển khả năng tương thích trước khi có thể sử dụng như trường thông thường trong NocoBase.

:::

## Khóa chính và mã nhận diện duy nhất của bản ghi

Đối với các bảng dữ liệu dùng để hiển thị và chỉnh sửa trong các khối trên trang, nên có khóa chính hoặc trường duy nhất. NocoBase sẽ ưu tiên sử dụng khóa chính làm mã nhận diện duy nhất của bản ghi.

Nếu kết nối một chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính kết hợp, bạn cần thiết lập 「Record unique key」 thủ công trong cấu hình bảng dữ liệu. Khi không có mã nhận diện duy nhất khả dụng, các khối trên trang có thể không thể xem, chỉnh sửa hoặc xóa bản ghi chính xác.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem cấu hình chung và hướng dẫn quản lý cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem lối vào nguồn dữ liệu và cách quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem hướng dẫn về kiểu trường và ánh xạ trường