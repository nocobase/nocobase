:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cơ sở dữ liệu ngoài

## Giới thiệu
Sử dụng cơ sở dữ liệu ngoài hiện có làm **nguồn dữ liệu**. Hiện tại, NocoBase hỗ trợ các cơ sở dữ liệu ngoài như MySQL, MariaDB, PostgreSQL, MSSQL và Oracle.

## Hướng dẫn sử dụng

### Thêm cơ sở dữ liệu ngoài
Sau khi kích hoạt **plugin**, bạn có thể chọn và thêm cơ sở dữ liệu ngoài từ menu thả xuống "Add new" trong phần quản lý **nguồn dữ liệu**.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Điền thông tin của cơ sở dữ liệu bạn muốn kết nối.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Đồng bộ **bộ sưu tập**
Sau khi kết nối với cơ sở dữ liệu ngoài, NocoBase sẽ đọc trực tiếp tất cả các **bộ sưu tập** trong **nguồn dữ liệu**. Cơ sở dữ liệu ngoài không hỗ trợ thêm **bộ sưu tập** hoặc sửa đổi cấu trúc bảng trực tiếp. Nếu cần sửa đổi, bạn có thể thực hiện thông qua một ứng dụng khách (client) cơ sở dữ liệu, sau đó nhấp vào nút "Làm mới" trên giao diện để đồng bộ hóa.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Cấu hình trường
Cơ sở dữ liệu ngoài sẽ tự động đọc và hiển thị các trường của các **bộ sưu tập** hiện có. Bạn có thể nhanh chóng xem và cấu hình tiêu đề, kiểu dữ liệu (Field type) và kiểu giao diện người dùng (UI type) của trường. Bạn cũng có thể nhấp vào nút "Chỉnh sửa" để sửa đổi thêm các cấu hình khác.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Vì cơ sở dữ liệu ngoài không hỗ trợ sửa đổi cấu trúc bảng, nên khi thêm trường mới, kiểu duy nhất có sẵn là trường liên kết (association field). Trường liên kết không phải là trường thực tế mà được sử dụng để thiết lập kết nối giữa các **bộ sưu tập**.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Để biết thêm chi tiết, hãy xem chương [Trường **bộ sưu tập**/Tổng quan](/data-sources/data-modeling/collection-fields).

### Ánh xạ kiểu trường
NocoBase sẽ tự động ánh xạ các kiểu trường từ cơ sở dữ liệu ngoài sang kiểu dữ liệu (Field type) và kiểu giao diện người dùng (UI type) tương ứng.
- Kiểu dữ liệu (Field type): Dùng để định nghĩa loại, định dạng và cấu trúc dữ liệu mà một trường có thể lưu trữ.
- Kiểu giao diện người dùng (UI type): Là loại điều khiển được sử dụng trong giao diện người dùng để hiển thị và nhập giá trị trường.

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
| CIRCLE |  | circle | json<br/>circle |
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

### Các kiểu trường không được hỗ trợ
Các kiểu trường không được hỗ trợ sẽ được hiển thị riêng. Các trường này cần được phát triển để tương thích trước khi có thể sử dụng.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Khóa mục tiêu lọc
Các **bộ sưu tập** được hiển thị dưới dạng khối phải được cấu hình Khóa mục tiêu lọc (Filter target key). Khóa mục tiêu lọc dùng để lọc dữ liệu dựa trên một trường cụ thể, và giá trị của trường đó phải là duy nhất. Theo mặc định, khóa mục tiêu lọc là trường khóa chính của **bộ sưu tập**. Đối với các chế độ xem (views), các **bộ sưu tập** không có khóa chính hoặc các **bộ sưu tập** có khóa chính tổng hợp, bạn cần định nghĩa khóa mục tiêu lọc tùy chỉnh.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Chỉ những **bộ sưu tập** đã cấu hình khóa mục tiêu lọc mới có thể được thêm vào trang.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)