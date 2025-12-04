:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Truy vấn dữ liệu ở chế độ SQL

Trong bảng điều khiển Truy vấn dữ liệu, chuyển sang chế độ SQL, viết và chạy truy vấn, sau đó sử dụng trực tiếp kết quả trả về để ánh xạ và hiển thị biểu đồ.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Viết câu lệnh SQL
- Trong bảng điều khiển Truy vấn dữ liệu, chọn chế độ SQL.
- Nhập câu lệnh SQL và nhấp vào "Chạy truy vấn".
- Hỗ trợ các câu lệnh SQL phức tạp bao gồm JOIN nhiều bảng, VIEW, v.v.

Ví dụ: Thống kê tổng tiền đơn hàng theo tháng
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Xem kết quả
- Nhấp vào "Xem dữ liệu" để mở bảng điều khiển xem trước kết quả dữ liệu.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Dữ liệu hỗ trợ phân trang; bạn có thể chuyển đổi giữa chế độ Bảng (Table) và JSON để kiểm tra tên và kiểu cột.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Ánh xạ trường dữ liệu
- Trong cấu hình "Tùy chọn biểu đồ", thực hiện ánh xạ các trường dữ liệu dựa trên các cột kết quả truy vấn.
- Theo mặc định, cột đầu tiên sẽ được sử dụng làm chiều (trục X hoặc danh mục), và cột thứ hai làm độ đo (trục Y hoặc giá trị). Vì vậy, hãy chú ý đến thứ tự các trường trong câu lệnh SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- trường chiều ở cột đầu tiên
  SUM(total_amount) AS total -- trường độ đo ở các cột sau
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Sử dụng biến ngữ cảnh
Nhấp vào nút `x` ở góc trên bên phải của trình chỉnh sửa SQL để chọn sử dụng các biến ngữ cảnh.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Sau khi xác nhận, biểu thức biến sẽ được chèn vào vị trí con trỏ (hoặc thay thế nội dung được chọn) trong văn bản SQL.

Ví dụ: `{{ ctx.user.createdAt }}`. Lưu ý không tự thêm dấu ngoặc kép.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Các ví dụ khác
Để xem thêm các ví dụ sử dụng, bạn có thể tham khảo [ứng dụng Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) của NocoBase.

**Khuyến nghị:**
- Ổn định tên cột trước khi ánh xạ vào biểu đồ để tránh lỗi sau này.
- Trong giai đoạn gỡ lỗi, hãy đặt `LIMIT` để giảm số lượng hàng trả về và tăng tốc độ xem trước.

## Xem trước, lưu và hoàn tác
- Nhấp vào "Chạy truy vấn" để thực hiện yêu cầu dữ liệu và làm mới bản xem trước biểu đồ.
- Nhấp vào "Lưu" để lưu văn bản SQL hiện tại và các cấu hình liên quan vào cơ sở dữ liệu.
- Nhấp vào "Hủy" để quay lại trạng thái đã lưu gần nhất và loại bỏ các thay đổi chưa lưu hiện tại.