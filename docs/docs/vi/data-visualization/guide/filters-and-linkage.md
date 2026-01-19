:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Bộ lọc trang và liên kết

Bộ lọc trang (Filter Block) cung cấp một giao diện nhập liệu thống nhất cho các điều kiện lọc ở cấp độ trang, sau đó hợp nhất chúng vào các truy vấn biểu đồ. Điều này giúp đảm bảo các biểu đồ được lọc nhất quán và liên kết với nhau.

## Tổng quan tính năng
- Thêm "khối bộ lọc" vào trang để cung cấp một điểm nhập liệu lọc thống nhất cho tất cả các biểu đồ trên trang hiện tại.
- Sử dụng các nút "Lọc", "Đặt lại" và "Thu gọn" để áp dụng, xóa và thu gọn bộ lọc.
- Nếu bộ lọc chọn các trường dữ liệu được liên kết với một biểu đồ, giá trị của chúng sẽ tự động được hợp nhất vào truy vấn biểu đồ và kích hoạt làm mới biểu đồ.
- Bộ lọc cũng có thể tạo các trường tùy chỉnh và đăng ký chúng trong các biến ngữ cảnh, cho phép tham chiếu trong các khối dữ liệu như biểu đồ, bảng, biểu mẫu, v.v.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Để biết thêm chi tiết về cách sử dụng bộ lọc trang và cách liên kết với biểu đồ hoặc các khối dữ liệu khác, vui lòng tham khảo tài liệu về Bộ lọc trang.

## Sử dụng giá trị bộ lọc trang trong truy vấn biểu đồ
- Chế độ Builder (khuyến nghị)
  - Tự động hợp nhất: Khi nguồn dữ liệu và bộ sưu tập khớp nhau, bạn không cần phải viết thêm biến trong truy vấn biểu đồ; các bộ lọc trang sẽ được hợp nhất bằng `$and`.
  - Chọn thủ công: Bạn cũng có thể chủ động chọn giá trị từ "trường tùy chỉnh" của khối bộ lọc trong các điều kiện lọc của biểu đồ.

- Chế độ SQL (thông qua chèn biến)
  - Trong câu lệnh SQL, sử dụng "Chọn biến" để chèn giá trị từ "trường tùy chỉnh" của khối bộ lọc.