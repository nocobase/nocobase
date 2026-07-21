---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "Nguồn dữ liệu bên ngoài - Doris"
description: "Tìm hiểu cách kết nối Doris với NocoBase dưới dạng cơ sở dữ liệu bên ngoài, bao gồm cổng tương thích MySQL, FE query_port, phạm vi bảng, các kịch bản phân tích chỉ đọc và ánh xạ trường."
keywords: "Nguồn dữ liệu bên ngoài,Doris,Cơ sở dữ liệu bên ngoài,cổng tương thích MySQL,FE query_port,báo cáo,ánh xạ trường,NocoBase"
---

# Doris

## Giới thiệu

Doris có thể được kết nối với NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong Doris, đồng thời sử dụng chúng như các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Doris phù hợp hơn với các truy vấn phân tích, dữ liệu chi tiết dạng bảng rộng, thống kê chỉ số và hiển thị báo cáo. Khác với cơ sở dữ liệu giao dịch, Doris không phù hợp để làm nguồn dữ liệu cho các thao tác thường xuyên thêm, chỉnh sửa và xóa bản ghi nghiệp vụ trong NocoBase.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | Doris >= 2.1.0. |
| Phiên bản thương mại | Được hỗ trợ trong phiên bản Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-external-doris`. |
| Phương thức kết nối | Sử dụng cổng tương thích MySQL của Doris, tức FE query_port. |
| Khuyến nghị sử dụng | Chủ yếu dùng để xem, lọc, thống kê và hiển thị báo cáo. |

Các trường hợp phù hợp để sử dụng Doris bên ngoài:

- Kết nối các bảng chi tiết, bảng tổng hợp, bảng rộng hoặc bảng chỉ số trong kho dữ liệu
- Dựng bảng điều hành, báo cáo thống kê hoặc trang truy vấn trong NocoBase
- Cung cấp cho nhân viên nghiệp vụ một cổng truy vấn chỉ đọc, giảm việc truy cập trực tiếp bằng ứng dụng khách cơ sở dữ liệu
- Kiểm soát quyền và trực quan hóa dữ liệu Doris hiện có

:::warning Lưu ý

Trong NocoBase, Doris được khuyến nghị sử dụng như một nguồn dữ liệu phân tích chỉ đọc. Không nên sử dụng Doris làm nguồn dữ liệu để ghi các bảng nghiệp vụ thông thường, đồng thời cũng không khuyến nghị cấu hình các thao tác thêm, chỉnh sửa và xóa trên trang.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết cách kích hoạt chi tiết, hãy tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn Doris, sau đó điền thông tin kết nối.
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

Các cấu hình kết nối thường dùng như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên định danh của nguồn dữ liệu, dùng để tham chiếu trong các khối trang, quyền, workflow và API. Không thể chỉnh sửa sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trên giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「Kho dữ liệu Doris」「Kho chỉ số」. |
| Host / Port | Địa chỉ FE và cổng tương thích MySQL của Doris, tức `query_port`. Không điền cổng HTTP. |
| Database | Tên database Doris cần kết nối. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối Doris. NocoBase chỉ có thể đọc các đối tượng mà tài khoản này được cấp quyền truy cập, không cấp quyền hoặc đọc các đối tượng riêng tư của tài khoản khác. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu khớp với tiền tố này và tạo tên bảng không có tiền tố trong NocoBase. |
| Enabled the data source | Có bật nguồn dữ liệu này hay không. Sau khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối trang, quyền, workflow và API không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Gợi ý

Plugin Doris kết nối thông qua giao thức tương thích MySQL. Trước khi cấu hình, hãy xác nhận rằng `query_port` của Doris FE có thể được truy cập từ NocoBase và tài khoản có quyền đọc siêu dữ liệu của database, table và column mục tiêu.

:::

## Phạm vi kết nối

Trang Doris không cung cấp bảng chọn 「Collections」. Phạm vi kết nối chủ yếu do `Database`, quyền của tài khoản kết nối và `Table prefix` kiểm soát.

Nếu có nhiều bảng trong Doris, bạn nên chuẩn bị riêng database, tài khoản hoặc tiền tố tên bảng cho NocoBase, chỉ hiển thị các bảng mà ứng dụng hiện tại cần xem và thống kê.

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài chỉ có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu có nhiều đối tượng trong Doris, bạn nên thu hẹp phạm vi trước bằng database, quyền tài khoản hoặc `Table prefix`.

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng của Doris được quản lý ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, thay đổi kiểu trường hoặc xóa trường thực tế trong Doris bên ngoài.

Khi cấu trúc bảng phía Doris thay đổi, bạn có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Quá trình đồng bộ sẽ cập nhật thông tin ánh xạ bảng dữ liệu, trường, khóa chính, khóa duy nhất và kiểu trường được lưu trong NocoBase, nhưng không xóa bảng hoặc dữ liệu thực tế trong Doris.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và giao diện trường (Field interface) trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và không tự động thêm trường khóa ngoại thực tế vào bảng Doris.

## Ánh xạ kiểu trường

NocoBase sẽ ánh xạ các kiểu trường Doris sang Field type và Field interface phù hợp dựa trên logic tương thích MySQL và các kiểu đặc thù của Doris. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ thường gặp như sau:

| Kiểu trường Doris | NocoBase Field type | Field interface có thể chọn |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` là kiểu động được Apache Doris cung cấp từ phiên bản 2.1.0. Khi sử dụng Doris thấp hơn 2.1.0, không thể kết nối các trường thuộc kiểu này.

:::warning Lưu ý

Các kiểu trạng thái tổng hợp, kiểu bán cấu trúc và kiểu phức tạp trong Doris phù hợp hơn để hiển thị hoặc gỡ lỗi, không nhất thiết phù hợp để làm trường nhập liệu biểu mẫu. Khi gặp kiểu phức tạp, bạn nên chuẩn bị các chế độ xem hoặc bảng chi tiết phù hợp hơn cho việc xem nghiệp vụ ở phía Doris, sau đó kết nối với NocoBase.

:::

## Khóa chính và mã định danh duy nhất của bản ghi

Mô hình dữ liệu và mô hình khóa của Doris không nhất thiết tương đương với mã định danh duy nhất trong nghiệp vụ. Đối với các bảng dữ liệu dùng để hiển thị trong khối trang, vẫn nên chuẩn bị một trường có thể xác định duy nhất bản ghi.

Nếu kết nối một bảng hoặc chế độ xem không có trường duy nhất, cần thiết lập thủ công 「Record unique key」 trong cấu hình bảng dữ liệu. Khi không có mã định danh duy nhất khả dụng, khối trang có thể không xem chính xác chi tiết bản ghi và cũng không phù hợp để cấu hình thao tác chỉnh sửa hoặc xóa.

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## Liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem thông tin cấu hình và quản lý chung về cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem lối vào nguồn dữ liệu và cách quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem thông tin về kiểu trường và ánh xạ trường