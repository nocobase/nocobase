---
pkg: "@nocobase/plugin-action-export-pro"
title: "Action xuất tập tin đính kèm"
description: "Action xuất tập tin đính kèm: xuất các tập tin đính kèm liên kết với bản ghi, hỗ trợ xuất hàng loạt, tải xuống tập tin nén."
keywords: "xuất tập tin đính kèm,ExportAttachments,xuất đính kèm,tải tập tin,Interface Builder,NocoBase"
---
# Xuất tập tin đính kèm

## Giới thiệu

Xuất tập tin đính kèm hỗ trợ xuất các Field liên quan đến tập tin đính kèm thành định dạng tập tin nén.

#### Cấu hình xuất tập tin đính kèm

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Cấu hình Field tập tin đính kèm cần xuất, hỗ trợ chọn nhiều.
- Có thể chọn có tạo một thư mục cho mỗi bản ghi hay không.

Quy tắc đặt tên tập tin:

- Nếu chọn tạo một thư mục cho mỗi bản ghi, quy tắc đặt tên tập tin là: `{giá trị Field tiêu đề bản ghi}/{tên Field tập tin đính kèm}[-{số thứ tự tập tin}].{phần mở rộng tập tin}`.
- Nếu chọn không tạo thư mục, quy tắc đặt tên tập tin là: `{giá trị Field tiêu đề bản ghi}-{tên Field tập tin đính kèm}[-{số thứ tự tập tin}].{phần mở rộng tập tin}`.

Số thứ tự tập tin được tự động tạo khi có nhiều tập tin đính kèm trong Field tập tin đính kèm.


- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): hiển thị/ẩn nút bấm động;
- [Chỉnh sửa nút bấm](/interface-builder/actions/action-settings/edit-button): chỉnh sửa tiêu đề, loại, biểu tượng của nút bấm;
