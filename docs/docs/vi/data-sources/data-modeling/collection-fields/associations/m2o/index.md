:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Nhiều-một

Trong một cơ sở dữ liệu thư viện, có hai thực thể: sách và tác giả. Một tác giả có thể viết nhiều cuốn sách, nhưng mỗi cuốn sách thường chỉ có một tác giả. Trong trường hợp này, mối quan hệ giữa tác giả và sách là nhiều-một. Nhiều cuốn sách có thể liên kết với cùng một tác giả, nhưng mỗi cuốn sách chỉ có thể có một tác giả.

Sơ đồ ER:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Cấu hình trường:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Mô tả tham số

### Bộ sưu tập nguồn

Bộ sưu tập nguồn, là bộ sưu tập chứa trường hiện tại.

### Bộ sưu tập đích

Bộ sưu tập đích, là bộ sưu tập sẽ được liên kết.

### Khóa ngoại

Trường trong bộ sưu tập nguồn, được sử dụng để thiết lập liên kết giữa hai bộ sưu tập.

### Khóa đích

Trường trong bộ sưu tập đích mà khóa ngoại tham chiếu đến. Trường này phải là duy nhất.

### ON DELETE

ON DELETE đề cập đến các quy tắc được áp dụng cho các tham chiếu khóa ngoại trong các bộ sưu tập con liên quan khi các bản ghi trong bộ sưu tập cha bị xóa. Đây là một tùy chọn được sử dụng khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

-   **CASCADE**: Khi một bản ghi trong bộ sưu tập cha bị xóa, tất cả các bản ghi liên quan trong bộ sưu tập con sẽ tự động bị xóa.
-   **SET NULL**: Khi một bản ghi trong bộ sưu tập cha bị xóa, các giá trị khóa ngoại trong các bản ghi bộ sưu tập con liên quan sẽ được đặt thành NULL.
-   **RESTRICT**: Đây là tùy chọn mặc định, ngăn chặn việc xóa một bản ghi trong bộ sưu tập cha nếu có các bản ghi liên quan trong bộ sưu tập con.
-   **NO ACTION**: Tương tự như RESTRICT, tùy chọn này ngăn chặn việc xóa một bản ghi trong bộ sưu tập cha nếu có các bản ghi liên quan trong bộ sưu tập con.