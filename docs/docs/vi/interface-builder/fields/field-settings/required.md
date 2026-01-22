:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Bắt buộc

## Giới thiệu
Bắt buộc là một quy tắc phổ biến trong xác thực biểu mẫu. Bạn có thể bật tính năng này trực tiếp trong cấu hình trường, hoặc thiết lập trường bắt buộc một cách linh hoạt thông qua các quy tắc liên kết của biểu mẫu.

## Nơi thiết lập trường bắt buộc

### Cấu hình trường của bộ sưu tập
Khi một trường của bộ sưu tập được thiết lập là bắt buộc, nó sẽ kích hoạt xác thực ở phía backend, và giao diện người dùng (frontend) cũng sẽ hiển thị trường đó là bắt buộc theo mặc định (không thể sửa đổi).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Cấu hình trường
Thiết lập trực tiếp một trường là bắt buộc. Điều này phù hợp với các trường mà người dùng luôn phải điền, chẳng hạn như tên người dùng, mật khẩu, v.v.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Quy tắc liên kết
Thiết lập trường bắt buộc dựa trên các điều kiện thông qua quy tắc liên kết trường của khối biểu mẫu.

Ví dụ: Số đơn hàng là bắt buộc khi ngày đặt hàng không trống.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Luồng công việc