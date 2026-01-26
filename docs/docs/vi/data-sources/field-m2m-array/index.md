---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Đa-đa (Mảng)

## Giới thiệu

Tính năng này cho phép bạn sử dụng các trường mảng trong một bộ sưu tập dữ liệu để lưu trữ nhiều khóa duy nhất từ bảng đích, qua đó thiết lập mối quan hệ đa-đa giữa hai bảng. Ví dụ, hãy xem xét hai thực thể Bài viết và Thẻ. Một bài viết có thể liên kết với nhiều thẻ, với bảng bài viết lưu trữ ID của các bản ghi tương ứng từ bảng thẻ trong một trường mảng.

:::warning{title=Lưu ý}

- Bất cứ khi nào có thể, bạn nên sử dụng một bộ sưu tập trung gian để thiết lập mối quan hệ [đa-đa](../data-modeling/collection-fields/associations/m2m/index.md) tiêu chuẩn, thay vì dựa vào loại quan hệ này.
- Hiện tại, chỉ PostgreSQL hỗ trợ lọc dữ liệu bộ sưu tập nguồn bằng cách sử dụng các trường từ bảng đích cho các mối quan hệ đa-đa được thiết lập bằng trường mảng. Ví dụ, trong kịch bản trên, bạn có thể lọc bài viết dựa trên các trường khác trong bảng thẻ, chẳng hạn như tiêu đề.

  :::

### Cấu hình trường

![Cấu hình trường đa-đa (mảng)](https://static-docs.nocobase.com/202407051108180.png)

## Mô tả tham số

### Source collection

Bộ sưu tập nguồn, nơi trường hiện tại được đặt.

### Target collection

Bộ sưu tập đích, bộ sưu tập mà mối quan hệ được thiết lập.

### Foreign key

Trường mảng trong bộ sưu tập nguồn dùng để lưu trữ Target key từ bảng đích.

Mối quan hệ tương ứng cho các loại trường mảng như sau:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Trường trong bộ sưu tập đích tương ứng với các giá trị được lưu trữ trong trường mảng của bảng nguồn. Trường này phải là duy nhất.