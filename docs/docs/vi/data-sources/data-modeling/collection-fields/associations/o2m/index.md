---
title: "One-to-Many"
description: "Field quan hệ OneToMany (O2M), một thực thể liên kết với nhiều thực thể con, ví dụ Author-Article."
keywords: "One-to-Many,O2M,HasMany,Quan hệ,NocoBase"
---

# One-to-Many

Mối quan hệ giữa lớp học và học sinh, một lớp học có thể có nhiều học sinh, nhưng một học sinh chỉ thuộc về một lớp học. Trong tình huống này, mối quan hệ giữa lớp học và học sinh là OneToMany.

Quan hệ ER như sau

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Cấu hình Field

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa field hiện tại.

### Target collection

Bảng đích, liên kết với bảng nào.

### Source key

Field được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất.

### Foreign key

Field của bảng đích, dùng để thiết lập liên kết giữa hai bảng.

### Target key

Field của bảng đích, dùng để xem mỗi dòng bản ghi trong block quan hệ, thường là field có tính duy nhất.

### ON DELETE

ON DELETE là quy tắc xử lý các tham chiếu khóa ngoại trong bảng con liên quan khi xóa bản ghi trong bảng cha, đây là một tùy chọn khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả các bản ghi liên quan trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên quan trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định, khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
- NO ACTION: Tương tự RESTRICT, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
