---
title: "Biến Context"
description: "Tái sử dụng các biến context như ctx.user, ctx.page, giá trị filter trong truy vấn dữ liệu, cấu hình biểu đồ và sự kiện tương tác để render biểu đồ và liên kết theo context."
keywords: "biến context,ctx.user,ctx.page,biến filter,{{biến}},trực quan hóa dữ liệu,NocoBase"
---

# Sử dụng biến môi trường Context

Thông qua biến môi trường context, bạn có thể trực tiếp tái sử dụng các thông tin như trang/người dùng/thời gian/điều kiện lọc hiện tại để render biểu đồ và liên kết theo context.

## Phạm vi áp dụng
- Điều kiện lọc của chế độ Builder trong truy vấn dữ liệu, chọn biến để sử dụng.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Viết câu lệnh trong chế độ SQL của truy vấn dữ liệu, chọn biến để chèn biểu thức (ví dụ `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Chế độ Custom của tùy chọn biểu đồ trực tiếp viết biểu thức JS.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Sự kiện tương tác (ví dụ click drill-down mở popup truyền dữ liệu), trực tiếp viết biểu thức JS.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Lưu ý:**
- Không thêm dấu nháy đơn/đôi cho `{{ ... }}`; khi binding hệ thống sẽ xử lý an toàn dựa trên loại biến (chuỗi, số, thời gian, NULL).
- Khi biến là `NULL` hoặc chưa định nghĩa, vui lòng sử dụng `COALESCE(...)` hoặc `IS NULL` trong SQL để xử lý logic giá trị rỗng một cách rõ ràng.
