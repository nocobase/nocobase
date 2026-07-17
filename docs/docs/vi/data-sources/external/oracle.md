---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Nguồn dữ liệu bên ngoài - Oracle"
description: "Tìm hiểu cách kết nối Oracle với NocoBase dưới dạng cơ sở dữ liệu bên ngoài, bao gồm phiên bản được hỗ trợ, cài đặt plugin, chế độ kết nối Thin/Thick, Client directory, quyền và ánh xạ trường."
keywords: "Nguồn dữ liệu bên ngoài,Oracle,Cơ sở dữ liệu bên ngoài,Thin,Thick,Client directory,Ánh xạ trường,NocoBase"
---

# Oracle

## Giới thiệu

Oracle có thể được kết nối với NocoBase dưới dạng cơ sở dữ liệu bên ngoài. Sau khi kết nối, NocoBase sẽ đọc các bảng dữ liệu, trường và chế độ xem trong Oracle, đồng thời sử dụng chúng như các bảng dữ liệu trong nguồn dữ liệu bên ngoài.

Khác với [cơ sở dữ liệu chính](../main/index.md), cấu trúc bảng thực tế của Oracle bên ngoài vẫn do hệ thống nghiệp vụ gốc, ứng dụng khách cơ sở dữ liệu hoặc tập lệnh di chuyển duy trì. NocoBase chịu trách nhiệm đọc cấu trúc, lưu siêu dữ liệu trường, cấu hình khối trên trang, quyền, quy trình làm việc và API.

| Mục cấu hình | Mô tả |
| --- | --- |
| Phiên bản được hỗ trợ | Oracle >= 11g. |
| Phiên bản thương mại | Được hỗ trợ trong phiên bản Enterprise. |
| Plugin tương ứng | `@nocobase/plugin-data-source-external-oracle`。 |
| Chế độ kết nối | Oracle Database 12.1 trở lên thường sử dụng chế độ Thin; các phiên bản trước 12.1 sử dụng chế độ Thick. |

Các trường hợp phù hợp để sử dụng Oracle bên ngoài:

- Kết nối với cơ sở dữ liệu Oracle của các hệ thống nghiệp vụ hiện có như ERP, MES, WMS, CRM
- Sử dụng NocoBase để xây dựng giao diện quản trị mà không cần di chuyển dữ liệu lịch sử
- Thiết lập kiểm soát quyền, xử lý quy trình, chỉnh sửa dữ liệu hoặc hiển thị báo cáo cho các bảng hiện có
- Cấu trúc cơ sở dữ liệu tiếp tục được duy trì bởi DBA, tập lệnh di chuyển hoặc hệ thống gốc

:::warning Lưu ý

Oracle bên ngoài không phải là cơ sở dữ liệu hệ thống của NocoBase. NocoBase sẽ không tiếp quản việc sao lưu, khôi phục, di chuyển hoặc thay đổi cấu trúc bảng của cơ sở dữ liệu này.

:::

## Cài đặt plugin

Đây là plugin thương mại. Để biết cách kích hoạt chi tiết, vui lòng tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

Nếu chọn chế độ kết nối Thick, cần cài đặt Oracle Client libraries trong môi trường chạy NocoBase và điền 「Client directory」 trong cấu hình nguồn dữ liệu.

## Cài đặt Oracle Client

Oracle Database 12.1 trở lên thường sử dụng chế độ Thin và không cần cài đặt thêm Oracle Client. Chỉ khi kết nối với phiên bản Oracle Database trước 12.1 hoặc bắt buộc sử dụng chế độ Thick, bạn mới cần cài đặt Oracle Client libraries trong môi trường chạy NocoBase.

Sau khi chọn chế độ 「Thick」 trong cấu hình nguồn dữ liệu, cần xác nhận rằng máy chạy dịch vụ NocoBase có thể tải Oracle Client.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Trong môi trường Linux, bạn có thể tham khảo cách dưới đây để cài đặt Oracle Instant Client:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Nếu Oracle Client không được cài đặt tại vị trí mặc định mà hệ thống có thể tải, cần điền thư mục thư viện client vào 「Client directory」. Ví dụ, với cách cài đặt ở trên, thư mục tương ứng là `/opt/instantclient_19_25`。

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip Gợi ý

`Client directory` chỉ cần cấu hình trong chế độ Thick. Chế độ Thin không sử dụng cấu hình này. Để biết thêm quy tắc khởi tạo, bạn có thể tham khảo [tài liệu khởi tạo node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)。

:::

## Thêm nguồn dữ liệu

Trong 「Quản lý nguồn dữ liệu」, nhấp vào 「Add new」, chọn Oracle, sau đó điền thông tin kết nối.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Các cấu hình kết nối thường gặp như sau:

| Cấu hình | Mô tả |
| --- | --- |
| Data source name | Tên nhận diện nguồn dữ liệu, dùng để tham chiếu trong các khối trên trang, quyền, quy trình làm việc và API. Không thể thay đổi sau khi tạo. |
| Data source display name | Tên hiển thị của nguồn dữ liệu trên giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「ERP Oracle」「Cơ sở dữ liệu tài chính」. |
| Host / Port | Địa chỉ máy chủ và cổng Oracle. Cổng mặc định thường là `1521`。 |
| ServerName | Tên dịch vụ Oracle. Điền service name được cấu hình trong trình lắng nghe cơ sở dữ liệu. |
| Username / Password | Tài khoản và mật khẩu dùng để kết nối Oracle. NocoBase đọc các bảng dữ liệu và chế độ xem thuộc Owner của tài khoản này, không cấp quyền hoặc đọc các đối tượng thuộc Owner khác. |
| Connection mode | Chế độ kết nối Oracle. Oracle Database 12.1 trở lên thường sử dụng chế độ Thin; các phiên bản trước 12.1 sử dụng chế độ Thick. |
| Client directory | Thư mục Oracle Client libraries trong chế độ Oracle Thick. Chỉ cần cấu hình khi chọn chế độ Thick. |
| Table prefix | Tiền tố tên bảng. Sau khi cấu hình, NocoBase chỉ đọc các bảng dữ liệu và chế độ xem khớp với tiền tố này, đồng thời tạo tên bảng không có tiền tố trong NocoBase. |
| Collections / Add all collections | Kiểm soát phạm vi kết nối. Khi bật 「Add all collections」, NocoBase sẽ kết nối tất cả bảng và chế độ xem trong phạm vi Owner và tiền tố hiện tại; khi tắt, chỉ kết nối các đối tượng được chọn trong 「Collections」. |
| Enabled the data source | Cho biết có bật nguồn dữ liệu này hay không. Sau khi tắt, cấu hình nguồn dữ liệu vẫn được giữ lại, nhưng các khối trên trang, quyền, quy trình làm việc và API sẽ không thể tiếp tục đọc dữ liệu từ nguồn này. |

:::tip Gợi ý

Phạm vi kết nối trong Oracle chủ yếu do Owner của tài khoản kết nối, `Table prefix` và 「Collections」 quyết định. Nếu có nhiều đối tượng trong cùng một instance, nên sử dụng tài khoản chuyên dụng để kết nối với schema cần thiết cho nghiệp vụ, nhằm giảm số lượng đối tượng không liên quan được đưa vào NocoBase.

:::

## Lựa chọn bảng dữ liệu

Sau khi điền thông tin kết nối, bạn có thể nhấp vào 「Load Collections」 để đọc các bảng dữ liệu và chế độ xem hiện có trong Oracle. Kết quả đọc sẽ chịu ảnh hưởng của Owner tài khoản kết nối, `Table prefix` và cấu hình 「Collections」.

Theo mặc định, 「Add all collections」 được bật, nghĩa là kết nối tất cả bảng và chế độ xem trong phạm vi hiện tại. Nếu chỉ muốn kết nối một phần đối tượng, hãy tắt 「Add all collections」, sau đó chọn các bảng dữ liệu hoặc chế độ xem cần thiết trong danh sách.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Lưu ý

Mỗi nguồn dữ liệu bên ngoài chỉ có thể kết nối tối đa 500 bảng dữ liệu hoặc chế độ xem trong một lần. Nếu Oracle có nhiều đối tượng, nên thu hẹp phạm vi trước thông qua Owner tài khoản kết nối, `Table prefix` hoặc 「Collections」。

:::

## Đồng bộ và cấu hình trường

Cấu trúc bảng của Oracle bên ngoài được duy trì ở phía cơ sở dữ liệu. NocoBase sẽ không tạo trường, thay đổi kiểu trường hoặc xóa trường thực tế trong Oracle bên ngoài.

Khi cấu trúc bảng phía Oracle thay đổi, bạn có thể thực hiện 「Sync from database」 trong nguồn dữ liệu để đọc lại siêu dữ liệu của bảng và trường. Việc đồng bộ sẽ cập nhật thông tin bảng dữ liệu, trường, khóa chính, khóa duy nhất và ánh xạ kiểu trường được lưu trong NocoBase, nhưng sẽ không xóa bảng hoặc dữ liệu thực tế trong Oracle.

Sau khi đồng bộ trường, bạn có thể cấu hình tiêu đề trường, kiểu trường (Field type) và giao diện trường (Field interface) trong NocoBase. Nếu cần tạo trường quan hệ NocoBase, siêu dữ liệu quan hệ cũng được lưu trong NocoBase và không tự động thêm trường khóa ngoại thực tế vào bảng Oracle.

## Ánh xạ kiểu trường

NocoBase sẽ tự động ánh xạ kiểu trường Oracle sang Field type và Field interface phù hợp. Bạn có thể điều chỉnh cách hiển thị trên giao diện trong cấu hình trường.

Các ánh xạ thường gặp như sau:

| Kiểu trường Oracle | NocoBase Field type | Field interface có thể chọn |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group。 |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent。 |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning Lưu ý

Các kiểu đối tượng nhị phân như `BLOB`、`BFILE` sẽ không tự động được sử dụng như trường tệp thông thường. Nếu cần quản lý tệp đính kèm trên trang, thông thường nên sử dụng bảng tệp hoặc trường tệp đính kèm trong NocoBase để lưu siêu dữ liệu tệp.

:::

## Khóa chính và mã nhận diện duy nhất của bản ghi

Đối với các bảng dữ liệu dùng để hiển thị và chỉnh sửa trong các khối trên trang, nên có khóa chính hoặc trường duy nhất. NocoBase sẽ ưu tiên sử dụng khóa chính làm mã nhận diện duy nhất của bản ghi.

Nếu kết nối một chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính kết hợp, cần đặt 「Record unique key」 thủ công trong cấu hình bảng dữ liệu. Khi không có mã nhận diện duy nhất khả dụng, các khối trên trang có thể không xem, chỉnh sửa hoặc xóa bản ghi chính xác.

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## Liên kết liên quan

- [Cơ sở dữ liệu bên ngoài](./index.md) — Xem thông tin cấu hình và quản lý chung của cơ sở dữ liệu bên ngoài
- [Quản lý nguồn dữ liệu](../data-source-manager/index.md) — Xem lối vào và cách quản lý nguồn dữ liệu
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem thông tin về kiểu trường và ánh xạ trường
- [Tài liệu khởi tạo node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Xem cách tải Oracle Client libraries