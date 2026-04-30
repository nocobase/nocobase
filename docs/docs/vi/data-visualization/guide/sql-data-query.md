---
title: "Truy vấn dữ liệu chế độ SQL"
description: "Chế độ SQL viết câu lệnh truy vấn để lấy dữ liệu biểu đồ, hỗ trợ JOIN nhiều bảng, VIEW, biến context, ánh xạ field và preview kết quả Table/JSON."
keywords: "Truy vấn dữ liệu SQL,SQL mode,dữ liệu biểu đồ,ánh xạ field,biến context,NocoBase"
---

# Truy vấn dữ liệu chế độ SQL

Trong panel "Truy vấn dữ liệu" chuyển sang chế độ SQL, viết và chạy câu lệnh truy vấn, sử dụng trực tiếp kết quả trả về để ánh xạ và render biểu đồ.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Viết câu lệnh SQL
- Trong panel "Truy vấn dữ liệu" chọn chế độ "SQL".
- Nhập SQL, click "Chạy truy vấn" để thực thi.
- Hỗ trợ các câu lệnh SQL đầy đủ phức tạp như JOIN nhiều bảng, VIEW

Ví dụ: Thống kê số tiền đơn hàng theo tháng
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
- Click "Xem dữ liệu" để mở panel preview kết quả dữ liệu.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Dữ liệu hỗ trợ hiển thị phân trang, cũng có thể chuyển đổi giữa Table/JSON để kiểm tra tên cột và kiểu
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Ánh xạ field
- Trong cấu hình tùy chọn biểu đồ hoàn thành ánh xạ dựa trên các cột kết quả truy vấn dữ liệu.
- Mặc định sẽ tự động lấy cột đầu tiên làm dimension (trục x hoặc phân loại), cột thứ hai làm measure (trục y hoặc giá trị). Vì vậy hãy lưu ý thứ tự field trong SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- Field dimension đặt ở cột đầu tiên
  SUM(total_amount) AS total -- Field measure đặt phía sau
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Sử dụng biến context
Click nút x ở góc trên bên phải SQL editor, có thể chọn sử dụng biến context.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Sau khi chọn xác nhận, biểu thức biến sẽ được chèn vào vị trí con trỏ trong văn bản SQL (hoặc vị trí nội dung được chọn).

Ví dụ `{{ ctx.user.createdAt }}`, lưu ý không tự thêm dấu nháy.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Thêm ví dụ
Để xem thêm các ví dụ sử dụng, có thể tham khảo [ứng dụng Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) của Nocobase

**Khuyến nghị:**
- Sau khi tên cột ổn định mới tiến hành ánh xạ biểu đồ, tránh báo lỗi về sau.
- Trong giai đoạn debug đặt `LIMIT` để giảm số hàng trả về, tăng tốc preview.


## Preview, Lưu và Rollback
- Click "Chạy truy vấn" sẽ thực thi yêu cầu dữ liệu và refresh preview biểu đồ.
- Click "Lưu" sẽ lưu các cấu hình bao gồm văn bản SQL hiện tại vào database.
- Click "Hủy" để quay về trạng thái lưu lần trước, bỏ các thay đổi chưa lưu hiện tại.
