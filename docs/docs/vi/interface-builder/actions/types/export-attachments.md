---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xuất tệp đính kèm

## Giới thiệu

Tính năng xuất tệp đính kèm hỗ trợ xuất các trường liên quan đến tệp đính kèm dưới dạng gói nén.

#### Cấu hình xuất tệp đính kèm

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Cấu hình các trường tệp đính kèm cần xuất; bạn có thể chọn nhiều trường.
- Bạn có thể chọn có tạo thư mục cho mỗi bản ghi hay không.

Quy tắc đặt tên tệp:

- Nếu bạn chọn tạo thư mục cho mỗi bản ghi, quy tắc đặt tên tệp sẽ là: `{Giá trị trường tiêu đề của bản ghi}/{Tên trường tệp đính kèm}[-{Số thứ tự tệp}].{Phần mở rộng tệp}`.
- Nếu bạn chọn không tạo thư mục, quy tắc đặt tên tệp sẽ là: `{Giá trị trường tiêu đề của bản ghi}-{Tên trường tệp đính kèm}[-{Số thứ tự tệp}].{Phần mở rộng tệp}`.

Số thứ tự tệp sẽ tự động được tạo khi một trường tệp đính kèm chứa nhiều tệp.

- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): Hiển thị/ẩn nút một cách linh hoạt;
- [Chỉnh sửa nút](/interface-builder/actions/action-settings/edit-button): Chỉnh sửa tiêu đề, loại và biểu tượng của nút;