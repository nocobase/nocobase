---
title: "Block Table"
description: "Block Table: hiển thị dữ liệu nguồn dạng bảng, hỗ trợ phân trang, sắp xếp, lọc, chỉnh sửa inline, cấu hình nút Action."
keywords: "Block Table, TableBlock, Table dữ liệu, phân trang sắp xếp, chỉnh sửa inline, xây dựng giao diện, NocoBase"
---

# Block Table

## Giới thiệu


Block Table là một trong những Data block cốt lõi tích hợp sẵn của **NocoBase**, chủ yếu được sử dụng để hiển thị và quản lý dữ liệu có cấu trúc dưới dạng Table. Nó cung cấp các tùy chọn cấu hình linh hoạt, bạn có thể tùy chỉnh các cột Table, độ rộng cột, quy tắc sắp xếp và phạm vi dữ liệu v.v. theo nhu cầu, đảm bảo dữ liệu hiển thị trên Table đáp ứng yêu cầu nghiệp vụ cụ thể.

#### Tính năng chính:
- **Cấu hình cột linh hoạt**: Có thể tùy chỉnh các cột Table và độ rộng cột để phù hợp với các nhu cầu hiển thị dữ liệu khác nhau.
- **Quy tắc sắp xếp**: Hỗ trợ sắp xếp dữ liệu Table, bạn có thể sắp xếp dữ liệu theo các Field khác nhau theo thứ tự tăng dần hoặc giảm dần.
- **Cấu hình phạm vi dữ liệu**: Bằng cách thiết lập phạm vi dữ liệu, bạn có thể kiểm soát phạm vi dữ liệu hiển thị, tránh dữ liệu không liên quan gây nhiễu.
- **Cấu hình Action**: Block Table tích hợp sẵn nhiều tùy chọn Action, bạn có thể dễ dàng cấu hình các thao tác như lọc, tạo mới, chỉnh sửa, xóa để quản lý dữ liệu nhanh chóng.
- **Chỉnh sửa nhanh**: Hỗ trợ chỉnh sửa dữ liệu trực tiếp trong Table, đơn giản hóa quy trình thao tác, nâng cao hiệu quả làm việc.

## Cấu hình Block

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Quy tắc liên kết Block

Kiểm soát hành vi của Block (như có hiển thị hay không hoặc thực thi javaScript) thông qua quy tắc liên kết.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Tham khảo thêm [Quy tắc liên kết](/interface-builder/linkage-rule)

### Cấu hình phạm vi dữ liệu

Ví dụ: Mặc định lọc các đơn hàng có "Trạng thái" là đã thanh toán.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Tham khảo thêm [Cấu hình phạm vi dữ liệu](/interface-builder/blocks/block-settings/data-scope)

### Cấu hình quy tắc Sắp xếp

Ví dụ: Hiển thị ngày đặt hàng theo thứ tự đảo ngược.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Tham khảo thêm [Cấu hình quy tắc Sắp xếp](/interface-builder/blocks/block-settings/sorting-rule)

### Bật chỉnh sửa nhanh

Trong cấu hình Block và cấu hình cột Table, kích hoạt "Bật chỉnh sửa nhanh", bạn có thể tùy chỉnh các cột nào có thể chỉnh sửa nhanh.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Bật bảng cây

Khi bảng dữ liệu là bảng cây, Block Table có thể chọn bật tính năng "Bật bảng cây", mặc định ở trạng thái tắt. Sau khi bật, Block sẽ hiển thị dữ liệu theo cấu trúc cây, đồng thời hỗ trợ các tùy chọn cấu hình và tính năng Action tương ứng.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Mặc định mở rộng tất cả các dòng

Khi bật bảng cây, hỗ trợ mặc định mở rộng tất cả dữ liệu con khi tải Block.
## Cấu hình Field

### Field bảng hiện tại

> **Lưu ý**: Các Field trong bảng kế thừa (tức là Field bảng cha) sẽ tự động hợp nhất hiển thị trong danh sách Field hiện tại.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Field bảng quan hệ

> **Lưu ý**: Hỗ trợ hiển thị Field bảng quan hệ (hiện chỉ hỗ trợ quan hệ một-với-một).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Cột tùy chỉnh khác

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Cấu hình Action

### Action toàn cục

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

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

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Xem](/interface-builder/actions/types/view)
- [Chỉnh sửa](/interface-builder/actions/types/edit)
- [Xóa](/interface-builder/actions/types/delete)
- [Popup](/interface-builder/actions/types/pop-up)
- [Liên kết](/interface-builder/actions/types/link)
- [Cập nhật bản ghi](/interface-builder/actions/types/update-record)
- [In mẫu](/template-print/index)
- [Kích hoạt Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)
