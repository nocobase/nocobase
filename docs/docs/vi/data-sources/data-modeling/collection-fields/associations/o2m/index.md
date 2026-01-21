:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Một-nhiều

Mối quan hệ giữa một lớp học và các học sinh của nó là một ví dụ điển hình cho quan hệ một-nhiều: một lớp học có thể có nhiều học sinh, nhưng mỗi học sinh chỉ thuộc về duy nhất một lớp học.

Sơ đồ ER:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Cấu hình trường:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Mô tả tham số

### Source collection

Bộ sưu tập nguồn. Đây là bộ sưu tập chứa trường hiện tại.

### Target collection

Bộ sưu tập đích. Đây là bộ sưu tập mà bạn muốn liên kết.

### Source key

Khóa nguồn. Đây là trường trong bộ sưu tập nguồn được khóa ngoại tham chiếu. Trường này phải là duy nhất.

### Foreign key

Khóa ngoại. Đây là trường trong bộ sưu tập đích, dùng để thiết lập liên kết giữa hai bộ sưu tập.

### Target key

Khóa đích. Đây là trường trong bộ sưu tập đích, dùng để hiển thị từng bản ghi trong khối quan hệ. Trường này thường là một trường duy nhất.

### ON DELETE

ON DELETE đề cập đến các quy tắc áp dụng cho các tham chiếu khóa ngoại trong các bộ sưu tập con liên quan khi bạn xóa bản ghi trong bộ sưu tập cha. Đây là một tùy chọn được sử dụng khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

- **CASCADE**: Khi xóa một bản ghi trong bộ sưu tập cha, hệ thống sẽ tự động xóa tất cả các bản ghi liên quan trong bộ sưu tập con.
- **SET NULL**: Khi xóa một bản ghi trong bộ sưu tập cha, các giá trị khóa ngoại liên quan trong các bản ghi của bộ sưu tập con sẽ được đặt thành NULL.
- **RESTRICT**: Tùy chọn mặc định. Nếu tồn tại các bản ghi liên quan trong bộ sưu tập con, hệ thống sẽ từ chối xóa bản ghi trong bộ sưu tập cha.
- **NO ACTION**: Tương tự như RESTRICT. Nếu tồn tại các bản ghi liên quan trong bộ sưu tập con, hệ thống sẽ từ chối xóa bản ghi trong bộ sưu tập cha.