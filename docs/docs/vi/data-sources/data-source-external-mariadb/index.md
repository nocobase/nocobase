---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Nguồn dữ liệu bên ngoài - MariaDB"
description: "Tìm hiểu cách kết nối MariaDB với NocoBase dưới dạng cơ sở dữ liệu bên ngoài, bao gồm phiên bản được hỗ trợ, cài đặt plugin, cấu hình kết nối, phạm vi bảng, quyền và ánh xạ trường."
keywords: "nguồn dữ liệu bên ngoài,MariaDB,cơ sở dữ liệu bên ngoài,ánh xạ trường,NocoBase"
---

# MariaDB

## Giới thiệu

MariaDB có thể được kết nối với NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong MariaDB, đồng thời sử dụng chúng như các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Khác với [cơ sở dữ liệu chính](../data-source-main/index.md), cấu trúc bảng thực tế của MariaDB bên ngoài vẫn do hệ thống nghiệp vụ gốc, ứng dụng khách cơ sở dữ liệu hoặc tập lệnh di chuyển quản lý. NocoBase chịu trách nhiệm đọc cấu trúc, lưu siêu dữ liệu trường, cấu hình khối giao diện, quyền, quy trình làm việc và API.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | MariaDB >= 10.3. |
| Phiên bản thương mại | Hỗ trợ phiên bản Standard, Professional và Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-external-mariadb`. |
| Giao thức tương thích | Sử dụng giao thức MySQL để kết nối; việc ánh xạ trường nhìn chung kế thừa logic tương thích với MySQL. |

Các trường hợp phù hợp để sử dụng MariaDB bên ngoài:

- Kết nối với cơ sở dữ liệu MariaDB của các hệ thống nghiệp vụ hiện có như ERP, MES, WMS, CRM
- Xây dựng giao diện quản trị bằng NocoBase mà không cần di chuyển dữ liệu lịch sử
- Thiết lập quyền, xử lý quy trình, chỉnh sửa dữ liệu hoặc hiển thị báo cáo cho các bảng hiện có
- Cấu trúc cơ sở dữ liệu tiếp tục do DBA, tập lệnh di chuyển hoặc hệ thống gốc quản lý

:::warning Lưu ý

MariaDB bên ngoài không phải là cơ sở dữ liệu hệ thống của NocoBase. NocoBase sẽ không tiếp quản việc sao lưu, khôi phục, di chuyển hoặc thay đổi cấu trúc bảng của cơ sở dữ liệu này.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết chi tiết về cách kích hoạt, vui lòng tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn MariaDB, sau đó điền thông tin kết nối.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

Các cấu hình kết nối thường dùng như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên định danh của nguồn dữ liệu, dùng để tham chiếu trong các khối giao diện, quyền, quy trình làm việc và API. Không thể thay đổi sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trong giao diện. Nên sử dụng tên mà người dùng nghiệp vụ dễ hiểu, chẳng hạn như 「ERP MariaDB」 hoặc 「Cơ sở dữ liệu đơn hàng」. |
| Host / Port | Địa chỉ máy chủ và cổng của MariaDB. Cổng mặc định thường là `3306`. |
| Database | Tên cơ sở dữ liệu MariaDB cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối với MariaDB. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này được phép truy cập, không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu và chế độ xem khớp với tiền tố này, đồng thời tạo tên bảng dữ liệu không có tiền tố trong NocoBase. |
| Collections / Add all collections | Kiểm soát phạm vi kết nối. Khi bật 「Add all collections」, NocoBase sẽ kết nối tất cả bảng và chế độ xem trong phạm vi hiện tại; khi tắt, chỉ kết nối các đối tượng được chọn trong 「Collections」. |
| Enabled the data source | Xác định có bật nguồn dữ liệu này hay không. Sau khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối giao diện, quyền, quy trình làm việc và API sẽ không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Mẹo

Nếu có nhiều đối tượng trong MariaDB, trước tiên hãy thu hẹp phạm vi bằng `Database`, `Table prefix` và 「Collections」. Chỉ kết nối các bảng và chế độ xem mà ứng dụng hiện tại sử dụng; việc cấu hình quyền, xây dựng giao diện và đồng bộ, bảo trì sau này sẽ nhẹ nhàng hơn.

:::

## Chọn bảng dữ liệu

Sau khi điền thông tin kết nối, bạn có thể nhấp vào 「Load Collections」 để đọc các bảng dữ liệu và chế độ xem hiện có trong MariaDB. Kết quả đọc sẽ bị ảnh hưởng bởi tài khoản kết nối, `Database`, `Table prefix` và cấu hình 「Collections」.

Theo mặc định, 「Add all collections」 được bật, nghĩa là kết nối tất cả bảng và chế độ xem trong phạm vi hiện tại. Nếu chỉ muốn kết nối một số đối tượng, hãy tắt 「Add all collections」, sau đó chọn các bảng dữ liệu hoặc chế độ xem cần thiết trong danh sách.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài chỉ có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu có nhiều đối tượng trong MariaDB, bạn nên thu hẹp phạm vi trước bằng `Database`, `Table prefix` hoặc 「Collections」.

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng của MariaDB bên ngoài được quản lý ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, thay đổi kiểu trường hoặc xóa trường thực tế trong MariaDB bên ngoài.

Khi cấu trúc bảng ở phía MariaDB thay đổi, bạn có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Quá trình đồng bộ sẽ cập nhật thông tin về bảng dữ liệu, trường, khóa chính, khóa duy nhất và ánh xạ kiểu trường được lưu trong NocoBase, nhưng sẽ không xóa bảng hoặc dữ liệu thực tế trong MariaDB.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và giao diện trường (Field interface) trong NocoBase. Nếu cần thiết lập trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và sẽ không tự động thêm trường khóa ngoại thực tế vào bảng MariaDB.

## Ánh xạ kiểu trường

NocoBase sẽ tự động ánh xạ kiểu trường MariaDB sang Field type và Field interface phù hợp. Việc ánh xạ các kiểu trường phổ biến của MariaDB nhìn chung tương tự MySQL; bạn có thể điều chỉnh cách hiển thị giao diện trong cấu hình trường.

Các ánh xạ phổ biến như sau:

| Kiểu trường MariaDB | NocoBase Field type | Field interface có thể chọn |
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

Các kiểu trường MariaDB không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Cần phát triển phần tương thích cho các trường này trước khi có thể sử dụng chúng như các trường thông thường trong NocoBase.

:::

## Khóa chính và mã định danh duy nhất của bản ghi

Đối với các bảng dữ liệu dùng để hiển thị và chỉnh sửa trong các khối giao diện, nên có khóa chính hoặc trường duy nhất. NocoBase sẽ ưu tiên sử dụng khóa chính làm mã định danh duy nhất của bản ghi.

Nếu kết nối với chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính ghép, cần thiết lập thủ công 「Record unique key」 trong cấu hình bảng dữ liệu. Khi không có mã định danh duy nhất khả dụng, các khối giao diện có thể không xem, chỉnh sửa hoặc xóa bản ghi chính xác.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem hướng dẫn chung về cấu hình và quản lý cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem cách truy cập và quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem hướng dẫn về kiểu trường và ánh xạ trường