:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cập nhật dữ liệu

Dùng để cập nhật dữ liệu trong một bộ sưu tập thỏa mãn các điều kiện đã chỉ định.

Phần cấu hình bộ sưu tập và gán giá trị trường của nút này tương tự như nút "Tạo bản ghi". Điểm khác biệt chính của nút "Cập nhật dữ liệu" là có thêm điều kiện lọc và bạn cần chọn chế độ cập nhật. Ngoài ra, kết quả của nút "Cập nhật dữ liệu" sẽ trả về số lượng hàng dữ liệu đã được cập nhật thành công. Kết quả này chỉ có thể xem trong lịch sử thực thi và không thể dùng làm biến trong các nút tiếp theo.

## Tạo nút

Trong giao diện cấu hình luồng công việc, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Cập nhật dữ liệu":

![Thêm nút Cập nhật dữ liệu](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Cấu hình nút

![Cấu hình nút Cập nhật dữ liệu](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Bộ sưu tập

Chọn bộ sưu tập mà bạn muốn cập nhật dữ liệu.

### Chế độ cập nhật

Có hai chế độ cập nhật:

*   **Cập nhật hàng loạt**: Không kích hoạt các sự kiện của bộ sưu tập cho từng bản ghi được cập nhật. Chế độ này mang lại hiệu suất tốt hơn và phù hợp cho các thao tác cập nhật dữ liệu lớn.
*   **Cập nhật từng bản ghi**: Kích hoạt các sự kiện của bộ sưu tập cho từng bản ghi được cập nhật. Tuy nhiên, chế độ này có thể gây ra vấn đề về hiệu suất khi xử lý lượng dữ liệu lớn và cần được sử dụng cẩn thận.

Việc lựa chọn thường phụ thuộc vào dữ liệu mục tiêu cần cập nhật và liệu có cần kích hoạt các sự kiện luồng công việc khác hay không. Nếu bạn cập nhật một bản ghi duy nhất dựa trên khóa chính, nên sử dụng chế độ "Cập nhật từng bản ghi". Nếu bạn cập nhật nhiều bản ghi dựa trên các điều kiện, nên sử dụng chế độ "Cập nhật hàng loạt".

### Điều kiện lọc

Tương tự như các điều kiện lọc trong truy vấn bộ sưu tập thông thường, bạn có thể sử dụng các biến ngữ cảnh từ luồng công việc.

### Giá trị trường

Tương tự như việc gán giá trị trường trong nút "Tạo bản ghi", bạn có thể sử dụng các biến ngữ cảnh từ luồng công việc hoặc nhập thủ công các giá trị tĩnh.

Lưu ý: Dữ liệu được cập nhật bởi nút "Cập nhật dữ liệu" trong một luồng công việc sẽ không tự động xử lý dữ liệu "Người sửa đổi cuối cùng". Bạn cần tự cấu hình giá trị của trường này tùy theo nhu cầu.

## Ví dụ

Ví dụ, khi một "Bài viết" mới được tạo, bạn cần tự động cập nhật trường "Số lượng bài viết" trong bộ sưu tập "Danh mục bài viết". Bạn có thể thực hiện điều này bằng cách sử dụng nút "Cập nhật dữ liệu":

![Cấu hình ví dụ nút Cập nhật dữ liệu](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Sau khi luồng công việc được kích hoạt, trường "Số lượng bài viết" của bộ sưu tập "Danh mục bài viết" sẽ tự động được cập nhật thành số lượng bài viết hiện tại + 1.