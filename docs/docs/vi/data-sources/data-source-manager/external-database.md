---
title: "External Database"
description: "Thêm External MySQL/MariaDB/PostgreSQL/MSSQL/Oracle làm Data Source, đồng bộ Collection, cấu hình Field, thiết lập field quan hệ, kết nối read-only đến database có sẵn."
keywords: "External database,MySQL,PostgreSQL,MSSQL,Oracle,Đồng bộ Collection,Field quan hệ,NocoBase"
---

# External Database

## Giới thiệu

Sử dụng database có sẵn bên ngoài làm Data Source, các External Database hiện được hỗ trợ gồm MySQL, MariaDB, PostgreSQL, MSSQL, Oracle.

## Hướng dẫn sử dụng

### Thêm External Database

Sau khi kích hoạt plugin, mới có thể chọn và thêm trong dropdown menu Add new của Data Source Manager.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Điền thông tin database cần tích hợp

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Đồng bộ Collection

Sau khi External Database thiết lập kết nối, sẽ đọc trực tiếp tất cả Collection trong Data Source. External Database không hỗ trợ thêm trực tiếp Collection hoặc sửa cấu trúc bảng, nếu cần sửa, có thể thao tác thông qua database client, sau đó nhấn nút "Refresh" trên giao diện để đồng bộ.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Cấu hình Field

External Database sẽ tự động đọc các field của Collection có sẵn và hiển thị chúng. Có thể nhanh chóng xem và cấu hình title, kiểu dữ liệu (Field type) và kiểu UI (Field interface) của field, cũng có thể nhấn nút "Edit" để sửa thêm cấu hình.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Vì External Database không hỗ trợ sửa cấu trúc bảng, nên khi thêm field mới, kiểu có thể chọn chỉ là field quan hệ. Field quan hệ không phải là field thực, mà được dùng để thiết lập kết nối giữa các bảng.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Xem thêm tại chương [Field Collection / Tổng quan](/data-sources/data-modeling/collection-fields).

### Mapping kiểu Field

NocoBase sẽ tự động map kiểu dữ liệu (Field type) và kiểu UI (Field Interface) tương ứng cho kiểu field của External Database.

- Kiểu dữ liệu (Field type): Dùng để định nghĩa loại, format và cấu trúc dữ liệu mà field có thể lưu trữ;
- Kiểu UI (Field interface): Là loại control dùng để hiển thị và nhập giá trị field trong giao diện người dùng.

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
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Kiểu Field không được hỗ trợ

Các kiểu field không được hỗ trợ sẽ được hiển thị riêng, các field này cần phát triển adapter trước khi sử dụng.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Filter target key

Collection được dùng làm hiển thị block phải được cấu hình filter target key (Filter target key), filter target key đề cập đến việc lọc dữ liệu dựa trên field cụ thể, giá trị field phải có tính duy nhất. Filter target key mặc định là field khóa chính của Collection, nếu là view hoặc Collection không có khóa chính, Collection có khóa chính kết hợp, cần tùy chỉnh filter target key.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Chỉ Collection được set filter target key mới có thể được thêm vào trang

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)
