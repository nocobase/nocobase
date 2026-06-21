---
pkg: "@nocobase/plugin-action-bulk-update"
title: "Action cập nhật hàng loạt"
description: "Action cập nhật hàng loạt: cập nhật hàng loạt các bản ghi được chọn, hỗ trợ cập nhật hàng loạt theo điều kiện lọc."
keywords: "cập nhật hàng loạt,BulkUpdate,sửa đổi hàng loạt,Interface Builder,NocoBase"
---
# Cập nhật hàng loạt

## Giới thiệu

Action cập nhật hàng loạt được dùng cho trường hợp cần cập nhật giống nhau cho một nhóm bản ghi, trước khi thực hiện Action cập nhật hàng loạt, bạn cần định nghĩa trước logic gán giá trị Field cập nhật. Bộ logic này sẽ được áp dụng cho tất cả các bản ghi được chọn khi bạn nhấp nút cập nhật.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Cấu hình Action

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Dữ liệu cập nhật

Đã chọn/Tất cả, mặc định là Đã chọn.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Gán giá trị Field

Đặt Field cập nhật hàng loạt, chỉ Field được đặt mới được cập nhật.

Như trong hình cấu hình Action cập nhật hàng loạt trong Table đơn hàng, cập nhật hàng loạt dữ liệu được chọn thành "Chờ phê duyệt".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Chỉnh sửa nút bấm](/interface-builder/actions/action-settings/edit-button): chỉnh sửa tiêu đề, loại, biểu tượng của nút bấm;
- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): hiển thị/ẩn nút bấm động;
- [Xác nhận lần hai](/interface-builder/actions/action-settings/double-check)
