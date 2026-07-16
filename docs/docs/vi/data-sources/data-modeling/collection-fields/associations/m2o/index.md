---
title: "Many-to-One"
description: "Field quan hệ ManyToOne (M2O), nhiều thực thể liên kết với cùng một thực thể cha, ví dụ Student-Class."
keywords: "Many-to-One,M2O,BelongsTo,Quan hệ,NocoBase"
---


# Many-to-One

Một database thư viện có hai thực thể: sách và tác giả. Một tác giả có thể viết nhiều cuốn sách, nhưng mỗi cuốn sách chỉ có một tác giả (trong hầu hết các trường hợp). Trong tình huống này, mối quan hệ giữa tác giả và sách là ManyToOne. Nhiều cuốn sách có thể liên kết với cùng một tác giả, nhưng mỗi cuốn sách chỉ có thể có một tác giả.

Quan hệ ER như sau

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Cấu hình Field

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa field hiện tại.

### Target collection

Bảng đích, liên kết với bảng nào.

### Foreign key

Field của bảng nguồn, dùng để thiết lập liên kết giữa hai bảng.

### Target key

Field được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất.

### ON DELETE

ON DELETE là quy tắc xử lý các tham chiếu khóa ngoại trong bảng con liên quan khi xóa bản ghi trong bảng cha, đây là một tùy chọn khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả các bản ghi liên quan trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên quan trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định, khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
- NO ACTION: Tương tự RESTRICT, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
