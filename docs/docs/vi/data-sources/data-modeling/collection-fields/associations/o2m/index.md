---
title: "Một-nhiều"
description: "Trường quan hệ một-nhiều (O2M), trong đó một thực thể liên kết với nhiều thực thể con, chẳng hạn như tác giả-bài viết."
keywords: "Một-nhiều,O2M,HasMany,liên kết,NocoBase"
---

# Một-nhiều

Mối quan hệ giữa lớp học và học sinh: một lớp học có thể có nhiều học sinh, nhưng một học sinh chỉ có thể thuộc về một lớp học. Trong trường hợp này, giữa lớp học và học sinh là quan hệ một-nhiều.

Mối quan hệ ER như sau

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Cấu hình trường

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa trường hiện tại.

### Target collection

Bảng đích, là bảng được liên kết.

### Source key

Trường được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất.

### Foreign key

Trường của bảng đích, dùng để thiết lập mối liên kết giữa hai bảng.

### Target key

Trường của bảng đích, dùng để hiển thị bản ghi của từng hàng trong khối quan hệ, thường là trường có tính duy nhất.

### ON DELETE

ON DELETE là quy tắc thao tác đối với các tham chiếu khóa ngoại trong bảng con liên quan khi xóa bản ghi trong bảng cha, đây là một tùy chọn được sử dụng khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE thường gặp gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả bản ghi liên quan trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên quan trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định; khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại bản ghi liên quan trong bảng con thì từ chối xóa bản ghi trong bảng cha.
- NO ACTION: Tương tự RESTRICT; nếu tồn tại bản ghi liên quan trong bảng con thì từ chối xóa bản ghi trong bảng cha.