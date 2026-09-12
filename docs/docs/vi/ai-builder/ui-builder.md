---
title: "Cấu hình giao diện"
description: "Skill cấu hình giao diện dùng để tạo và chỉnh sửa các cấu hình trang, Block, Field và Action của NocoBase."
keywords: "AI Builder,Cấu hình giao diện,Trang,Block,Popup,Liên động,UI Builder"
---

# Cấu hình giao diện

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).

:::

## Giới thiệu

Skill cấu hình giao diện dùng để tạo và chỉnh sửa các cấu hình trang, Block, Field và Action của NocoBase — bạn mô tả trang mong muốn bằng ngôn ngữ nghiệp vụ, Skill xử lý việc tạo blueprint, bố cục Block và tương tác liên động.


## Phạm vi năng lực

Có thể làm:

- Tạo trang hoàn chỉnh: bảng, biểu mẫu lọc, popup chi tiết một bước là xong
- Chỉnh sửa trang đã có: thêm Block, điều chỉnh Field, cấu hình popup, điều chỉnh bố cục
- Thiết lập tương tác liên động: giá trị mặc định, ẩn/hiện Field, liên động tính toán, trạng thái nút Action
- Sử dụng template để tái sử dụng: popup và Block lặp lại có thể lưu thành template
- Hỗ trợ tác vụ đa trang: xây dựng từng trang theo thứ tự

Không thể làm:

- Không thể cấu hình quyền ACL (dùng [Skill cấu hình quyền](./acl))
- Không thể thiết kế cấu trúc bảng dữ liệu (dùng [Skill mô hình hóa dữ liệu](./data-modeling))
- Không thể sắp xếp Workflow (dùng [Skill quản lý Workflow](./workflow))
- Không thể xử lý điều hướng cho trang non-modern (v1), chỉ hỗ trợ xử lý trang v2.

## Ví dụ câu lệnh

### Tình huống A: Tạo trang quản lý

```
Tạo cho tôi trang quản lý Customer, gồm ô tìm kiếm theo tên và bảng customer, bảng hiển thị tên, số điện thoại, email, thời gian tạo
```

Skill sẽ đọc các Field của bảng dữ liệu trước, sinh blueprint trang và ghi vào.

![Tạo trang quản lý](https://static-docs.nocobase.com/20260420100608.png)


### Tình huống B: Cấu hình popup

```
Khi click vào tên customer trong bảng thì popup trang chi tiết hiển thị tất cả Field
```

Sẽ ưu tiên dùng popup Field (click là popup) thay vì thêm nút Action bổ sung.

![Cấu hình popup](https://static-docs.nocobase.com/20260420100641.png)

### Tình huống C: Thiết lập quy tắc liên động

```
Thêm quy tắc Field cho biểu mẫu chỉnh sửa trong popup /admin/c0vc2vmkfll/view/cec3e7a69ac/filterbytk/1:
khi user id là 1 thì cấm chỉnh sửa username
```

Sẽ thực hiện qua cấu hình quy tắc liên động và không cần viết cấu hình thủ công.

![Thiết lập quy tắc liên động](https://static-docs.nocobase.com/20260420100709.png)

### Tình huống D: Xây dựng đa trang

```
Xây dựng cho tôi một hệ thống quản lý người dùng, hệ thống có hai trang: trang quản lý người dùng và trang quản lý vai trò, chúng nằm trong cùng một group trang.
```

Sẽ đưa ra thiết kế đơn giản đa trang, sau khi điều chỉnh và xác nhận thủ công có thể tiến hành xây dựng.

![Xây dựng đa trang](https://static-docs.nocobase.com/20260420100731.png)

## Câu hỏi thường gặp

**Trang đã tạo nhưng Block không có dữ liệu thì sao?**

Trước hết hãy xác nhận bảng dữ liệu tương ứng thực sự có bản ghi. Tiếp theo kiểm tra Block đã liên kết đúng Collection và nguồn dữ liệu chưa. Bạn cũng có thể dùng trực tiếp [Skill mô hình hóa dữ liệu](./data-modeling) để tạo dữ liệu giả lập.

**Muốn đặt nhiều Block trong popup thì sao?**

Bạn có thể mô tả nội dung popup trong câu lệnh, ví dụ "Trong popup chỉnh sửa đặt một biểu mẫu và một bảng liên kết". Skill sẽ tạo bố cục popup tùy chỉnh chứa nhiều Block.

**Cấu hình thủ công và cấu hình AI có ảnh hưởng lẫn nhau không?**

Nếu cấu hình thủ công và cấu hình AI cùng diễn ra đồng thời sẽ ảnh hưởng lẫn nhau, nếu không cùng thời điểm cấu hình thì sẽ không có ảnh hưởng.

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [Mô hình hóa dữ liệu](./data-modeling) — Sử dụng AI để tạo và quản lý bảng, Field, quan hệ liên kết
- [Cấu hình quyền](./acl) — Cấu hình vai trò và quyền truy cập dữ liệu
- [Quản lý Workflow](./workflow) — Tạo, chỉnh sửa và chẩn đoán Workflow
