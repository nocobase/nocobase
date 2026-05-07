---
title: "Field của Collection"
description: "Loại Field của Collection: Interface và kiểu dữ liệu, Field vô hướng, Field quan hệ, cấu hình liên kết, quy tắc xác thực Field."
keywords: "Field của Collection,loại Field,Field Interface,Field của Collection,NocoBase"
---

# Field của Collection

## Loại Interface của Field

NocoBase phân chia các Field theo góc nhìn Interface thành các nhóm sau:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Kiểu dữ liệu của Field

Mỗi Field Interface có một kiểu dữ liệu mặc định, ví dụ Field có Interface là Số (Number) thì kiểu dữ liệu mặc định là double, nhưng cũng có thể là float, decimal, v.v. Các kiểu dữ liệu hiện được hỗ trợ bao gồm:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Ánh xạ loại Field

Quy trình thêm Field mới của database chính:

1. Chọn loại Interface
2. Cấu hình kiểu dữ liệu khả dụng cho Interface hiện tại

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Quy trình ánh xạ Field của Data Source bên ngoài:

1. Tự động ánh xạ kiểu dữ liệu (Field type) và loại UI (Field Interface) tương ứng dựa trên loại Field của database bên ngoài.
2. Sửa thành kiểu dữ liệu và loại Interface phù hợp hơn theo nhu cầu.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)
