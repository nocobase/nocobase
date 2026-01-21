:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Nhiều-Nhiều

Trong một hệ thống đăng ký khóa học, có hai thực thể: sinh viên và khóa học. Một sinh viên có thể đăng ký nhiều khóa học, và một khóa học cũng có thể có nhiều sinh viên đăng ký. Điều này tạo thành một mối quan hệ nhiều-nhiều. Trong cơ sở dữ liệu quan hệ, để biểu diễn mối quan hệ nhiều-nhiều giữa sinh viên và khóa học, người ta thường sử dụng một `bộ sưu tập` trung gian, ví dụ như `bộ sưu tập` đăng ký khóa học. `Bộ sưu tập` này có thể ghi lại những khóa học mà mỗi sinh viên đã chọn và những sinh viên đã đăng ký mỗi khóa học. Thiết kế này giúp biểu diễn mối quan hệ nhiều-nhiều giữa sinh viên và khóa học một cách hiệu quả.

Sơ đồ ER:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Cấu hình trường:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Mô tả tham số

### `Source collection` (`bộ sưu tập` nguồn)
`Bộ sưu tập` nguồn là `bộ sưu tập` chứa trường hiện tại.

### `Target collection` (`bộ sưu tập` đích)
`Bộ sưu tập` đích là `bộ sưu tập` mà bạn muốn liên kết.

### `Through collection` (`bộ sưu tập` trung gian)
`Bộ sưu tập` trung gian được sử dụng khi có mối quan hệ nhiều-nhiều giữa hai thực thể. `Bộ sưu tập` trung gian này có hai khóa ngoại dùng để duy trì mối liên kết giữa hai thực thể.

### `Source key` (khóa nguồn)
Trường trong `bộ sưu tập` nguồn được khóa ngoại tham chiếu. Trường này phải là duy nhất.

### `Foreign key 1` (khóa ngoại 1)
Trường trong `bộ sưu tập` trung gian, dùng để thiết lập liên kết với `bộ sưu tập` nguồn.

### `Foreign key 2` (khóa ngoại 2)
Trường trong `bộ sưu tập` trung gian, dùng để thiết lập liên kết với `bộ sưu tập` đích.

### `Target key` (khóa đích)
Trường trong `bộ sưu tập` đích được khóa ngoại tham chiếu. Trường này phải là duy nhất.

### `ON DELETE`
`ON DELETE` đề cập đến các quy tắc được áp dụng cho các tham chiếu khóa ngoại trong các `bộ sưu tập` con liên quan khi các bản ghi trong `bộ sưu tập` cha bị xóa. Đây là một tùy chọn được sử dụng khi định nghĩa một ràng buộc khóa ngoại. Các tùy chọn `ON DELETE` phổ biến bao gồm:

- **CASCADE**: Khi một bản ghi trong `bộ sưu tập` cha bị xóa, tất cả các bản ghi liên quan trong `bộ sưu tập` con cũng sẽ tự động bị xóa.
- **SET NULL**: Khi một bản ghi trong `bộ sưu tập` cha bị xóa, các giá trị khóa ngoại trong các bản ghi liên quan của `bộ sưu tập` con sẽ được đặt thành `NULL`.
- **RESTRICT**: Đây là tùy chọn mặc định. Nó ngăn chặn việc xóa một bản ghi trong `bộ sưu tập` cha nếu có các bản ghi liên quan trong `bộ sưu tập` con.
- **NO ACTION**: Tương tự như `RESTRICT`, tùy chọn này ngăn chặn việc xóa một bản ghi trong `bộ sưu tập` cha nếu có các bản ghi liên quan trong `bộ sưu tập` con.