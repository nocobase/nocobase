---
title: "Block Form"
description: "Block Form: hiển thị và chỉnh sửa một bản ghi dưới dạng Form, hỗ trợ chế độ thêm, chỉnh sửa, xem, có thể cấu hình bố cục Field và xác thực."
keywords: "Block Form, FormBlock, Form, thêm chỉnh sửa, bố cục Field, xây dựng giao diện, NocoBase"
---

# Block Form

## Giới thiệu

Block Form là Block quan trọng được sử dụng để xây dựng giao diện nhập và chỉnh sửa dữ liệu. Nó có tính tùy biến cao, dựa trên mô hình dữ liệu để sử dụng component tương ứng hiển thị các Field cần thiết. Thông qua các event flow như quy tắc liên kết, Block Form có thể hiển thị Field một cách động. Ngoài ra, còn có thể kết hợp với Workflow để triển khai kích hoạt quy trình tự động hóa và xử lý dữ liệu, nâng cao hơn nữa hiệu quả làm việc hoặc thực hiện điều phối logic.

## Thêm Block Form

- **Form chỉnh sửa**: Dùng để sửa đổi dữ liệu hiện có.
- **Form thêm mới**: Dùng để tạo các mục dữ liệu mới.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Cấu hình Block

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Quy tắc liên kết Block

Kiểm soát hành vi của Block (như có hiển thị hay không hoặc thực thi javaScript) thông qua quy tắc liên kết.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Tham khảo thêm [Quy tắc liên kết Block](/interface-builder/blocks/block-settings/block-linkage-rule)

### Quy tắc liên kết Field

Kiểm soát hành vi Field Form thông qua quy tắc liên kết.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Tham khảo thêm [Quy tắc liên kết Field](/interface-builder/blocks/block-settings/field-linkage-rule)

### Bố cục

Block Form hỗ trợ hai phương thức bố cục, được thiết lập thông qua thuộc tính `layout`:

- **horizontal** (bố cục ngang): Bố cục này làm cho nội dung nhãn được hiển thị trên cùng một dòng, tiết kiệm không gian dọc, phù hợp với Form đơn giản hoặc tình huống có ít thông tin.
- **vertical** (bố cục dọc) (mặc định): Nhãn nằm phía trên Field, bố cục này làm Form dễ đọc và điền hơn, đặc biệt phù hợp với Form chứa nhiều Field hoặc các mục nhập phức tạp.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Cấu hình Field

### Field bảng hiện tại

> **Lưu ý**: Các Field trong bảng kế thừa (tức là Field bảng cha) sẽ tự động hợp nhất hiển thị trong danh sách Field hiện tại.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Field bảng quan hệ

> Field bảng quan hệ chỉ đọc trong Form, thường được sử dụng kết hợp với Field quan hệ, có thể hiển thị nhiều giá trị Field của dữ liệu quan hệ.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Hiện chỉ hỗ trợ quan hệ một-với-một (như belongsTo / hasOne v.v.).
- Nó thường được sử dụng kết hợp với Field quan hệ (dùng để chọn bản ghi liên kết): Component Field quan hệ chịu trách nhiệm chọn/thay đổi bản ghi liên kết, Field bảng liên kết chịu trách nhiệm hiển thị thêm thông tin của bản ghi đó (chỉ đọc).

**Ví dụ**: Sau khi chọn "Người phụ trách", hiển thị trong Form số điện thoại, email v.v. của người phụ trách đó.

> Trong Form chỉnh sửa nếu không cấu hình Field quan hệ "Người phụ trách", thông tin liên kết tương ứng vẫn có thể được hiển thị, sau khi cấu hình Field quan hệ "Người phụ trách", khi thay đổi người phụ trách, thông tin liên kết tương ứng sẽ được cập nhật thành bản ghi tương ứng.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Field khác

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Viết javaScript có thể tùy chỉnh nội dung hiển thị, triển khai hiển thị nội dung phức tạp.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Mẫu Field

Mẫu Field được sử dụng để tái sử dụng cấu hình khu vực Field trong Block Form. Chi tiết xem [Mẫu Field](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Cấu hình Action

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Gửi](/interface-builder/actions/types/submit)
- [Kích hoạt Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)
