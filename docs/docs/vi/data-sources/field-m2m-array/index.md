---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Nhiều-nhiều (mảng)"
description: "Sử dụng trường mảng để lưu các khóa duy nhất của nhiều bản ghi trong bảng đích, thiết lập mối quan hệ nhiều-nhiều, chẳng hạn như quan hệ nhiều-nhiều giữa bài viết và thẻ, mà không cần bảng trung gian."
keywords: "nhiều-nhiều mảng,M2M Array,liên kết mảng,BelongsToMany,NocoBase"
---
# Nhiều-nhiều (mảng)

## Giới thiệu

Hỗ trợ sử dụng trường mảng trong bảng dữ liệu để lưu các khóa duy nhất của nhiều bản ghi trong bảng đích, từ đó thiết lập mối quan hệ nhiều-nhiều với bảng đích. Ví dụ: có hai thực thể là bài viết và thẻ, một bài viết có thể liên kết với nhiều thẻ; trong bảng bài viết, sử dụng một trường mảng để lưu ID của các bản ghi tương ứng trong bảng thẻ.

:::warning{title=Chú ý}

- Vui lòng sử dụng bảng trung gian nhiều nhất có thể để thiết lập quan hệ [nhiều-nhiều](../data-modeling/collection-fields/associations/m2m/index.md) tiêu chuẩn, tránh sử dụng loại quan hệ này.
- Đối với mối quan hệ nhiều-nhiều được thiết lập bằng trường mảng, hiện chỉ PostgreSQL hỗ trợ lọc dữ liệu của bảng nguồn bằng các trường của bảng đích. Ví dụ: trong ví dụ trên, có thể sử dụng các trường khác của bảng thẻ, chẳng hạn như tiêu đề, để lọc bài viết.
  :::

### Cấu hình trường

![cấu hình trường nhiều-nhiều (mảng)](https://static-docs.nocobase.com/202407051108180.png)

## Mô tả tham số

### Bộ sưu tập nguồn

Bảng nguồn, tức là bảng chứa trường hiện tại.

### Bộ sưu tập đích

Bảng đích, tức là bảng được liên kết.

### Khóa ngoại

Trường mảng dùng để lưu khóa đích Target key trong bảng nguồn.

Mối tương ứng của kiểu trường mảng:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Khóa đích

Trường tương ứng với các giá trị được lưu trong trường mảng của bảng nguồn, bắt buộc phải có tính duy nhất.
