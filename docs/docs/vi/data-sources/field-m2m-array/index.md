---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Many-to-Many (Array)"
description: "Sử dụng field array để lưu nhiều khóa duy nhất của bảng đích, thiết lập quan hệ ManyToMany, ví dụ Article-Tag ManyToMany, không cần bảng trung gian."
keywords: "Many-to-Many array,M2M Array,Array association,BelongsToMany,NocoBase"
---
# Many-to-Many (Array)

## Giới thiệu

Hỗ trợ trong Collection, sử dụng field array để lưu nhiều khóa duy nhất của bảng đích, từ đó thiết lập quan hệ ManyToMany với bảng đích. Ví dụ: có hai thực thể Article và Tag, một bài viết có thể liên kết với nhiều tag, trong bảng Article dùng một field array để lưu ID của các bản ghi tương ứng trong bảng Tag.

:::warning{title=Lưu ý}

- Vui lòng cố gắng sử dụng bảng trung gian để thiết lập quan hệ [ManyToMany](../data-modeling/collection-fields/associations/m2m/index.md) chuẩn, tránh sử dụng kiểu quan hệ này.
- Đối với quan hệ ManyToMany được thiết lập bằng field array, hiện chỉ khi sử dụng PostgreSQL, mới hỗ trợ lọc dữ liệu bảng nguồn dựa trên field của bảng đích. Ví dụ: trong ví dụ trên, sử dụng field khác của bảng Tag, như title, để lọc bài viết.
  :::

### Cấu hình Field

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Mô tả tham số

### Source collection

Bảng nguồn, tức là bảng chứa field hiện tại.

### Target collection

Bảng đích, liên kết với bảng nào.

### Foreign key

Field array, là field lưu Target key của bảng đích trong bảng nguồn.

Tương ứng kiểu field array:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Field tương ứng với giá trị lưu trong field array của bảng nguồn, phải có tính duy nhất.
