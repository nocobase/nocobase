---
title: "Mô hình hóa dữ liệu"
description: "Skill mô hình hóa dữ liệu dùng để tạo và quản lý bảng dữ liệu của NocoBase qua ngôn ngữ tự nhiên, bao gồm tạo bảng, thêm Field, thiết lập quan hệ liên kết..."
keywords: "AI Builder,Mô hình hóa dữ liệu,Bảng dữ liệu,Field,Quan hệ liên kết,Collection"
---

# Mô hình hóa dữ liệu

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).

:::

## Giới thiệu

Skill mô hình hóa dữ liệu dùng để tạo và quản lý bảng dữ liệu của NocoBase qua ngôn ngữ tự nhiên — tạo bảng, thêm Field, thiết lập quan hệ liên kết...

Trước khi sử dụng cần đảm bảo nguồn dữ liệu đích đã được cấu hình trong "Quản lý nguồn dữ liệu".


## Phạm vi năng lực

- Tạo, sửa, xóa bảng dữ liệu, hỗ trợ bảng thường, bảng cây, bảng file, bảng calendar, bảng SQL, bảng view, bảng kế thừa
- Thêm, sửa, xóa Field, bao gồm các kiểu Field tích hợp sẵn của NocoBase (kể cả Field quan hệ) và các kiểu Field được mở rộng bởi Plugin

## Ví dụ câu lệnh

### Tình huống A: Tạo bảng dữ liệu

```
Tạo cho tôi một bảng file để quản lý hợp đồng
```

Skill sẽ hướng dẫn AI phân tích các Field cần có cho bảng và kiểu Field tương ứng trong NocoBase, sau đó tạo bảng kiểu file và thêm các Field tương ứng vào hệ thống.

![Tạo bảng dữ liệu](https://static-docs.nocobase.com/202604162103369.png)

### Tình huống B: Thêm Field

```
Thêm cho tôi một Field trạng thái vào bảng người dùng, dùng để biểu thị người dùng có đang làm việc hay không, gồm ba trạng thái đang làm việc, đang nghỉ việc, đã nghỉ việc
```

Skill sẽ hướng dẫn AI lấy metadata của bảng người dùng và phân tích Field trạng thái biểu thị có đang làm việc hay không tương ứng với kiểu Field "Dropdown (chọn một)" trong NocoBase, sau đó thêm Field vào bảng người dùng và thiết lập các giá trị enum.

![Thêm Field](https://static-docs.nocobase.com/202604162112692.png)

### Tình huống C: Khởi tạo mô hình dữ liệu

```
Tôi đang xây dựng một CRM, hãy thiết kế và xây dựng mô hình dữ liệu cho tôi
```

Skill sẽ dựa trên mô hình dữ liệu mà AI đã phân tích và thiết kế, tạo các bảng dữ liệu, thêm Field và cấu hình các quan hệ liên kết trong hệ thống.

![Khởi tạo mô hình dữ liệu](https://static-docs.nocobase.com/202604162126729.png)

![Kết quả khởi tạo mô hình dữ liệu](https://static-docs.nocobase.com/202604162201867.png)

### Tình huống D: Thêm module chức năng

```
Tôi muốn thêm mô hình dữ liệu quản lý đơn hàng người dùng dựa trên hệ thống CRM hiện tại
```

Skill sẽ hướng dẫn AI lấy mô hình dữ liệu của hệ thống hiện tại và dựa trên đó hoàn thành thiết kế mô hình dữ liệu cho chức năng mới, sau đó tự động tạo bảng dữ liệu, thêm Field và cấu hình quan hệ liên kết.

![Thêm module chức năng](https://static-docs.nocobase.com/202604162203006.png)

![Kết quả thêm module chức năng](https://static-docs.nocobase.com/202604162203893.png)

## Câu hỏi thường gặp

**Khi tạo bảng có tự động tạo Field hệ thống không?**

Có. Các Field hệ thống như `id`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy` được server tự động tạo, không cần chỉ định thủ công.

**Quan hệ liên kết tạo sai thì sửa thế nào?**

Khuyến nghị kiểm tra khóa ngoại và Field ngược của Field liên kết hiện tại trước, rồi quyết định sửa hay xóa và tạo lại. Skill sẽ đọc lại để kiểm tra trạng thái liên kết của cả hai bên sau khi thay đổi.

**Cách tạo bảng dữ liệu dựa trên kiểu bảng được mở rộng bởi Plugin?**

Trường hợp này yêu cầu Plugin tương ứng đang ở trạng thái kích hoạt. Nếu chưa kích hoạt, AI thường sẽ thử kích hoạt Plugin, nếu AI thao tác không thành công, vui lòng kích hoạt Plugin thủ công.

**Cách thêm Field dựa trên kiểu Field được mở rộng bởi Plugin?**

Tương tự như trên.

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [Cấu hình giao diện](./ui-builder) — Sau khi xây dựng bảng dữ liệu, dùng AI để xây dựng trang và Block
- [Giải pháp](./dsl-reconciler) — Xây dựng nguyên cả hệ thống nghiệp vụ hàng loạt từ YAML
