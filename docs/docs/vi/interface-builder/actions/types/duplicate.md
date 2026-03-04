---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/actions/types/duplicate).
:::

# Sao chép

## Giới thiệu

Thao tác sao chép cho phép người dùng nhanh chóng tạo các bản ghi mới dựa trên dữ liệu hiện có. Hỗ trợ hai chế độ sao chép: **Sao chép trực tiếp** và **Sao chép vào biểu mẫu và tiếp tục điền**.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt riêng.

## Chế độ sao chép

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Sao chép trực tiếp

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Mặc định được thực hiện theo phương thức "Sao chép trực tiếp";
- **Trường mẫu**: Chỉ định các trường cần sao chép, có thể chọn tất cả, là mục bắt buộc.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Sau khi hoàn tất cấu hình, nhấp vào nút để sao chép dữ liệu.

### Sao chép vào biểu mẫu và tiếp tục điền

Các trường mẫu đã cấu hình sẽ được điền vào biểu mẫu dưới dạng **giá trị mặc định**, người dùng có thể sửa đổi dựa trên các giá trị trường mẫu trước khi gửi để hoàn tất việc sao chép.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Cấu hình trường mẫu**: Chỉ những trường được chọn mới được mang theo và sử dụng làm giá trị mặc định.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Đồng bộ hóa trường biểu mẫu

- Tự động phân tích các trường đã cấu hình trong khối biểu mẫu hiện tại để làm trường mẫu;
- Nếu sau đó các trường trong khối biểu mẫu bị thay đổi (ví dụ: điều chỉnh thành phần trường quan hệ), bạn cần mở lại cấu hình mẫu và nhấp vào **Đồng bộ hóa trường biểu mẫu** để đảm bảo tính nhất quán.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Dữ liệu mẫu sẽ được điền dưới dạng giá trị mặc định của biểu mẫu, người dùng có thể sửa đổi và gửi để hoàn tất việc sao chép.


### Ghi chú bổ sung

#### Sao chép, Tham chiếu, Tải trước

Các loại trường khác nhau (loại quan hệ) có logic xử lý khác nhau: **Sao chép / Tham chiếu / Tải trước**. **Thành phần trường** của trường quan hệ cũng ảnh hưởng đến logic xử lý:

- Select / Record picker: Dùng cho **Tham chiếu**
- Sub-form / Sub-table: Dùng cho **Sao chép**

**Sao chép**

- Các trường thông thường là sao chép;
- `hasOne` / `hasMany` chỉ có thể là sao chép (loại quan hệ này không nên sử dụng các thành phần trường chọn như chọn thả xuống, chọn bản ghi; nên sử dụng các thành phần trường như biểu mẫu con, bảng con);
- Việc thay đổi thành phần của `hasOne` / `hasMany` **sẽ không** thay đổi logic xử lý (vẫn là sao chép);
- Đối với các trường quan hệ được sao chép, tất cả các trường con đều có thể được chọn.

**Tham chiếu**

- `belongsTo` / `belongsToMany` là tham chiếu;
- Nếu điều chỉnh thành phần trường từ "Chọn thả xuống" thành "Biểu mẫu con", quan hệ sẽ chuyển từ **Tham chiếu sang Sao chép** (sau khi chuyển sang sao chép, tất cả các trường con đều có thể chọn).

**Tải trước**

- Các trường quan hệ dưới một trường tham chiếu là tải trước;
- Các trường tải trước có thể trở thành tham chiếu hoặc sao chép sau khi thay đổi thành phần.

#### Chọn tất cả

- Sẽ chọn tất cả các **trường sao chép** và **trường tham chiếu**.

#### Các bản ghi được chọn làm mẫu dữ liệu sẽ lọc bỏ các trường sau:

- Khóa chính của dữ liệu quan hệ được sao chép sẽ bị lọc; khóa chính của tham chiếu và tải trước sẽ không bị lọc;
- Khóa ngoại;
- Các trường không cho phép trùng lặp (Unique);
- Trường sắp xếp;
- Trường mã tự động (Sequence);
- Mật khẩu;
- Người tạo, Ngày tạo;
- Người cập nhật cuối cùng, Ngày cập nhật cuối cùng.

#### Đồng bộ hóa trường biểu mẫu

- Tự động phân tích các trường đã cấu hình trong khối biểu mẫu hiện tại thành các trường mẫu;
- Sau khi sửa đổi các trường trong khối biểu mẫu (như điều chỉnh thành phần trường quan hệ), cần đồng bộ hóa lại để đảm bảo tính nhất quán.