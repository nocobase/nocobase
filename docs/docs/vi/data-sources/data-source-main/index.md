---
title: "Cơ sở dữ liệu chính"
description: "Cơ sở dữ liệu chính của NocoBase: lưu trữ dữ liệu bảng hệ thống và dữ liệu nghiệp vụ, hỗ trợ MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, đồng bộ cấu trúc bảng từ cơ sở dữ liệu, tạo bảng thông thường/bảng cây/bảng SQL, v.v."
keywords: "cơ sở dữ liệu chính,MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase,đồng bộ bảng dữ liệu"
---
# Cơ sở dữ liệu chính

## Giới thiệu

Cơ sở dữ liệu được cấu hình trong [Triển khai NocoBase](/ai/install-nocobase-app), dùng để lưu trữ dữ liệu bảng hệ thống của NocoBase, đồng thời hỗ trợ lưu trữ dữ liệu bảng nghiệp vụ của người dùng.

Các phiên bản cơ sở dữ liệu và phiên bản thương mại được cơ sở dữ liệu chính hỗ trợ như sau:

| Cơ sở dữ liệu | Phiên bản được hỗ trợ | Bản Community | Bản Standard | Bản Professional | Bản Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 10 | ✅ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.9 | ✅ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |

:::tip Lưu ý

KingbaseES chỉ hỗ trợ chế độ tương thích PostgreSQL, OceanBase chỉ hỗ trợ chế độ tương thích MySQL.

:::

## Cài đặt plugin

| Cơ sở dữ liệu | Plugin tương ứng | Cách cài đặt |
| --- | --- | --- |
| MySQL | Không có | Plugin tích hợp sẵn, không cần cài đặt riêng. |
| PostgreSQL | Không có | Plugin tích hợp sẵn, không cần cài đặt riêng. |
| MariaDB | Không có | Plugin tích hợp sẵn, không cần cài đặt riêng. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Cần giấy phép thương mại; sau khi cài đặt, plugin sẽ được bật mặc định. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Cần giấy phép thương mại; sau khi cài đặt, plugin sẽ được bật mặc định. |

## Truy cập nguồn dữ liệu chính

1. Nhấp vào menu nguồn dữ liệu trong các chức năng hệ thống để truy cập trang chủ nguồn dữ liệu.
2. Chọn nguồn dữ liệu **Main** trong danh sách nguồn dữ liệu, nhấp vào thao tác **Cấu hình** để truy cập cơ sở dữ liệu chính và quản lý.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Quản lý nguồn dữ liệu chính

Cơ sở dữ liệu chính cung cấp các chức năng quản lý bảng dữ liệu: tìm kiếm, tạo, thay đổi và xóa bảng dữ liệu; đồng thời có thể đồng bộ các trường của những bảng dữ liệu đã có trong cơ sở dữ liệu; hỗ trợ tạo, thay đổi và xóa các trường của bảng dữ liệu.
- **Lọc**: tìm kiếm các bảng dữ liệu được quản lý trong cơ sở dữ liệu chính của NocoBase
- **Tạo bảng dữ liệu**: thêm bảng dữ liệu nghiệp vụ
- **Chỉnh sửa**: thay đổi bảng dữ liệu nghiệp vụ
- **Xóa**: xóa bảng dữ liệu nghiệp vụ
- **Đồng bộ từ cơ sở dữ liệu**: đồng bộ cấu trúc của các bảng dữ liệu đã có trong cơ sở dữ liệu
- **Cấu hình trường**: tạo, thay đổi và xóa các trường của bảng dữ liệu
-  **+**: **+** trên tab dùng để quản lý phân loại bảng dữ liệu, bao gồm tạo, thay đổi và xóa danh mục
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### Đồng bộ các bảng hiện có từ cơ sở dữ liệu

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Một tính năng quan trọng của nguồn dữ liệu chính là có thể đồng bộ các bảng đã tồn tại trong cơ sở dữ liệu vào NocoBase để quản lý. Điều này có nghĩa là:

- **Bảo toàn khoản đầu tư hiện có**: nếu cơ sở dữ liệu của bạn đã có nhiều bảng nghiệp vụ, bạn không cần tạo lại mà có thể đồng bộ và sử dụng trực tiếp
- **Tích hợp linh hoạt**: có thể đưa các bảng được tạo bằng công cụ khác (chẳng hạn như tập lệnh SQL, công cụ quản lý cơ sở dữ liệu, v.v.) vào NocoBase để quản lý
- **Di chuyển từng bước**: hỗ trợ từng bước di chuyển hệ thống hiện có sang NocoBase thay vì tái cấu trúc toàn bộ trong một lần

Thông qua chức năng「Tải từ cơ sở dữ liệu」, bạn có thể:
1. Duyệt tất cả các bảng trong cơ sở dữ liệu
2. Chọn các bảng cần đồng bộ
3. Tự động nhận diện cấu trúc bảng và kiểu trường
4. Nhập vào NocoBase để quản lý chỉ với một cú nhấp chuột

### Hỗ trợ nhiều loại cấu trúc bảng

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase hỗ trợ tạo và quản lý nhiều loại bảng dữ liệu:
- **Bảng thông thường**: tích hợp sẵn các trường hệ thống thường dùng;
- **Bảng kế thừa**: có thể tạo một bảng cha, sau đó tạo các bảng con từ bảng cha đó; bảng con sẽ kế thừa cấu trúc của bảng cha và cũng có thể định nghĩa các cột riêng.
- **Bảng cây**: bảng có cấu trúc cây, hiện chỉ hỗ trợ thiết kế theo mô hình bảng liền kề;
- **Bảng lịch**: dùng để tạo các bảng sự kiện liên quan đến lịch;
- **Bảng tệp**: dùng để quản lý việc lưu trữ tệp;
- **Bảng SQL**: không phải là bảng cơ sở dữ liệu thực tế, mà dùng để nhanh chóng hiển thị có cấu trúc các truy vấn SQL;
- **Bảng chế độ xem**: kết nối với các chế độ xem cơ sở dữ liệu hiện có;

### Hỗ trợ quản lý phân loại bảng dữ liệu

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Cung cấp nhiều loại trường phong phú

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Chuyển đổi kiểu trường linh hoạt

NocoBase hỗ trợ chuyển đổi kiểu trường linh hoạt dựa trên cùng một loại cơ sở dữ liệu.

**Ví dụ: Các tùy chọn chuyển đổi của trường kiểu String**

Khi trường trong cơ sở dữ liệu có kiểu String, bạn có thể chuyển đổi thành bất kỳ dạng nào sau đây trong NocoBase:

- **Kiểu cơ bản**: văn bản một dòng, văn bản nhiều dòng, số điện thoại, email, URL, mật khẩu, màu sắc, biểu tượng
- **Kiểu lựa chọn**: menu thả xuống (chọn một), nút radio
- **Kiểu nội dung đa phương tiện**: Markdown, Markdown (Vditor), văn bản có định dạng, tệp đính kèm (URL)
- **Kiểu ngày giờ**: ngày giờ (có múi giờ), ngày giờ (không có múi giờ)
- **Kiểu nâng cao**: mã tự động, bộ chọn bảng dữ liệu, mã hóa

Cơ chế chuyển đổi linh hoạt này có nghĩa là:
- **Không cần sửa đổi cấu trúc cơ sở dữ liệu**: kiểu lưu trữ cơ bản của trường vẫn giữ nguyên, chỉ thay đổi cách biểu diễn trong NocoBase
- **Thích ứng với thay đổi nghiệp vụ**: khi nhu cầu nghiệp vụ thay đổi, có thể nhanh chóng điều chỉnh cách hiển thị và tương tác của trường
- **An toàn dữ liệu**: quá trình chuyển đổi không ảnh hưởng đến tính toàn vẹn của dữ liệu hiện có

### Đồng bộ linh hoạt ở cấp độ trường

NocoBase không chỉ có thể đồng bộ toàn bộ bảng mà còn hỗ trợ quản lý đồng bộ chi tiết ở cấp độ trường:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Đặc điểm của việc đồng bộ trường:

1. **Đồng bộ theo thời gian thực**: khi cấu trúc bảng cơ sở dữ liệu thay đổi, có thể đồng bộ các trường mới bất cứ lúc nào
2. **Đồng bộ có chọn lọc**: có thể chọn đồng bộ những trường cần thiết thay vì toàn bộ trường
3. **Tự động nhận diện kiểu**: tự động nhận diện kiểu trường trong cơ sở dữ liệu và ánh xạ sang kiểu trường của NocoBase
4. **Duy trì tính toàn vẹn dữ liệu**: quá trình đồng bộ không ảnh hưởng đến dữ liệu hiện có

#### Tình huống sử dụng:

- **Phát triển cấu trúc cơ sở dữ liệu**: khi nhu cầu nghiệp vụ thay đổi và cần thêm trường mới trong cơ sở dữ liệu, có thể nhanh chóng đồng bộ sang NocoBase
- **Cộng tác nhóm**: khi thành viên nhóm khác hoặc DBA thêm trường trong cơ sở dữ liệu, có thể đồng bộ kịp thời
- **Mô hình quản lý kết hợp**: một số trường được quản lý thông qua NocoBase, một số trường được quản lý theo phương thức truyền thống, cho phép kết hợp linh hoạt

Cơ chế đồng bộ linh hoạt này giúp NocoBase tích hợp tốt vào kiến trúc công nghệ hiện có mà không cần thay đổi phương thức quản lý cơ sở dữ liệu ban đầu, đồng thời vẫn tận dụng được sự tiện lợi của phát triển low-code do NocoBase mang lại.

Xem thêm nội dung trong chương「[Trường bảng dữ liệu / Tổng quan](../data-modeling/collection-fields/index.md)」.
