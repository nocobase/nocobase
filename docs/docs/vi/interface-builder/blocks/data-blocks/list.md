---
pkg: "@nocobase/plugin-block-list"
title: "Block Danh sách"
description: "Block Danh sách: hiển thị dữ liệu nguồn dạng danh sách, hỗ trợ bố cục dạng thẻ, phân trang, lọc, cấu hình Action."
keywords: "Block Danh sách, ListBlock, danh sách dữ liệu, bố cục thẻ, phân trang lọc, xây dựng giao diện, NocoBase"
---
# Block Danh sách

## Giới thiệu

Block Danh sách hiển thị dữ liệu dưới dạng danh sách, phù hợp với các tình huống hiển thị dữ liệu như danh sách công việc, tin tức, thông tin sản phẩm v.v.

## Cấu hình Block

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Cấu hình phạm vi dữ liệu

Như hình: Lọc các đơn hàng có trạng thái đã hủy

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Tham khảo thêm [Cấu hình phạm vi dữ liệu](/interface-builder/blocks/block-settings/data-scope)

### Cấu hình quy tắc Sắp xếp

Như hình: Sắp xếp đảo ngược theo số tiền đơn hàng

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Tham khảo thêm [Cấu hình quy tắc Sắp xếp](/interface-builder/blocks/block-settings/sorting-rule)

## Cấu hình Field

### Field bảng hiện tại

> **Lưu ý**: Các Field trong bảng kế thừa (tức là Field bảng cha) sẽ tự động hợp nhất hiển thị trong danh sách Field hiện tại.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Field bảng quan hệ

> **Lưu ý**: Hỗ trợ hiển thị Field bảng quan hệ (hiện chỉ hỗ trợ quan hệ một-với-một).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Cấu hình Field danh sách có thể tham khảo [Field trong Chi tiết](/interface-builder/fields/generic/detail-form-item)

## Cấu hình Action

### Action toàn cục

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Bộ lọc](/interface-builder/actions/types/filter)
- [Thêm mới](/interface-builder/actions/types/add-new)
- [Xóa](/interface-builder/actions/types/delete)
- [Làm mới](/interface-builder/actions/types/refresh)
- [Nhập](/interface-builder/actions/types/import)
- [Xuất](/interface-builder/actions/types/export)
- [In mẫu](/template-print/index)
- [Cập nhật hàng loạt](/interface-builder/actions/types/bulk-update)
- [Xuất tệp đính kèm](/interface-builder/actions/types/export-attachments)
- [Kích hoạt Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)

### Action dòng

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)


- [Chỉnh sửa](/interface-builder/actions/types/edit)
- [Xóa](/interface-builder/actions/types/delete)
- [Liên kết](/interface-builder/actions/types/link)
- [Popup](/interface-builder/actions/types/pop-up)
- [Cập nhật bản ghi](/interface-builder/actions/types/update-record)
- [In mẫu](/template-print/index)
- [Kích hoạt Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)
