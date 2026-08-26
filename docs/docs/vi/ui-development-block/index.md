---
title: "Tổng quan mở rộng Block"
description: "Phát triển mở rộng Block: mở rộng Block tùy chỉnh dựa trên FlowModel, hỗ trợ BlockModel, render, event flow."
keywords: "mở rộng Block,FlowModel,BlockModel,NocoBase"
---

# Tổng quan mở rộng Block

Trong NocoBase 2.0, cơ chế mở rộng Block đã được đơn giản hóa đáng kể. Bạn chỉ cần kế thừa lớp cơ sở **FlowModel** tương ứng và hiện thực các phương thức interface liên quan (chủ yếu là phương thức `renderComponent()`) là có thể tùy chỉnh Block một cách nhanh chóng.

## Phân loại Block

NocoBase chia Block thành ba loại, hiển thị theo nhóm trong giao diện cấu hình:

- **Data blocks**: Block kế thừa từ `DataBlockModel` hoặc `CollectionBlockModel`
- **Filter blocks**: Block kế thừa từ `FilterBlockModel`
- **Other blocks**: Block kế thừa trực tiếp từ `BlockModel`

> Nhóm mà Block thuộc về được quyết định bởi lớp cơ sở tương ứng, logic phân loại dựa trên quan hệ kế thừa, không cần cấu hình thêm.

## Mô tả lớp cơ sở

Hệ thống cung cấp bốn lớp cơ sở để mở rộng:

### BlockModel

**Model Block cơ bản**, là lớp cơ sở Block tổng quát nhất.

- Phù hợp với Block thuần hiển thị, không phụ thuộc dữ liệu
- Sẽ được phân vào nhóm **Other blocks**
- Phù hợp với các kịch bản cá nhân hóa

### DataBlockModel

**Model Data Block (không gắn với Collection)**, hướng đến Block có nguồn dữ liệu tùy chỉnh.

- Không gắn trực tiếp với Collection, có thể tùy chỉnh logic lấy dữ liệu
- Sẽ được phân vào nhóm **Data blocks**
- Phù hợp với: gọi API bên ngoài, xử lý dữ liệu tùy chỉnh, biểu đồ thống kê v.v.

### CollectionBlockModel

**Model Block của Collection**, Block cần gắn với Collection.

- Lớp cơ sở Model cần gắn với Collection
- Sẽ được phân vào nhóm **Data blocks**
- Phù hợp với: list, form, kanban và các Block phụ thuộc rõ ràng vào một Collection

### FilterBlockModel

**Model Filter Block**, dùng để xây dựng điều kiện filter.

- Lớp cơ sở Model dùng để xây dựng điều kiện filter
- Sẽ được phân vào nhóm **Filter blocks**
- Thường liên kết với Data Block

## Cách chọn lớp cơ sở

Khi chọn lớp cơ sở, bạn có thể tuân theo các nguyên tắc sau:

- **Cần gắn với một Collection cụ thể**: ưu tiên chọn `CollectionBlockModel`
- **Tùy chỉnh nguồn dữ liệu**: chọn `DataBlockModel`
- **Dùng để đặt điều kiện filter và liên kết với Data Block**: chọn `FilterBlockModel`
- **Không biết phân loại như thế nào**: chọn `BlockModel`

## Bắt đầu nhanh

Tạo Block tùy chỉnh chỉ cần ba bước:

1. Kế thừa lớp cơ sở tương ứng (như `BlockModel`)
2. Hiện thực phương thức `renderComponent()` trả về React component
3. Đăng ký Block Model trong plugin

Xem ví dụ chi tiết tại [Viết một plugin Block](./write-a-block-plugin).
