---
title: "Nhiều-một"
description: "Trường quan hệ nhiều-một (M2O), nhiều thực thể liên kết với cùng một thực thể cha, chẳng hạn như học sinh-lớp học."
keywords: "Nhiều-một,M2O,BelongsTo,liên kết,NocoBase"
---


# Nhiều-một

Một cơ sở dữ liệu thư viện có hai thực thể: sách và tác giả. Một tác giả có thể viết nhiều cuốn sách, nhưng mỗi cuốn sách chỉ có một tác giả (trong đa số trường hợp). Trong trường hợp này, tác giả và sách có quan hệ nhiều-một. Nhiều cuốn sách có thể liên kết với cùng một tác giả, nhưng mỗi cuốn sách chỉ có một tác giả.

Quan hệ ER như sau

![văn bản thay thế](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Cấu hình trường

![văn bản thay thế](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa trường hiện tại.

### Target collection

Bảng đích, là bảng được liên kết.

### Foreign key

Trường của bảng nguồn, được dùng để thiết lập mối liên kết giữa hai bảng.

### Target key

Trường được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất.

### ON DELETE

ON DELETE là quy tắc thao tác đối với các tham chiếu khóa ngoại trong bảng con khi bản ghi trong bảng cha bị xóa. Đây là một tùy chọn được sử dụng khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả các bản ghi liên quan trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên quan trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định. Khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại các bản ghi liên quan trong bảng con, thao tác xóa bản ghi trong bảng cha sẽ bị từ chối.
- NO ACTION: Tương tự như RESTRICT, nếu tồn tại các bản ghi liên quan trong bảng con, thao tác xóa bản ghi trong bảng cha sẽ bị từ chối.