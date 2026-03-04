:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/fields/specific/sub-table-popup).
:::

# Bảng con (Chỉnh sửa trong cửa sổ bật lên)

## Giới thiệu

Bảng con (Chỉnh sửa trong cửa sổ bật lên) được sử dụng để quản lý các dữ liệu liên kết nhiều (như Một-nhiều hoặc Nhiều-nhiều) ngay trong biểu mẫu. Bảng chỉ hiển thị các bản ghi đã được liên kết; việc thêm mới hoặc chỉnh sửa được thực hiện trong một cửa sổ bật lên (popup), và dữ liệu sẽ được lưu vào cơ sở dữ liệu đồng thời khi biểu mẫu chính được gửi đi.

## Hướng dẫn sử dụng

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

Tình huống áp dụng:

- Trường liên kết: o2m / m2m / mbm
- Mục đích điển hình: Chi tiết đơn hàng, danh sách mục con, liên kết nhãn/thành viên, v.v.

## Cấu hình trường

### Cho phép chọn dữ liệu có sẵn (Mặc định: Bật)

Hỗ trợ chọn liên kết từ các bản ghi đã tồn tại.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Thành phần trường

[Thành phần trường](/interface-builder/fields/association-field): Chuyển sang các thành phần trường quan hệ khác, chẳng hạn như Lựa chọn thả xuống, Bộ chọn bộ sưu tập, v.v.

### Cho phép hủy liên kết dữ liệu có sẵn (Mặc định: Bật)

> Kiểm soát việc có cho phép hủy liên kết các dữ liệu đã được liên kết trong biểu mẫu chỉnh sửa hay không. Các dữ liệu mới thêm vào luôn có thể được gỡ bỏ.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Cho phép thêm mới (Mặc định: Bật)

Kiểm soát việc hiển thị nút thêm mới. Khi người dùng không có quyền `create` (tạo) đối với bộ sưu tập đích hiện tại, nút này sẽ bị vô hiệu hóa và hiển thị thông báo không có quyền.

### Cho phép chỉnh sửa nhanh (Mặc định: Tắt)

Sau khi bật, khi di chuột vào ô dữ liệu sẽ xuất hiện biểu tượng chỉnh sửa, cho phép sửa đổi nhanh nội dung ô.

Hỗ trợ bật chỉnh sửa nhanh cho tất cả các trường trên thành phần trường quan hệ.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Cũng hỗ trợ bật chỉnh sửa nhanh cho từng trường cột riêng lẻ.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Kích thước trang (Mặc định: 10)

Thiết lập số lượng bản ghi hiển thị trên mỗi trang của bảng con.

## Mô tả hành vi

- Khi chọn các bản ghi có sẵn, hệ thống sẽ loại bỏ trùng lặp dựa trên khóa chính để tránh liên kết lặp lại cùng một bản ghi.
- Các bản ghi mới thêm sẽ được điền trực tiếp vào bảng con, mặc định sẽ chuyển đến trang chứa bản ghi mới đó.
- Chỉnh sửa nội dòng chỉ thay đổi dữ liệu của hàng hiện tại.
- Việc gỡ bỏ chỉ hủy bỏ liên kết trong biểu mẫu hiện tại, không xóa dữ liệu gốc khỏi nguồn dữ liệu.
- Dữ liệu sẽ được lưu vào cơ sở dữ liệu một cách thống nhất khi biểu mẫu chính được gửi đi.