:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Sử dụng biến ngữ cảnh

Với biến ngữ cảnh, bạn có thể sử dụng lại thông tin từ trang hiện tại, người dùng, thời gian, điều kiện lọc, v.v., để hiển thị biểu đồ và liên kết dữ liệu theo ngữ cảnh.

## Phạm vi áp dụng
- Truy vấn dữ liệu ở chế độ Builder: chọn biến để sử dụng cho các điều kiện lọc.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Truy vấn dữ liệu ở chế độ SQL: khi viết câu lệnh, chọn biến và chèn biểu thức (ví dụ: `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Tùy chọn biểu đồ ở chế độ Custom: viết trực tiếp các biểu thức JS.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Sự kiện tương tác (ví dụ: nhấp để mở hộp thoại chi tiết và truyền dữ liệu): viết trực tiếp các biểu thức JS.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Lưu ý:**
- Không đặt `{{ ... }}` trong dấu nháy đơn hoặc kép; khi liên kết, hệ thống sẽ xử lý an toàn dựa trên kiểu dữ liệu của biến (chuỗi, số, thời gian, NULL).
- Khi biến là `NULL` hoặc chưa được định nghĩa, vui lòng xử lý rõ ràng logic giá trị null trong SQL bằng cách sử dụng `COALESCE(...)` hoặc `IS NULL`.