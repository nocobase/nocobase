---
title: "Sub-Table (chỉnh sửa nội dòng)"
description: "Field Sub-Table: chế độ chỉnh sửa nội dòng, chỉnh sửa trực tiếp dữ liệu liên kết một-nhiều trong Table."
keywords: "Sub-Table,SubTable,chỉnh sửa nội dòng,một-nhiều,Interface Builder,NocoBase"
---

# Sub-Table (chỉnh sửa nội dòng)

## Giới thiệu

Sub-Table phù hợp để xử lý các Field quan hệ đến nhiều, hỗ trợ tạo hàng loạt dữ liệu Table mục tiêu rồi liên kết hoặc chọn liên kết từ dữ liệu hiện có.

## Hướng dẫn sử dụng

![20251027223350](https://static-docs.nocobase.com/20251027223350.png)

Các loại Field khác nhau trong Sub-Table hiển thị các component Field khác nhau, các Field lớn (Field văn bản phong phú, JSON, văn bản nhiều dòng, v.v.) được chỉnh sửa thông qua Popup nổi.

![20251027223426](https://static-docs.nocobase.com/20251027223426.png)

Field quan hệ trong Sub-Table.

Order (một-nhiều) > Order Products (một-một) > Opportunity

![20251027223530](https://static-docs.nocobase.com/20251027223530.png)

Component Field quan hệ mặc định là Select dropdown (hỗ trợ Select dropdown/Data Picker).

![20251027223754](https://static-docs.nocobase.com/20251027223754.png)

## Tùy chọn cấu hình Field

### Cho phép chọn dữ liệu hiện có (mặc định bật)

Hỗ trợ chọn liên kết từ dữ liệu hiện có.
![20251027224008](https://static-docs.nocobase.com/20251027224008.png)

![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)

### Component Field

[Component Field](/interface-builder/fields/association-field): chuyển sang component Field quan hệ khác, như Select dropdown, Data Picker, v.v.;

### Cho phép giải tỏa liên kết dữ liệu hiện có

> Dữ liệu Field quan hệ trong Form chỉnh sửa có cho phép giải tỏa liên kết với dữ liệu hiện có hay không

![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)
