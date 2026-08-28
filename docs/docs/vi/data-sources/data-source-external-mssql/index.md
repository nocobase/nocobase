---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Nguồn dữ liệu bên ngoài - MSSQL"
description: "Tìm hiểu cách kết nối MSSQL/SQL Server với NocoBase dưới dạng cơ sở dữ liệu bên ngoài, bao gồm phiên bản được hỗ trợ, cài đặt plugin, cấu hình kết nối, kết nối mã hóa, quyền và ánh xạ trường."
keywords: "nguồn dữ liệu bên ngoài,MSSQL,SQL Server,cơ sở dữ liệu bên ngoài,ánh xạ trường,NocoBase"
---

# MSSQL

## Giới thiệu

MSSQL (SQL Server) có thể được kết nối với NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong SQL Server, đồng thời sử dụng chúng làm các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Khác với [cơ sở dữ liệu chính](../data-source-main/index.md), cấu trúc bảng thực của MSSQL bên ngoài vẫn do hệ thống nghiệp vụ gốc, ứng dụng khách cơ sở dữ liệu hoặc tập lệnh di chuyển duy trì. NocoBase chịu trách nhiệm đọc cấu trúc, lưu siêu dữ liệu trường, cấu hình khối giao diện, quyền, quy trình làm việc và API.

| Hạng mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | SQL Server 2014-2019. |
| Phiên bản thương mại | Hỗ trợ các phiên bản Standard, Professional và Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-external-mssql`. |
| Tính năng kết nối | Hỗ trợ cấu hình 「Encrypt connection」 và 「Trust server certificate」. |

Các trường hợp phù hợp để sử dụng MSSQL bên ngoài:

- Kết nối cơ sở dữ liệu SQL Server của các hệ thống nghiệp vụ hiện có như ERP, MES, WMS và CRM
- Sử dụng NocoBase để xây dựng giao diện quản lý mà không cần di chuyển dữ liệu lịch sử
- Thiết lập quyền, xử lý quy trình, chỉnh sửa dữ liệu hoặc hiển thị báo cáo cho các bảng hiện có
- Cấu trúc cơ sở dữ liệu tiếp tục do DBA, tập lệnh di chuyển hoặc hệ thống gốc duy trì

:::warning Lưu ý

MSSQL bên ngoài không phải là cơ sở dữ liệu hệ thống của NocoBase. NocoBase sẽ không tiếp quản việc sao lưu, khôi phục, di chuyển hoặc thay đổi cấu trúc bảng của cơ sở dữ liệu này.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết chi tiết về cách kích hoạt, hãy tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn MSSQL, sau đó điền thông tin kết nối.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Các cấu hình kết nối thường gặp như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên định danh của nguồn dữ liệu, dùng để tham chiếu trong các khối giao diện, quyền, quy trình làm việc và API. Không thể sửa đổi sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trên giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「ERP SQL Server」 hoặc 「Cơ sở dữ liệu tài chính」. |
| Host / Port | Địa chỉ máy chủ và cổng của SQL Server. Cổng mặc định thường là `1433`. |
| Database | Tên cơ sở dữ liệu SQL Server cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối SQL Server. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này có quyền truy cập; không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu và chế độ xem khớp với tiền tố này, đồng thời tạo tên bảng không có tiền tố trong NocoBase. |
| Encrypt connection | Có bật kết nối mã hóa hay không. Hãy bật khi cơ sở dữ liệu bắt buộc mã hóa hoặc đường truyền mạng cần được mã hóa. |
| Trust server certificate | Có tin cậy chứng chỉ máy chủ hay không. Có thể cần bật trong môi trường kiểm thử hoặc môi trường sử dụng chứng chỉ tự ký; trong môi trường production, nên sử dụng chứng chỉ đáng tin cậy. |
| Collections / Add all collections | Kiểm soát phạm vi kết nối. Khi bật 「Add all collections」, NocoBase sẽ kết nối toàn bộ bảng và chế độ xem trong phạm vi hiện tại; khi tắt, chỉ kết nối các đối tượng được chọn trong 「Collections」. |
| Enabled the data source | Có bật nguồn dữ liệu này hay không. Sau khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối giao diện, quyền, quy trình làm việc và API sẽ không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Gợi ý

Nếu có nhiều đối tượng trong SQL Server, trước tiên hãy thu hẹp phạm vi thông qua `Database`, `Table prefix` và 「Collections」. Chỉ kết nối các bảng và chế độ xem được ứng dụng hiện tại sử dụng để việc cấu hình quyền, xây dựng giao diện và bảo trì đồng bộ sau này nhẹ nhàng hơn.

:::

## Chọn bảng dữ liệu

Sau khi điền thông tin kết nối, bạn có thể nhấp vào 「Load Collections」 để đọc các bảng dữ liệu và chế độ xem khả dụng trong SQL Server. Kết quả đọc sẽ bị ảnh hưởng bởi tài khoản kết nối, `Database`, `Table prefix` và cấu hình 「Collections」.

Theo mặc định, 「Add all collections」 sẽ được bật, nghĩa là kết nối toàn bộ bảng và chế độ xem trong phạm vi hiện tại. Nếu chỉ muốn kết nối một phần đối tượng, hãy tắt 「Add all collections」, sau đó chọn các bảng dữ liệu hoặc chế độ xem cần thiết trong danh sách.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài chỉ có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu có nhiều đối tượng trong SQL Server, bạn nên thu hẹp phạm vi trước thông qua `Database`, `Table prefix` hoặc 「Collections」.

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng của MSSQL bên ngoài được duy trì ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, sửa đổi kiểu trường hoặc xóa trường thực trong SQL Server bên ngoài.

Khi cấu trúc bảng ở phía SQL Server thay đổi, bạn có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Việc đồng bộ sẽ cập nhật thông tin về bảng dữ liệu, trường, khóa chính, khóa duy nhất và ánh xạ kiểu trường được lưu trong NocoBase, nhưng sẽ không xóa bảng hoặc dữ liệu thực trong SQL Server.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và giao diện trường (Field interface) trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và sẽ không tự động thêm trường khóa ngoại thực vào bảng SQL Server.

## Ánh xạ kiểu trường

NocoBase sẽ tự động ánh xạ dựa trên kiểu trường SQL Server sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ thường gặp như sau:

| Kiểu trường SQL Server | NocoBase Field type | Field interface có thể chọn |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox、Switch。 |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number、Percent、Currency。 |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number、Percent。 |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`NTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `DATETIMEOFFSET` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID、Input。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Lưu ý

Các kiểu trường SQL Server không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Cần phát triển phần tương thích trước khi có thể sử dụng các trường này như trường thông thường trong NocoBase.

:::

## Khóa chính và mã định danh duy nhất của bản ghi

Đối với các bảng dữ liệu dùng để hiển thị và chỉnh sửa trong các khối giao diện, nên có khóa chính hoặc trường duy nhất. NocoBase sẽ ưu tiên sử dụng khóa chính làm mã định danh duy nhất của bản ghi.

Nếu kết nối chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính kết hợp, cần thiết lập thủ công 「Record unique key」 trong cấu hình bảng dữ liệu. Khi không có mã định danh duy nhất khả dụng, các khối giao diện có thể không xem, chỉnh sửa hoặc xóa bản ghi chính xác.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem cấu hình chung và hướng dẫn quản lý cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem cách truy cập và quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem hướng dẫn về kiểu trường và ánh xạ trường