---
title: "Một-một"
description: "Trường quan hệ một-một (O2O), trong đó hai thực thể bảng tương ứng một-một, dùng để lưu trữ riêng các khía cạnh khác nhau của thực thể."
keywords: "Một-một,O2O,HasOne,BelongsTo,Trường liên kết,NocoBase"
---

# Một-một

Mối quan hệ giữa nhân viên và hồ sơ cá nhân: mỗi nhân viên chỉ có thể có một bản ghi hồ sơ cá nhân, và mỗi bản ghi hồ sơ cá nhân cũng chỉ có thể tương ứng với một nhân viên. Trong trường hợp này, nhân viên và hồ sơ cá nhân có quan hệ một-một.

Khóa ngoại của quan hệ một-một có thể được đặt trong bảng nguồn hoặc bảng đích. Nếu biểu thị quan hệ «có một», đặt khóa ngoại trong bảng đích sẽ phù hợp hơn; nếu biểu thị «thuộc về», đặt khóa ngoại trong bảng nguồn sẽ phù hợp hơn.

Ví dụ như trường hợp trên, mỗi nhân viên chỉ có một hồ sơ cá nhân và hồ sơ cá nhân thuộc về nhân viên, vì vậy khóa ngoại này phù hợp để đặt trong bảng hồ sơ cá nhân.

## Một-một (có một)

Biểu thị một nhân viên có một bản ghi hồ sơ cá nhân

Quan hệ ER

![văn bản thay thế](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Cấu hình trường

![văn bản thay thế](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Một-một (thuộc về)

Biểu thị một bản ghi hồ sơ cá nhân thuộc về một nhân viên

Quan hệ ER

![văn bản thay thế](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Cấu hình trường

![văn bản thay thế](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa trường hiện tại.

### Target collection

Bảng đích, là bảng được liên kết.

### Foreign key

Dùng để thiết lập mối liên kết giữa hai bảng. Khóa ngoại của quan hệ một-một có thể được đặt trong bảng nguồn hoặc bảng đích. Nếu biểu thị quan hệ «có một», đặt khóa ngoại trong bảng đích sẽ phù hợp hơn; nếu biểu thị «thuộc về», đặt khóa ngoại trong bảng nguồn sẽ phù hợp hơn.

### Source key <- Foreign key（khóa ngoại trong bảng đích）

Trường được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất. Khi khóa ngoại được đặt trong bảng đích, nó biểu thị quan hệ «có một».

### Target key <- Foreign key（khóa ngoại trong bảng nguồn）

Trường được tham chiếu bởi ràng buộc khóa ngoại, phải có tính duy nhất. Khi khóa ngoại được đặt trong bảng nguồn, nó biểu thị quan hệ «thuộc về».

### ON DELETE

ON DELETE là quy tắc xử lý tham chiếu khóa ngoại trong bảng con khi bản ghi trong bảng cha bị xóa. Đây là một tùy chọn được sử dụng khi định nghĩa ràng buộc khóa ngoại. Các tùy chọn ON DELETE thường gặp bao gồm:

- CASCADE: Khi xóa bản ghi trong bảng cha, tự động xóa tất cả bản ghi liên quan trong bảng con.
- SET NULL: Khi xóa bản ghi trong bảng cha, đặt giá trị khóa ngoại liên quan trong bảng con thành NULL.
- RESTRICT: Tùy chọn mặc định. Khi cố gắng xóa bản ghi trong bảng cha, nếu tồn tại bản ghi liên quan trong bảng con thì từ chối xóa bản ghi trong bảng cha.
- NO ACTION: Tương tự RESTRICT. Nếu tồn tại bản ghi liên quan trong bảng con thì từ chối xóa bản ghi trong bảng cha.