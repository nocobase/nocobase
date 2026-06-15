---
title: "Many-to-Many"
description: "Field quan hệ ManyToMany (M2M), thực thể trong hai bảng liên kết nhiều-nhiều, thường cần bảng trung gian, ví dụ Student-Course."
keywords: "Many-to-Many,M2M,BelongsToMany,Bảng trung gian,Field liên kết,NocoBase"
---

# Many-to-Many

Trong hệ thống đăng ký môn học, có hai thực thể là học sinh và môn học, một học sinh có thể chọn nhiều môn học, một môn học cũng có thể được nhiều học sinh chọn, điều này tạo thành quan hệ ManyToMany. Trong relational database, để biểu diễn quan hệ ManyToMany giữa học sinh và môn học, thường sử dụng một bảng trung gian, ví dụ bảng đăng ký môn học. Bảng này có thể ghi lại học sinh nào đã chọn môn học nào, và môn học nào được học sinh nào chọn. Thiết kế như vậy có thể biểu diễn rất tốt quan hệ ManyToMany giữa học sinh và môn học.

Quan hệ ER như sau

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Cấu hình Field

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa field hiện tại.

### Target collection

Bảng đích, liên kết với bảng nào.

### Through collection

Bảng trung gian, khi giữa hai thực thể tồn tại quan hệ ManyToMany, cần sử dụng bảng trung gian để lưu trữ quan hệ này. Bảng trung gian có hai khóa ngoại, dùng để lưu trữ liên kết giữa hai thực thể.

### Source key

Field được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất.

### Foreign key 1

Field của bảng trung gian, dùng để thiết lập liên kết với bảng nguồn.

### Foreign key 2

Field của bảng trung gian, dùng để thiết lập liên kết với bảng đích.

### Target key

Field được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất.

### ON DELETE

ON DELETE là quy tắc xử lý các tham chiếu khóa ngoại trong bảng con liên quan khi xóa bản ghi trong bảng cha, đây là một tùy chọn khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả các bản ghi liên quan trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên quan trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định, khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
- NO ACTION: Tương tự RESTRICT, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
