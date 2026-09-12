---
title: "Cấu hình quyền"
description: "Skill cấu hình quyền dùng để quản lý vai trò, chính sách quyền, gán người dùng và đánh giá rủi ro ACL của NocoBase qua ngôn ngữ tự nhiên."
keywords: "AI Builder,Cấu hình quyền,ACL,Vai trò,Quyền,Gán người dùng,Đánh giá rủi ro"
---

# Cấu hình quyền

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).

:::

## Giới thiệu

Skill cấu hình quyền dùng để quản lý vai trò, chính sách quyền, gán người dùng và đánh giá rủi ro ACL của NocoBase qua ngôn ngữ tự nhiên — bạn mô tả mục tiêu nghiệp vụ, Skill chọn lệnh và tham số.


## Phạm vi năng lực

- Tạo vai trò mới
- Chuyển đổi chế độ vai trò toàn cục (chế độ độc lập / chế độ liên kết)
- Cấu hình hàng loạt quyền Action và phạm vi dữ liệu cho bảng dữ liệu
- Gỡ liên kết người dùng với vai trò
- Output báo cáo đánh giá rủi ro ở cấp vai trò, cấp người dùng và cấp hệ thống

## Ví dụ câu lệnh

### Tình huống A: Gán người dùng hàng loạt
:::tip Điều kiện tiên quyết
Môi trường hiện tại có một vai trò Member và nhiều người dùng
:::

```
Gán cho mấy user mới này vai trò Member: James, Emma, Michael
```

![Gán người dùng hàng loạt](https://static-docs.nocobase.com/20260422202343.png)

### Tình huống B: Cấu hình quyền trang hàng loạt
:::tip Điều kiện tiên quyết
Môi trường hiện tại có một vai trò Member và nhiều trang
:::
```
Cấu hình quyền cho vai trò Member với mấy trang này: Product, Order, Stock
```

![Cấu hình quyền trang hàng loạt](https://static-docs.nocobase.com/20260422202949.png)

### Tình huống C: Cấu hình quyền nhiều bảng dữ liệu hàng loạt
:::tip Điều kiện tiên quyết
Môi trường hiện tại có một vai trò Member và nhiều bảng dữ liệu
:::

```
Thêm cho vai trò Member quyền chỉ đọc độc lập của mấy bảng dữ liệu này: order, product, stock
```

![Cấu hình quyền độc lập bảng dữ liệu hàng loạt](https://static-docs.nocobase.com/20260422205341.png)

![Cấu hình quyền độc lập bảng dữ liệu hàng loạt 2](https://static-docs.nocobase.com/20260422205430.png)

### Tình huống D: Cấu hình quyền nhiều vai trò nhiều bảng dữ liệu
:::tip Điều kiện tiên quyết
Môi trường hiện tại có nhiều vai trò và nhiều bảng dữ liệu
:::

```
Thêm cho vai trò Member, Sales quyền đọc ghi độc lập của mấy bảng dữ liệu này: order, product, stock
```

![Cấu hình nhiều vai trò nhiều bảng dữ liệu](https://static-docs.nocobase.com/20260422213524.png)

### Tình huống E: Đánh giá rủi ro

```
Đánh giá rủi ro quyền của vai trò Member
```

Sẽ output điểm rủi ro, mô tả phạm vi ảnh hưởng và gợi ý cải thiện.

## Câu hỏi thường gặp

**Đã cấu hình quyền nhưng không có hiệu lực thì sao?**

Trước hết hãy xác nhận chế độ vai trò toàn cục có đúng không — nếu một user có nhiều vai trò cùng lúc, hành vi giữa chế độ liên kết và chế độ độc lập khác nhau rất nhiều, có thể xem chế độ hiện tại để xác nhận vấn đề.

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
