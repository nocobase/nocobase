---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Nguồn dữ liệu bên ngoài - PostgreSQL"
description: "Tìm hiểu cách kết nối PostgreSQL làm cơ sở dữ liệu bên ngoài trong NocoBase, bao gồm phiên bản được hỗ trợ, cài đặt plugin, cấu hình kết nối, Schema, SSL, quyền và ánh xạ trường."
keywords: "Nguồn dữ liệu bên ngoài,PostgreSQL,Cơ sở dữ liệu bên ngoài,Schema,SSL,Ánh xạ trường,NocoBase"
---

# PostgreSQL

## Giới thiệu

PostgreSQL có thể được kết nối vào NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong PostgreSQL, đồng thời sử dụng chúng làm các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Khác với [cơ sở dữ liệu chính](../main/index.md), cấu trúc bảng thực của PostgreSQL bên ngoài vẫn được duy trì bởi hệ thống nghiệp vụ gốc, ứng dụng khách cơ sở dữ liệu hoặc tập lệnh di chuyển. NocoBase chịu trách nhiệm đọc cấu trúc, lưu siêu dữ liệu trường, cấu hình khối giao diện, quyền, quy trình làm việc và API.

| Hạng mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | PostgreSQL >= 9.5. |
| Phiên bản thương mại | Hỗ trợ các phiên bản Standard, Professional và Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-external-postgres`. |

Các trường hợp phù hợp để sử dụng PostgreSQL bên ngoài:

- Kết nối cơ sở dữ liệu PostgreSQL của các hệ thống nghiệp vụ hiện có như ERP, MES, WMS, CRM
- Tạo giao diện quản trị bằng NocoBase mà không cần di chuyển dữ liệu lịch sử
- Thiết lập quyền, xử lý quy trình, hiệu chỉnh dữ liệu hoặc hiển thị báo cáo cho các bảng hiện có
- Cấu trúc cơ sở dữ liệu tiếp tục được DBA, tập lệnh di chuyển hoặc hệ thống gốc duy trì

:::warning Lưu ý

PostgreSQL bên ngoài không phải là cơ sở dữ liệu hệ thống của NocoBase. NocoBase sẽ không tiếp quản việc sao lưu, khôi phục, di chuyển hoặc thay đổi cấu trúc bảng của cơ sở dữ liệu này.

:::

## Cài đặt plugin

Đây là plugin thương mại, vui lòng tham khảo [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide) để biết cách kích hoạt chi tiết.

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn PostgreSQL, sau đó điền thông tin kết nối.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Các cấu hình kết nối thường dùng như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên định danh của nguồn dữ liệu, dùng để tham chiếu trong các khối giao diện, quyền, quy trình làm việc và API. Không thể thay đổi sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trên giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「ERP PostgreSQL」 hoặc 「Kho dữ liệu báo cáo」. |
| Host / Port | Địa chỉ máy chủ và cổng PostgreSQL. Cổng mặc định thường là `5432`. |
| Database | Tên cơ sở dữ liệu PostgreSQL cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối PostgreSQL. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này có quyền truy cập, không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Schema | Schema PostgreSQL cần đọc, chẳng hạn như `public`. Nếu cơ sở dữ liệu có nhiều schema, nên chỉ điền schema cần thiết cho nghiệp vụ hiện tại. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu và chế độ xem khớp với tiền tố này, đồng thời tạo tên bảng dữ liệu không có tiền tố trong NocoBase. |
| Collections / Add all collections | Kiểm soát phạm vi kết nối. Khi bật 「Add all collections」, NocoBase sẽ kết nối toàn bộ bảng và chế độ xem trong phạm vi hiện tại; khi tắt, chỉ kết nối các đối tượng được chọn trong 「Collections」. |
| Enabled the data source | Có bật nguồn dữ liệu này hay không. Sau khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối giao diện, quyền, quy trình làm việc và API sẽ không thể tiếp tục đọc dữ liệu từ nguồn này. |
| SSL options | Cấu hình kết nối SSL của PostgreSQL. Có thể thiết lập SSL mode, có từ chối chứng chỉ chưa được ủy quyền hay không, cũng như đường dẫn đến chứng chỉ CA, chứng chỉ máy khách và khóa máy khách. |

:::tip Gợi ý

Nếu có nhiều đối tượng trong PostgreSQL, trước tiên hãy thu hẹp phạm vi thông qua `Schema`, `Table prefix` và 「Collections」. Chỉ kết nối các bảng và chế độ xem mà ứng dụng hiện tại sử dụng để đơn giản hóa việc cấu hình quyền, xây dựng giao diện và duy trì đồng bộ về sau.

:::

## Chọn bảng dữ liệu

Sau khi điền thông tin kết nối, bạn có thể nhấp vào 「Load Collections」 để đọc các bảng dữ liệu và chế độ xem có sẵn trong PostgreSQL. Kết quả đọc sẽ chịu ảnh hưởng bởi tài khoản kết nối, `Schema`, `Table prefix` và cấu hình 「Collections」.

Theo mặc định, 「Add all collections」 được bật, nghĩa là kết nối toàn bộ bảng và chế độ xem trong phạm vi hiện tại. Nếu chỉ muốn kết nối một phần đối tượng, hãy tắt 「Add all collections」, sau đó chọn các bảng dữ liệu hoặc chế độ xem cần thiết trong danh sách.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài chỉ có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu có nhiều đối tượng trong PostgreSQL, nên thu hẹp phạm vi trước thông qua `Schema`, `Table prefix` hoặc 「Collections」.

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng của PostgreSQL bên ngoài được duy trì ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, thay đổi kiểu trường hoặc xóa trường thực trong PostgreSQL bên ngoài.

Khi cấu trúc bảng ở phía PostgreSQL thay đổi, bạn có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Việc đồng bộ sẽ cập nhật thông tin về bảng dữ liệu, trường, khóa chính, khóa duy nhất và ánh xạ kiểu trường được lưu trong NocoBase, nhưng không xóa bảng hoặc dữ liệu thực trong PostgreSQL.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và giao diện trường (Field interface) trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và sẽ không tự động thêm trường khóa ngoại thực vào bảng PostgreSQL.

## Ánh xạ kiểu trường

NocoBase sẽ tự động ánh xạ kiểu trường PostgreSQL sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ thường gặp như sau:

| Kiểu trường PostgreSQL | NocoBase Field type | Field interface có thể chọn |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`、`json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Lưu ý

Các kiểu trường PostgreSQL không được hỗ trợ sẽ được hiển thị riêng trong cấu hình trường. Cần phát triển phần tương thích trước khi có thể sử dụng các trường này như trường thông thường trong NocoBase.

:::

## Khóa chính và định danh duy nhất của bản ghi

Các bảng dữ liệu dùng để hiển thị và chỉnh sửa trong khối giao diện nên có khóa chính hoặc trường duy nhất. NocoBase sẽ ưu tiên sử dụng khóa chính làm định danh duy nhất của bản ghi.

Nếu kết nối một chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính kết hợp, cần thiết lập thủ công 「Record unique key」 trong cấu hình bảng dữ liệu. Khi không có định danh duy nhất khả dụng, khối giao diện có thể không xem, chỉnh sửa hoặc xóa bản ghi chính xác.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Các liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem thông tin cấu hình và quản lý chung của cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem lối vào nguồn dữ liệu và cách quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem thông tin về kiểu trường và ánh xạ trường