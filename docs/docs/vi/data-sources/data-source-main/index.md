---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Cơ sở dữ liệu chính

## Giới thiệu

Cơ sở dữ liệu chính của NocoBase có thể dùng để lưu trữ dữ liệu nghiệp vụ lẫn siêu dữ liệu của ứng dụng, bao gồm dữ liệu bảng hệ thống, dữ liệu bảng tùy chỉnh, v.v. Cơ sở dữ liệu chính hỗ trợ các cơ sở dữ liệu quan hệ như MySQL, PostgreSQL, v.v. Khi cài đặt ứng dụng NocoBase, cơ sở dữ liệu chính phải được cài đặt đồng thời và không thể xóa.

## Cài đặt

Plugin này được tích hợp sẵn, không cần cài đặt riêng.

## Quản lý bộ sưu tập

Nguồn dữ liệu chính cung cấp đầy đủ chức năng quản lý bộ sưu tập, cho phép bạn tạo bảng mới thông qua NocoBase và đồng bộ hóa cấu trúc bảng hiện có từ cơ sở dữ liệu.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Đồng bộ hóa các bảng hiện có từ cơ sở dữ liệu

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Một tính năng quan trọng của nguồn dữ liệu chính là khả năng đồng bộ hóa các bảng đã tồn tại trong cơ sở dữ liệu vào NocoBase để quản lý. Điều này có nghĩa là:

- **Bảo vệ khoản đầu tư hiện có**: Nếu cơ sở dữ liệu của bạn đã có nhiều bảng nghiệp vụ, bạn không cần tạo lại chúng – bạn có thể đồng bộ hóa và sử dụng trực tiếp.
- **Tích hợp linh hoạt**: Các bảng được tạo thông qua các công cụ khác (như script SQL, công cụ quản lý cơ sở dữ liệu, v.v.) có thể được đưa vào quản lý bởi NocoBase.
- **Di chuyển dần dần**: Hỗ trợ di chuyển dần dần các hệ thống hiện có sang NocoBase, thay vì tái cấu trúc toàn bộ cùng một lúc.

Thông qua tính năng "Tải từ cơ sở dữ liệu", bạn có thể:
1. Duyệt qua tất cả các bảng trong cơ sở dữ liệu
2. Chọn các bảng bạn cần đồng bộ hóa
3. Tự động nhận diện cấu trúc bảng và loại trường
4. Nhập chúng vào NocoBase để quản lý chỉ với một cú nhấp chuột.

### Hỗ trợ nhiều loại bộ sưu tập

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase hỗ trợ tạo và quản lý nhiều loại bộ sưu tập:
- **Bộ sưu tập chung**: tích hợp sẵn các trường hệ thống thường dùng;
- **Bộ sưu tập kế thừa**: cho phép tạo một bảng cha từ đó các bảng con có thể được dẫn xuất. Các bảng con sẽ kế thừa cấu trúc của bảng cha và có thể định nghĩa các cột riêng của chúng.
- **Bộ sưu tập dạng cây**: bảng có cấu trúc cây, hiện chỉ hỗ trợ thiết kế danh sách kề;
- **Bộ sưu tập lịch**: dùng để tạo các bảng sự kiện liên quan đến lịch;
- **Bộ sưu tập tệp**: dùng để quản lý lưu trữ tệp;
- **Bộ sưu tập biểu thức**: dùng cho các kịch bản biểu thức động trong luồng công việc;
- **Bộ sưu tập SQL**: không phải là một bảng cơ sở dữ liệu thực tế, mà là cách nhanh chóng để trình bày các truy vấn SQL một cách có cấu trúc;
- **Bộ sưu tập dạng View**: kết nối với các view cơ sở dữ liệu hiện có;
- **Bộ sưu tập bên ngoài**: cho phép hệ thống cơ sở dữ liệu truy cập và truy vấn trực tiếp dữ liệu trong các nguồn dữ liệu bên ngoài, dựa trên công nghệ FDW;

### Hỗ trợ quản lý phân loại bộ sưu tập

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Các loại trường phong phú

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/2025-10-29-19-48-51.png)

#### Chuyển đổi loại trường linh hoạt

NocoBase hỗ trợ chuyển đổi loại trường linh hoạt dựa trên cùng một loại cơ sở dữ liệu.

**Ví dụ: Các tùy chọn chuyển đổi cho trường kiểu String**

Khi một trường trong cơ sở dữ liệu có kiểu String, nó có thể được chuyển đổi thành bất kỳ dạng nào sau đây trong NocoBase:

- **Kiểu cơ bản**: Văn bản một dòng, Văn bản nhiều dòng, Số điện thoại, Email, URL, Mật khẩu, Màu sắc, Biểu tượng
- **Kiểu lựa chọn**: Menu thả xuống (chọn một), Nhóm radio
- **Kiểu đa phương tiện**: Markdown, Markdown (Vditor), Văn bản đa dạng thức, Tệp đính kèm (URL)
- **Kiểu Ngày & Giờ**: Ngày giờ (có múi giờ), Ngày giờ (không múi giờ)
- **Kiểu nâng cao**: Tự động mã hóa, Bộ chọn bộ sưu tập, Mã hóa

Cơ chế chuyển đổi linh hoạt này có nghĩa là:
- **Không yêu cầu sửa đổi cấu trúc cơ sở dữ liệu**: Loại lưu trữ cơ bản của trường vẫn không thay đổi; chỉ có cách biểu diễn của nó trong NocoBase thay đổi.
- **Thích ứng với thay đổi nghiệp vụ**: Khi nhu cầu nghiệp vụ phát triển, bạn có thể nhanh chóng điều chỉnh cách hiển thị và tương tác của trường.
- **An toàn dữ liệu**: Quá trình chuyển đổi không ảnh hưởng đến tính toàn vẹn của dữ liệu hiện có.

### Đồng bộ hóa linh hoạt cấp độ trường

NocoBase không chỉ có thể đồng bộ hóa toàn bộ bảng mà còn hỗ trợ quản lý đồng bộ hóa chi tiết ở cấp độ trường:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Các tính năng đồng bộ hóa trường:

1. **Đồng bộ hóa thời gian thực**: Khi cấu trúc bảng cơ sở dữ liệu thay đổi, các trường mới được thêm vào có thể được đồng bộ hóa bất cứ lúc nào.
2. **Đồng bộ hóa có chọn lọc**: Bạn có thể chọn đồng bộ hóa các trường cần thiết, thay vì tất cả các trường.
3. **Tự động nhận diện loại**: Tự động nhận diện loại trường cơ sở dữ liệu và ánh xạ chúng tới các loại trường của NocoBase.
4. **Duy trì tính toàn vẹn dữ liệu**: Quá trình đồng bộ hóa không ảnh hưởng đến dữ liệu hiện có.

#### Các trường hợp sử dụng:

- **Phát triển lược đồ cơ sở dữ liệu**: Khi nhu cầu nghiệp vụ thay đổi và cần thêm các trường mới vào cơ sở dữ liệu, chúng có thể được đồng bộ hóa nhanh chóng vào NocoBase.
- **Cộng tác nhóm**: Khi các thành viên nhóm khác hoặc DBA thêm trường vào cơ sở dữ liệu, chúng có thể được đồng bộ hóa kịp thời.
- **Chế độ quản lý kết hợp**: Một số trường được quản lý thông qua NocoBase, các trường khác thông qua các phương pháp truyền thống – kết hợp linh hoạt.

Cơ chế đồng bộ hóa linh hoạt này cho phép NocoBase tích hợp tốt vào các kiến trúc kỹ thuật hiện có, không yêu cầu thay đổi các phương pháp quản lý cơ sở dữ liệu hiện tại, đồng thời vẫn tận hưởng sự tiện lợi của phát triển low-code mà NocoBase mang lại.

Xem thêm trong phần 「[Trường bộ sưu tập / Tổng quan](/data-sources/data-modeling/collection-fields)」.