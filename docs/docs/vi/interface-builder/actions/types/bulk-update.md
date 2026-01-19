---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Cập nhật hàng loạt

## Giới thiệu

Thao tác cập nhật hàng loạt được sử dụng khi bạn cần áp dụng cùng một cập nhật cho một nhóm bản ghi. Trước khi thực hiện thao tác này, người dùng cần định nghĩa trước logic gán giá trị cho các trường sẽ được cập nhật. Logic này sẽ được áp dụng cho tất cả các bản ghi đã chọn khi người dùng nhấp vào nút cập nhật.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Cấu hình thao tác

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Dữ liệu cần cập nhật

Đã chọn/Tất cả, mặc định là Đã chọn.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Gán giá trị trường

Thiết lập các trường để cập nhật hàng loạt. Chỉ các trường đã thiết lập mới được cập nhật.

Như hình minh họa, cấu hình thao tác cập nhật hàng loạt trong bảng đơn hàng để cập nhật hàng loạt dữ liệu đã chọn thành trạng thái "Chờ phê duyệt".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Nút chỉnh sửa](/interface-builder/actions/action-settings/edit-button): Chỉnh sửa tiêu đề, loại và biểu tượng của nút;
- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): Hiển thị/ẩn nút một cách linh hoạt;
- [Xác nhận lần hai](/interface-builder/actions/action-settings/double-check)