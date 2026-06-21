---
title: "One-to-One"
description: "Field quan hệ OneToOne (O2O), thực thể trong hai bảng tương ứng 1-1, dùng để tách lưu trữ các khía cạnh khác nhau của thực thể."
keywords: "One-to-One,O2O,HasOne,BelongsTo,Field liên kết,NocoBase"
---

# One-to-One

Mối quan hệ giữa nhân viên và hồ sơ cá nhân, mỗi nhân viên chỉ có thể có một bản ghi hồ sơ cá nhân, và mỗi bản ghi hồ sơ cá nhân cũng chỉ có thể tương ứng với một nhân viên, trong tình huống này, nhân viên và hồ sơ cá nhân là quan hệ OneToOne.

Khóa ngoại của OneToOne có thể đặt trong bảng nguồn hoặc bảng đích, nếu biểu thị "có một", thì đặt khóa ngoại trong bảng đích phù hợp hơn; nếu biểu thị "quan hệ thuộc về", thì đặt khóa ngoại trong bảng nguồn phù hợp hơn.

Ví dụ trong trường hợp trên, nhân viên chỉ có một bản ghi hồ sơ cá nhân, hồ sơ cá nhân thuộc về nhân viên, vì vậy khóa ngoại này phù hợp đặt trong bảng hồ sơ cá nhân.

## OneToOne (HasOne - có một)

Biểu thị một nhân viên có một bản ghi hồ sơ cá nhân

Quan hệ ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Cấu hình Field

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## OneToOne (BelongsTo - thuộc về)

Biểu thị một bản ghi hồ sơ cá nhân thuộc về một nhân viên

Quan hệ ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Cấu hình Field

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa field hiện tại.

### Target collection

Bảng đích, liên kết với bảng nào.

### Foreign key

Dùng để thiết lập liên kết giữa hai bảng. Khóa ngoại của OneToOne có thể đặt trong bảng nguồn hoặc bảng đích, nếu biểu thị "có một", thì đặt khóa ngoại trong bảng đích phù hợp hơn; nếu biểu thị "quan hệ thuộc về", thì đặt khóa ngoại trong bảng nguồn phù hợp hơn.

### Source key <- Foreign key (khóa ngoại trong bảng đích)

Field được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất. Khi khóa ngoại đặt trong bảng đích, biểu thị "có một".

### Target key <- Foreign key (khóa ngoại trong bảng nguồn)

Field được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất. Khi khóa ngoại đặt trong bảng nguồn, biểu thị "quan hệ thuộc về".

### ON DELETE

ON DELETE là quy tắc xử lý các tham chiếu khóa ngoại trong bảng con liên quan khi xóa bản ghi trong bảng cha, đây là một tùy chọn khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả các bản ghi liên quan trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên quan trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định, khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
- NO ACTION: Tương tự RESTRICT, nếu tồn tại bản ghi liên quan trong bảng con, từ chối xóa bản ghi bảng cha.
