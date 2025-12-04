---
pkg: "@nocobase/plugin-client"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Trình quản lý định tuyến

## Giới thiệu

Trình quản lý định tuyến là một công cụ dùng để quản lý các định tuyến của trang chính hệ thống, hỗ trợ cả thiết bị `máy tính để bàn` và `di động`. Các định tuyến được tạo bằng trình quản lý định tuyến sẽ tự động hiển thị trong menu (có thể cấu hình để không hiển thị trong menu). Ngược lại, các mục menu được thêm vào từ menu trang cũng sẽ được đồng bộ hóa vào danh sách của trình quản lý định tuyến.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Hướng dẫn sử dụng

### Các loại định tuyến

Hệ thống hỗ trợ bốn loại định tuyến:

- Nhóm (`group`): Dùng để quản lý các định tuyến bằng cách nhóm chúng lại, và có thể chứa các định tuyến con.
- Trang (`page`): Là một trang nội bộ của hệ thống.
- Tab (`tab`): Loại định tuyến dùng để chuyển đổi giữa các tab bên trong một trang.
- Liên kết (`link`): Là một liên kết nội bộ hoặc bên ngoài, có thể chuyển hướng trực tiếp đến địa chỉ liên kết đã cấu hình.

### Thêm định tuyến

Nhấp vào nút “Add new” ở góc trên bên phải để tạo một định tuyến mới:

1. Chọn loại định tuyến (`Type`)
2. Điền tiêu đề định tuyến (`Title`)
3. Chọn biểu tượng định tuyến (`Icon`)
4. Cấu hình xem có hiển thị trong menu hay không (`Show in menu`)
5. Cấu hình xem có bật các tab trang hay không (`Enable page tabs`)
6. Đối với loại trang, hệ thống sẽ tự động tạo một đường dẫn định tuyến (`Path`) duy nhất.

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Thao tác định tuyến

Mỗi mục định tuyến hỗ trợ các thao tác sau:

- Add child: Thêm định tuyến con
- Edit: Chỉnh sửa cấu hình định tuyến
- View: Xem trang định tuyến
- Delete: Xóa định tuyến

### Thao tác hàng loạt

Thanh công cụ phía trên cung cấp các chức năng thao tác hàng loạt sau:

- Refresh: Làm mới danh sách định tuyến
- Delete: Xóa các định tuyến đã chọn
- Hide in menu: Ẩn các định tuyến đã chọn khỏi menu
- Show in menu: Hiển thị các định tuyến đã chọn trong menu

### Lọc định tuyến

Sử dụng chức năng “Filter” ở phía trên để lọc danh sách định tuyến theo nhu cầu.

:::info{title=Lưu ý}
Việc sửa đổi cấu hình định tuyến sẽ ảnh hưởng trực tiếp đến cấu trúc menu điều hướng của hệ thống. Vui lòng thao tác cẩn thận và đảm bảo tính chính xác của các cấu hình định tuyến.
:::