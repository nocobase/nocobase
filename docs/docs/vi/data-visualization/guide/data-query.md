:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Truy vấn dữ liệu

Bảng điều khiển cấu hình biểu đồ được chia thành ba phần chính: Truy vấn dữ liệu, Tùy chọn biểu đồ và Sự kiện tương tác, cùng với các nút Hủy, Xem trước và Lưu ở phía dưới.

Trước tiên, chúng ta hãy cùng tìm hiểu bảng điều khiển "Truy vấn dữ liệu" để nắm rõ hai chế độ truy vấn (Builder/SQL) và các tính năng phổ biến của chúng.

## Cấu trúc bảng điều khiển
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Mẹo: Để cấu hình nội dung hiện tại dễ dàng hơn, bạn có thể thu gọn các bảng điều khiển khác trước.

Thanh thao tác nằm ở trên cùng:
- Chế độ: Builder (giao diện đồ họa, đơn giản và tiện lợi) / SQL (viết câu lệnh thủ công, linh hoạt hơn).
- Chạy truy vấn: Nhấp để thực thi yêu cầu truy vấn dữ liệu.
- Xem kết quả: Mở bảng điều khiển kết quả dữ liệu, nơi bạn có thể chuyển đổi giữa chế độ xem Dạng bảng (Table) hoặc JSON. Nhấp lại để thu gọn bảng điều khiển.

Từ trên xuống dưới, các mục bao gồm:
- Nguồn dữ liệu và bộ sưu tập: Bắt buộc. Chọn nguồn dữ liệu và bảng dữ liệu (bộ sưu tập).
- Các phép đo (Measures): Bắt buộc. Các trường dữ liệu số sẽ được hiển thị.
- Các chiều (Dimensions): Nhóm theo các trường (ví dụ: ngày, danh mục, khu vực).
- Lọc: Đặt các điều kiện lọc (ví dụ: =, ≠, >, <, chứa, khoảng giá trị). Nhiều điều kiện có thể được kết hợp.
- Sắp xếp: Chọn trường để sắp xếp và thứ tự (tăng dần/giảm dần).
- Phân trang: Kiểm soát phạm vi dữ liệu và thứ tự trả về.

## Chế độ Builder

### Chọn nguồn dữ liệu và bộ sưu tập
- Trong bảng điều khiển "Truy vấn dữ liệu", chọn chế độ "Builder".
- Chọn một nguồn dữ liệu và bộ sưu tập (bảng dữ liệu). Nếu bộ sưu tập không thể chọn hoặc trống, hãy ưu tiên kiểm tra quyền và xem liệu nó đã được tạo hay chưa.

### Cấu hình các phép đo (Measures)
- Chọn một hoặc nhiều trường dữ liệu số và đặt phép tổng hợp: `Sum` (Tổng), `Count` (Đếm), `Avg` (Trung bình), `Max` (Giá trị lớn nhất), `Min` (Giá trị nhỏ nhất).
- Các trường hợp sử dụng phổ biến: `Count` để đếm số bản ghi, `Sum` để tính tổng.

### Cấu hình các chiều (Dimensions)
- Chọn một hoặc nhiều trường làm chiều để nhóm dữ liệu.
- Các trường ngày và giờ có thể được định dạng (ví dụ: `YYYY-MM`, `YYYY-MM-DD`) để dễ dàng nhóm theo tháng hoặc ngày.

### Lọc, Sắp xếp và Phân trang
- Lọc: Thêm các điều kiện (ví dụ: =, ≠, chứa, khoảng giá trị). Nhiều điều kiện có thể được kết hợp.
- Sắp xếp: Chọn một trường và thứ tự sắp xếp (tăng dần/giảm dần).
- Phân trang: Đặt `Limit` và `Offset` để kiểm soát số lượng hàng trả về. Khi gỡ lỗi, nên đặt `Limit` nhỏ trước.

### Chạy truy vấn và xem kết quả
- Nhấp vào "Chạy truy vấn" để thực thi. Sau khi có kết quả, chuyển đổi giữa `Table / JSON` trong "Xem kết quả" để kiểm tra các cột và giá trị.
- Trước khi ánh xạ các trường biểu đồ, hãy xác nhận tên cột và kiểu dữ liệu tại đây để tránh biểu đồ trống hoặc lỗi sau này.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Ánh xạ trường dữ liệu tiếp theo

Sau đó, khi cấu hình "Tùy chọn biểu đồ", bạn sẽ ánh xạ các trường dựa trên các trường bảng từ nguồn dữ liệu và bộ sưu tập đã chọn.

## Chế độ SQL

### Viết truy vấn
- Chuyển sang chế độ "SQL", nhập câu lệnh truy vấn của bạn và nhấp vào "Chạy truy vấn".
- Ví dụ (tổng số tiền đơn hàng theo ngày):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Chạy truy vấn và xem kết quả

- Nhấp vào "Chạy truy vấn" để thực thi. Sau khi có kết quả, chuyển đổi giữa `Table / JSON` trong "Xem kết quả" để kiểm tra các cột và giá trị.
- Trước khi ánh xạ các trường biểu đồ, hãy xác nhận tên cột và kiểu dữ liệu tại đây để tránh biểu đồ trống hoặc lỗi sau này.

### Ánh xạ trường dữ liệu tiếp theo

Sau đó, khi cấu hình "Tùy chọn biểu đồ", bạn sẽ ánh xạ các trường dựa trên các cột từ kết quả truy vấn.

> [!TIP]
> Để biết thêm thông tin về chế độ SQL, vui lòng xem Sử dụng nâng cao — Truy vấn dữ liệu ở chế độ SQL.