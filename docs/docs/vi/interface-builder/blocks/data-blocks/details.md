---
title: "Block Chi tiết"
description: "Block Chi tiết: hiển thị chi tiết một bản ghi dưới dạng chỉ đọc, hỗ trợ bố cục Field, hiển thị dữ liệu liên kết, cấu hình nút Action."
keywords: "Block Chi tiết, DetailsBlock, chi tiết dữ liệu, hiển thị chỉ đọc, xây dựng giao diện, NocoBase"
---

# Block Chi tiết

## Giới thiệu

Block Chi tiết được sử dụng để hiển thị các giá trị Field của mỗi bản ghi. Nó hỗ trợ bố cục Field linh hoạt, và tích hợp sẵn nhiều tính năng thao tác dữ liệu, thuận tiện cho bạn xem và quản lý thông tin.

## Cấu hình Block

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Quy tắc liên kết Block

Kiểm soát hành vi của Block (như có hiển thị hay không hoặc thực thi javaScript) thông qua quy tắc liên kết.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Tham khảo thêm [Quy tắc liên kết](/interface-builder/linkage-rule)

### Cấu hình phạm vi dữ liệu

Ví dụ: Chỉ hiển thị các đơn hàng đã thanh toán

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Tham khảo thêm [Cấu hình phạm vi dữ liệu](/interface-builder/blocks/block-settings/data-scope)

### Quy tắc liên kết Field

Quy tắc liên kết trong Block Chi tiết hỗ trợ thiết lập động Field hiển thị/ẩn.

Ví dụ: Khi trạng thái đơn hàng là "Hủy" thì không hiển thị số tiền.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Tham khảo thêm [Quy tắc liên kết](/interface-builder/linkage-rule)

## Cấu hình Field

### Field bảng hiện tại

> **Lưu ý**: Các Field trong bảng kế thừa (tức là Field bảng cha) sẽ tự động hợp nhất hiển thị trong danh sách Field hiện tại.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Field bảng quan hệ

> **Lưu ý**: Hỗ trợ hiển thị Field bảng quan hệ (hiện chỉ hỗ trợ quan hệ một-với-một).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)


### Field khác
- JS Field
- JS Item
- Đường phân cách
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Mẹo**: Bạn có thể viết JavaScript để tùy chỉnh nội dung hiển thị, từ đó hiển thị nội dung phức tạp hơn.
> Ví dụ, có thể render hiệu ứng hiển thị khác nhau dựa trên các loại dữ liệu, điều kiện hoặc logic khác nhau.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)


### Mẫu Field

Mẫu Field được sử dụng để tái sử dụng cấu hình khu vực Field trong Block Chi tiết. Chi tiết xem [Mẫu Field](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)


## Cấu hình Action

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Chỉnh sửa](/interface-builder/actions/types/edit)
- [Xóa](/interface-builder/actions/types/delete)
- [Liên kết](/interface-builder/actions/types/link)
- [Popup](/interface-builder/actions/types/pop-up)
- [Cập nhật bản ghi](/interface-builder/actions/types/update-record)
- [Kích hoạt Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)
