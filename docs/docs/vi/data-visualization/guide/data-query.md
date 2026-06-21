---
title: "Truy vấn Dữ liệu"
description: "Truy vấn dữ liệu biểu đồ: chế độ Builder trực quan và chế độ SQL, cấu hình measure/dimension, lọc/sắp xếp/phân trang, lựa chọn data source và collection."
keywords: "truy vấn dữ liệu,Builder mode,measure,dimension,điều kiện lọc,data source,NocoBase"
---

# Truy vấn Dữ liệu

Panel cấu hình của biểu đồ tổng thể được chia làm ba phần: Truy vấn dữ liệu, Tùy chọn biểu đồ và Sự kiện tương tác, cùng với các nút hủy, preview, lưu ở phía dưới cùng.

Đầu tiên chúng ta hãy xem panel "Truy vấn dữ liệu" để hiểu hai chế độ truy vấn (Builder/SQL) và các tính năng thông dụng.


## Cấu trúc panel
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tips: Để cấu hình nội dung hiện tại thuận tiện hơn, có thể thu gọn các panel khác trước.


Phía trên cùng là thanh thao tác
- Chế độ: Builder (trực quan đơn giản tiện lợi) / SQL (viết câu lệnh thủ công linh hoạt hơn).
- Chạy truy vấn: Click để thực thi yêu cầu truy vấn dữ liệu.
- Xem kết quả: Mở panel kết quả dữ liệu, có thể chuyển đổi xem giữa Table/JSON. Click lại để thu gọn panel.

Từ trên xuống dưới lần lượt là:
- Data source và collection: Bắt buộc, chọn nguồn dữ liệu và bảng dữ liệu.
- Measures: Bắt buộc, các field số được hiển thị.
- Dimensions: Nhóm theo field (ngày/danh mục/khu vực, v.v.).
- Lọc: Đặt điều kiện lọc (=, ≠, >, <, chứa, phạm vi, v.v.), nhiều điều kiện có thể kết hợp.
- Sắp xếp: Chọn field sắp xếp và tăng/giảm dần.
- Phân trang: Điều khiển phạm vi dữ liệu và thứ tự trả về.


## Chế độ Builder

### Chọn data source và collection
- Trong panel "Truy vấn dữ liệu" chọn chế độ "Builder".
- Chọn data source và collection (bảng dữ liệu). Khi collection không thể chọn hoặc rỗng, hãy ưu tiên kiểm tra quyền và xem đã được tạo chưa.


### Cấu hình Measures
- Chọn một hoặc nhiều field số, đặt tổng hợp: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Tình huống thường gặp: `Count` đếm số bản ghi, `Sum` tổng số tiền.


### Cấu hình Dimensions
- Chọn một hoặc nhiều field làm dimension nhóm.
- Field ngày giờ có thể đặt định dạng (như `YYYY-MM`, `YYYY-MM-DD`) để dễ dàng nhóm theo tháng/ngày.


### Lọc, Sắp xếp và Phân trang
- Lọc: Thêm điều kiện (=, ≠, chứa, phạm vi, v.v.), nhiều điều kiện có thể kết hợp.
- Sắp xếp: Chọn field và tăng/giảm dần.
- Phân trang: Đặt `Limit` và `Offset` để điều khiển số hàng trả về, khi debug khuyến nghị đặt `Limit` nhỏ trước.


### Chạy truy vấn và xem kết quả
- Click "Chạy truy vấn" để thực thi, sau khi trả về trong "Xem dữ liệu" chuyển đổi `Table / JSON` để kiểm tra cột và giá trị.
- Trước khi ánh xạ field biểu đồ, hãy xác nhận tên cột và kiểu ở đây để tránh biểu đồ rỗng hoặc báo lỗi về sau.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Ánh xạ field tiếp theo

Tiếp theo trong cấu hình "Tùy chọn biểu đồ", thực hiện ánh xạ field dựa trên các field bảng của data source và collection đã chọn.

## Chế độ SQL

### Viết truy vấn
- Chuyển sang chế độ "SQL", nhập câu lệnh truy vấn, click "Chạy truy vấn".
- Ví dụ (Thống kê số tiền đơn hàng theo ngày):
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

- Click "Chạy truy vấn" để thực thi, sau khi trả về trong "Xem dữ liệu" chuyển đổi `Table / JSON` để kiểm tra cột và giá trị.
- Trước khi ánh xạ field biểu đồ, hãy xác nhận tên cột và kiểu ở đây để tránh biểu đồ rỗng hoặc báo lỗi về sau.

### Ánh xạ field tiếp theo

Tiếp theo trong cấu hình "Tùy chọn biểu đồ", thực hiện ánh xạ field dựa trên các cột kết quả truy vấn.


> [!TIP]
> Để biết thêm về chế độ SQL, vui lòng xem Cách sử dụng nâng cao - Truy vấn dữ liệu chế độ SQL.
