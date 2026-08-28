---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "Nguồn dữ liệu bên ngoài - ClickHouse"
description: "Tìm hiểu cách kết nối ClickHouse với NocoBase dưới dạng cơ sở dữ liệu bên ngoài, bao gồm cổng tương thích MySQL, SSL, phạm vi bảng, các trường hợp phân tích chỉ đọc và ánh xạ trường."
keywords: "Nguồn dữ liệu bên ngoài,ClickHouse,Cơ sở dữ liệu bên ngoài,Cổng tương thích MySQL,báo cáo,ánh xạ trường,NocoBase"
---

# ClickHouse

## Giới thiệu

ClickHouse có thể được kết nối với NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong ClickHouse, đồng thời sử dụng chúng như các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

ClickHouse phù hợp hơn với các truy vấn phân tích, phân tích nhật ký, thống kê chỉ số và hiển thị báo cáo. Khác với cơ sở dữ liệu giao dịch, ClickHouse không phù hợp làm nguồn dữ liệu để thường xuyên thêm, chỉnh sửa hoặc xóa các bản ghi nghiệp vụ trong NocoBase.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | ClickHouse >= 20.2. |
| Phiên bản thương mại | Được hỗ trợ trong phiên bản Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-external-clickhouse`。 |
| Phương thức kết nối | Kết nối bằng cổng tương thích MySQL của ClickHouse. |
| Khuyến nghị sử dụng | Chủ yếu dùng để xem, lọc, thống kê và hiển thị báo cáo. |

Các trường hợp phù hợp để sử dụng ClickHouse bên ngoài:

- Kết nối dữ liệu phân tích như nhật ký, dữ liệu theo dõi sự kiện, chỉ số và quản lý rủi ro
- Tạo bảng điều khiển vận hành, báo cáo thống kê hoặc trang truy vấn trong NocoBase
- Cung cấp cho nhân viên nghiệp vụ giao diện truy vấn chỉ đọc, giảm việc truy cập trực tiếp bằng ứng dụng khách cơ sở dữ liệu
- Phân quyền và trực quan hóa dữ liệu ClickHouse hiện có

:::warning Lưu ý

Trong NocoBase, ClickHouse được khuyến nghị sử dụng như một nguồn dữ liệu phân tích chỉ đọc. Không nên sử dụng ClickHouse làm nguồn dữ liệu để ghi các bảng nghiệp vụ thông thường, đồng thời cũng không nên cấu hình các thao tác thêm, chỉnh sửa hoặc xóa trên trang.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết chi tiết về cách kích hoạt, hãy tham khảo：[Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn ClickHouse, sau đó điền thông tin kết nối.
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

Các cấu hình kết nối phổ biến như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên định danh của nguồn dữ liệu, dùng để tham chiếu trong các khối trang, quyền, workflow và API. Không thể chỉnh sửa sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trên giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「Kho nhật ký ClickHouse」「Kho chỉ số」. |
| Host / Port | Địa chỉ máy chủ ClickHouse và cổng tương thích MySQL. Không điền cổng HTTP hoặc cổng TCP gốc. |
| Database | Tên database ClickHouse cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối ClickHouse. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này được phép truy cập, không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu khớp với tiền tố này và tạo tên bảng không có tiền tố trong NocoBase. |
| Use SSL | Có bật SSL hay không. Khi kết nối với ClickHouse Cloud hoặc môi trường kết nối bảo mật, thường cần bật tùy chọn này. |
| Enabled the data source | Có bật nguồn dữ liệu này hay không. Sau khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối trang, quyền, workflow và API không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Gợi ý

Plugin ClickHouse kết nối thông qua giao thức tương thích MySQL. Trước khi cấu hình, hãy xác nhận dịch vụ ClickHouse đã bật cổng tương thích MySQL, đồng thời mạng, tường lửa và quyền tài khoản cho phép NocoBase truy cập.

:::

## Phạm vi kết nối

Trang ClickHouse không cung cấp bảng chọn 「Collections」. Phạm vi kết nối chủ yếu do `Database`, quyền của tài khoản kết nối và `Table prefix` kiểm soát.

Nếu ClickHouse có nhiều bảng, bạn nên chuẩn bị database, tài khoản hoặc tiền tố tên bảng riêng cho NocoBase, chỉ cung cấp các bảng mà ứng dụng hiện tại cần xem và thống kê.

:::warning Lưu ý

Một nguồn dữ liệu bên ngoài có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu ClickHouse có nhiều đối tượng, bạn nên thu hẹp phạm vi trước bằng database, quyền tài khoản hoặc `Table prefix`.

:::

## Đồng bộ hóa và cấu hình trường

Cấu trúc bảng ClickHouse được duy trì ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, thay đổi kiểu trường hoặc xóa trường thực trong ClickHouse bên ngoài.

Khi cấu trúc bảng ở phía ClickHouse thay đổi, bạn có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Việc đồng bộ sẽ cập nhật thông tin ánh xạ bảng dữ liệu, trường, khóa chính, khóa duy nhất và kiểu trường được lưu trong NocoBase, nhưng không xóa bảng hoặc dữ liệu thực trong ClickHouse.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và giao diện trường (Field interface) trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và sẽ không tự động tạo thêm trường khóa ngoại thực trong bảng ClickHouse.

## Ánh xạ kiểu trường

NocoBase chuyển đổi kiểu trường ClickHouse sang kiểu tương thích MySQL trước, sau đó ánh xạ sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ phổ biến như sau:

| Kiểu trường ClickHouse | NocoBase Field type | Field interface có thể chọn |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | Ánh xạ theo kiểu trường nội bộ | Phụ thuộc vào kiểu trường nội bộ. |
| `LowCardinality(...)` | Ánh xạ theo kiểu trường nội bộ | Phụ thuộc vào kiểu trường nội bộ. |

:::warning Lưu ý

Một số kiểu phân tích hoặc kiểu lồng nhau trong ClickHouse có thể không ánh xạ trực tiếp sang các trường nghiệp vụ thông thường. Khi gặp kiểu trường không được hỗ trợ, trước tiên có thể tạo chế độ xem hoặc bảng truy vấn phù hợp để hiển thị ở phía ClickHouse, sau đó kết nối với NocoBase.

:::

## Khóa chính và định danh duy nhất của bản ghi

Khóa sắp xếp và khóa phân vùng của ClickHouse không nhất thiết tương đương với định danh duy nhất của nghiệp vụ. Đối với các bảng dữ liệu dùng để hiển thị trong các khối trang, vẫn nên chuẩn bị một trường có thể xác định duy nhất bản ghi.

Nếu kết nối một bảng hoặc chế độ xem không có trường duy nhất, cần thiết lập thủ công 「Record unique key」 trong cấu hình bảng dữ liệu. Khi không có định danh duy nhất khả dụng, các khối trang có thể không xem chính xác được chi tiết bản ghi và cũng không phù hợp để cấu hình thao tác chỉnh sửa hoặc xóa.

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## Các liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem hướng dẫn cấu hình và quản lý chung đối với cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem lối vào nguồn dữ liệu và cách quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem hướng dẫn về kiểu trường và ánh xạ trường