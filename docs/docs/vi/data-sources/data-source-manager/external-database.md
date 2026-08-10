---
title: "Cơ sở dữ liệu bên ngoài"
description: "Cơ sở dữ liệu bên ngoài của NocoBase: kết nối với các cơ sở dữ liệu MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris hiện có, đọc cấu trúc bảng dữ liệu, cấu hình ánh xạ trường và trường quan hệ."
keywords: "Cơ sở dữ liệu bên ngoài,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,đồng bộ bảng dữ liệu,ánh xạ trường,NocoBase"
---

# Cơ sở dữ liệu bên ngoài

## Giới thiệu

Cơ sở dữ liệu bên ngoài được dùng để kết nối các cơ sở dữ liệu nghiệp vụ hiện có vào NocoBase, đọc các bảng dữ liệu, trường và chế độ xem trong cơ sở dữ liệu bên ngoài, để có thể sử dụng các bảng dữ liệu này trong các khối giao diện, quyền hạn, quy trình công việc và API.

Khác với [cơ sở dữ liệu chính](../data-source-main/index.md), cấu trúc bảng của cơ sở dữ liệu bên ngoài được hệ thống gốc hoặc ứng dụng khách cơ sở dữ liệu duy trì. NocoBase chỉ đọc cấu trúc bảng và chế độ xem, không sửa đổi cấu trúc bảng thực tế của cơ sở dữ liệu bên ngoài.

Các phiên bản cơ sở dữ liệu và phiên bản thương mại được cơ sở dữ liệu bên ngoài hỗ trợ như sau:

| Cơ sở dữ liệu | Phiên bản được hỗ trợ | Bản Community | Bản Standard | Bản Professional | Bản Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | >= 20.2 | ❌ | ❌ | ❌ | ✅ |
| Doris | >= 2.1.0 | ❌ | ❌ | ❌ | ✅ |

:::tip Lưu ý

KingbaseES chỉ hỗ trợ chế độ tương thích PostgreSQL; OceanBase, ClickHouse và Doris chỉ hỗ trợ chế độ tương thích MySQL.

:::

Các trường hợp sử dụng cơ sở dữ liệu bên ngoài:

- Kết nối với cơ sở dữ liệu của các hệ thống nghiệp vụ hiện có (chẳng hạn như ERP, MES, WMS cũ), tận dụng khả năng của NocoBase để nhanh chóng xây dựng giao diện quản trị, kiểm soát quyền hạn, quy trình công việc và báo cáo mà không cần thay đổi cấu trúc bảng của cơ sở dữ liệu gốc.
- Bổ sung các khả năng ứng dụng nhẹ cho hệ thống hiện có, chẳng hạn như phê duyệt, chỉnh sửa dữ liệu, xử lý ngoại lệ và bảng điều khiển vận hành, mà không cần thay thế hệ thống gốc.
- Thực hiện truy vấn chỉ đọc, phân tích thống kê hoặc hiển thị BI trên cơ sở dữ liệu hiện có, giảm sự phụ thuộc vào giao diện của hệ thống nghiệp vụ gốc.
- Di chuyển hệ thống cũ theo từng giai đoạn: trước tiên kết nối và tiếp tục sử dụng cơ sở dữ liệu cũ trong NocoBase, sau đó từng bước đưa dữ liệu nghiệp vụ mới vào cơ sở dữ liệu chính để quản lý.
- Cấu trúc cơ sở dữ liệu vẫn do DBA, tập lệnh di chuyển hoặc hệ thống nghiệp vụ gốc duy trì; NocoBase chỉ chịu trách nhiệm đọc cấu trúc, cấu hình giao diện và sử dụng dữ liệu.

:::warning Lưu ý

Cơ sở dữ liệu bên ngoài không phải là cơ sở dữ liệu hệ thống của NocoBase. NocoBase không tiếp quản việc sao lưu, khôi phục, di chuyển hoặc cấu trúc bảng của cơ sở dữ liệu bên ngoài; những công việc này vẫn cần được thực hiện trong cơ sở dữ liệu bên ngoài.

:::

## Cài đặt plugin

Cơ sở dữ liệu bên ngoài được cung cấp bởi plugin nguồn dữ liệu tương ứng. Sau khi cài đặt và kích hoạt plugin, bạn mới có thể chọn loại cơ sở dữ liệu tương ứng trong menu 「Add new」 của 「Quản lý nguồn dữ liệu」.

| Cơ sở dữ liệu | Plugin tương ứng | Cách cài đặt |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Cần có giấy phép thương mại; cài đặt và kích hoạt plugin trước khi sử dụng. |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

Nếu không có loại cơ sở dữ liệu cần thiết trong menu 「Add new」, thông thường cần xác nhận:

- Plugin tương ứng đã được cài đặt chưa
- Plugin đã được kích hoạt chưa
- Giấy phép thương mại hiện tại có bao gồm plugin này không
- Người dùng hiện tại có quyền quản lý nguồn dữ liệu không


## Hướng dẫn sử dụng

### Thêm cơ sở dữ liệu bên ngoài

Sau khi kích hoạt plugin, bạn mới có thể chọn và thêm cơ sở dữ liệu trong menu thả xuống Add new của phần quản lý nguồn dữ liệu.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Điền thông tin cơ sở dữ liệu cần kết nối

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Đồng bộ bảng dữ liệu

Sau khi thiết lập kết nối với cơ sở dữ liệu bên ngoài, hệ thống sẽ trực tiếp đọc tất cả các bảng dữ liệu trong nguồn dữ liệu. Cơ sở dữ liệu bên ngoài không hỗ trợ thêm bảng dữ liệu hoặc sửa đổi cấu trúc bảng trực tiếp. Nếu cần sửa đổi, bạn có thể thực hiện thao tác thông qua ứng dụng khách cơ sở dữ liệu, sau đó nhấp vào nút 「Làm mới」 trên giao diện để đồng bộ.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Cấu hình trường

Cơ sở dữ liệu bên ngoài sẽ tự động đọc các trường của bảng dữ liệu hiện có và hiển thị chúng. Bạn có thể nhanh chóng xem và cấu hình tiêu đề, kiểu dữ liệu (Field type) và kiểu giao diện người dùng (Field interface) của trường; cũng có thể nhấp vào nút 「Chỉnh sửa」 để sửa đổi thêm các cấu hình khác.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Vì cơ sở dữ liệu bên ngoài không hỗ trợ sửa đổi cấu trúc bảng, nên khi thêm trường, loại có thể chọn chỉ có trường quan hệ. Trường quan hệ không phải là trường thực tế mà được dùng để thiết lập kết nối giữa các bảng.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Xem thêm nội dung trong chương [Trường bảng dữ liệu / Tổng quan](../data-modeling/collection-fields/index.md).

### Ánh xạ kiểu trường

NocoBase sẽ tự động ánh xạ kiểu trường của cơ sở dữ liệu bên ngoài sang kiểu dữ liệu tương ứng (Field type) và kiểu giao diện người dùng (Field Interface).

- Kiểu dữ liệu (Field type): dùng để định nghĩa loại, định dạng và cấu trúc dữ liệu mà trường có thể lưu trữ;
- Kiểu giao diện người dùng (Field interface): là loại điều khiển được dùng để hiển thị và nhập giá trị trường trong giao diện người dùng.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Các kiểu trường không được hỗ trợ

Các kiểu trường không được hỗ trợ sẽ được hiển thị riêng. Những trường này chỉ có thể sử dụng sau khi được phát triển khả năng tương thích.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Định danh duy nhất của bản ghi

Các bảng dữ liệu được dùng để hiển thị trong khối cần có 「định danh duy nhất của bản ghi」 (Record unique key). Định danh duy nhất của bản ghi được dùng để xác định một bản ghi trong khối giao diện, thường là khóa chính hoặc trường duy nhất.

Đối với chế độ xem, bảng không có khóa chính hoặc bảng có khóa chính kết hợp, cần thiết lập thủ công 「Record unique key」 trong cấu hình bảng dữ liệu. Khi không có định danh duy nhất khả dụng, khối giao diện có thể không tạo khối, xem hoặc chỉnh sửa bản ghi chính xác. Xem thêm hướng dẫn tại [Cơ sở dữ liệu chính / Chỉnh sửa bảng dữ liệu](../main/index.md).

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)