---
pkg: "@nocobase/plugin-ui-templates"
title: "UI Template"
description: "UI Template trong xây dựng giao diện: mẫu bố cục, mẫu trang được thiết lập sẵn, tạo nhanh giao diện chuẩn, hỗ trợ mở rộng mẫu tùy chỉnh."
keywords: "UI Template, mẫu bố cục, mẫu trang, mẫu giao diện, xây dựng giao diện, NocoBase"
---
# UI Template

## Giới thiệu

Mẫu giao diện được sử dụng để tái sử dụng cấu hình trong xây dựng giao diện, giảm việc xây dựng lặp lại, và giữ đồng bộ cập nhật cấu hình ở nhiều nơi khi cần.

Các loại mẫu được hỗ trợ hiện tại bao gồm:

- Mẫu Block: Tái sử dụng cấu hình toàn bộ Block
- Mẫu Field: Tái sử dụng cấu hình "khu vực Field" của Block Form/Chi tiết
- Mẫu Popup: Tái sử dụng cấu hình Popup được kích hoạt bởi Action/Field

## Khái niệm cốt lõi

### Tham chiếu và sao chép

Khi sử dụng mẫu thường có hai cách:

- `Tham chiếu`: Nhiều nơi cùng chia sẻ một cấu hình mẫu; sửa đổi mẫu hoặc bất kỳ nơi tham chiếu nào, các nơi tham chiếu khác sẽ đồng bộ cập nhật.
- `Sao chép`: Sao chép thành cấu hình độc lập; sau đó không ảnh hưởng lẫn nhau.

### Lưu thành mẫu

Khi một Block/Popup đã được cấu hình xong, bạn có thể sử dụng `Lưu thành mẫu` trong menu cài đặt của nó, và chọn cách lưu:

- `Chuyển ... hiện tại thành mẫu`: Sau khi lưu, vị trí hiện tại sẽ chuyển thành dạng tham chiếu mẫu này.
- `Sao chép ... hiện tại thành mẫu`: Chỉ tạo mẫu, vị trí hiện tại giữ nguyên.

## Mẫu Block

### Lưu Block thành mẫu

1) Mở menu cài đặt Block mục tiêu, nhấp `Lưu thành mẫu`
2) Điền `Tên mẫu` / `Mô tả mẫu`, và chọn chế độ lưu:
   - `Chuyển Block hiện tại thành mẫu`: Sau khi lưu, vị trí hiện tại sẽ được thay thế bằng Block `Mẫu Block` (tức là tham chiếu mẫu này)
   - `Sao chép Block hiện tại thành mẫu`: Chỉ tạo mẫu, Block hiện tại giữ nguyên

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Sử dụng mẫu Block

1) Thêm Block → "Block khác" → `Mẫu Block`
2) Trong cấu hình chọn:
   - `Mẫu`: Chọn một mẫu
   - `Chế độ`: `Tham chiếu` hoặc `Sao chép`

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Chuyển tham chiếu thành sao chép

Khi Block đang tham chiếu mẫu, bạn có thể sử dụng `Chuyển tham chiếu thành sao chép` trong menu cài đặt Block, để chuyển Block hiện tại thành Block thông thường (ngắt tham chiếu), việc sửa đổi sau này không ảnh hưởng lẫn nhau.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Lưu ý

- Khi tạo Block từ mẫu sẽ tạo lại UID của Block và các nút con, một số cấu hình phụ thuộc vào UID có thể cần được cấu hình lại.

## Mẫu Field

Mẫu Field được sử dụng để tái sử dụng cấu hình khu vực Field (lựa chọn Field, bố cục và cấu hình Field) trong **Block Form** và **Block Chi tiết**, tránh việc thêm lặp lại Field trong nhiều trang/Block.

> Mẫu Field chỉ tác động đến "khu vực Field", không thay thế toàn bộ Block. Nếu muốn tái sử dụng toàn bộ Block, vui lòng sử dụng mẫu Block ở trên.

### Sử dụng mẫu Field trong Block Form/Chi tiết

1) Vào chế độ cấu hình, mở menu "Field" trong Block Form hoặc Block Chi tiết
2) Chọn `Mẫu Field`
3) Chọn một mẫu, và chọn chế độ: `Tham chiếu` hoặc `Sao chép`

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Nhắc ghi đè

Khi Block đã tồn tại Field, sử dụng chế độ **Tham chiếu** thường sẽ nhắc xác nhận (vì Field tham chiếu sẽ thay thế khu vực Field hiện tại).

### Chuyển Field tham chiếu thành sao chép

Khi Block đang tham chiếu mẫu Field, bạn có thể sử dụng `Chuyển Field tham chiếu thành sao chép` trong menu cài đặt Block, để chuyển khu vực Field hiện tại thành cấu hình độc lập (ngắt tham chiếu), việc sửa đổi sau này không ảnh hưởng lẫn nhau.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Lưu ý

- Mẫu Field chỉ áp dụng cho **Block Form** và **Block Chi tiết**.
- Khi mẫu và bảng dữ liệu liên kết của Block hiện tại không nhất quán, mẫu sẽ hiển thị không khả dụng trong bộ chọn và nhắc lý do.
- Nếu muốn "điều chỉnh cá nhân hóa" Field trong Block hiện tại, khuyến nghị sử dụng trực tiếp chế độ `Sao chép`, hoặc thực hiện trước "Chuyển Field tham chiếu thành sao chép".

## Mẫu Popup

Mẫu Popup được sử dụng để tái sử dụng một bộ giao diện Popup và logic tương tác. Về cách mở Popup, kích thước và các cấu hình thông thường khác, tham khảo [Chỉnh sửa Popup](/interface-builder/actions/action-settings/edit-popup).

### Lưu Popup thành mẫu

1) Mở menu cài đặt nút/Field có thể kích hoạt Popup, nhấp `Lưu thành mẫu`
2) Điền tên/mô tả mẫu, và chọn chế độ lưu:
   - `Chuyển Popup hiện tại thành mẫu`: Sau khi lưu, Popup hiện tại sẽ chuyển thành tham chiếu mẫu này
   - `Sao chép Popup hiện tại thành mẫu`: Chỉ tạo mẫu, Popup hiện tại giữ nguyên

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Sử dụng mẫu trong cấu hình Popup

1) Mở cấu hình Popup của nút/Field
2) Chọn mẫu trong `Mẫu Popup` để tái sử dụng

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Điều kiện sử dụng (phạm vi mẫu khả dụng)

Mẫu Popup có liên quan đến tình huống Action kích hoạt Popup. Bộ chọn sẽ tự động lọc/vô hiệu hóa các mẫu không tương thích dựa trên tình huống hiện tại (sẽ nhắc lý do khi không thỏa mãn điều kiện).

| Loại Action hiện tại | Mẫu Popup có thể sử dụng |
| --- | --- |
| **Action Collection** | Mẫu Popup được tạo bởi Action Collection của cùng Collection |
| **Action Record không liên kết** | Mẫu Popup được tạo bởi Action Collection hoặc Action Record không liên kết của cùng Collection |
| **Action Record liên kết** | Mẫu Popup được tạo bởi Action Collection hoặc Action Record không liên kết của cùng Collection; hoặc mẫu Popup được tạo bởi Action Record liên kết của cùng Field liên kết |

### Popup dữ liệu quan hệ

Mẫu Popup được kích hoạt bởi dữ liệu quan hệ (Field liên kết) có quy tắc khớp đặc biệt:

#### Khớp nghiêm ngặt của mẫu Popup quan hệ

Khi mẫu Popup được tạo từ **Action Record liên kết** (mẫu có `associationName`), mẫu này chỉ có thể được sử dụng bởi Action/Field có **cùng Field liên kết hoàn toàn**.

Ví dụ: Mẫu Popup được tạo trên Field liên kết `Đơn hàng.Khách hàng`, chỉ có thể được sử dụng bởi Action của Field liên kết `Đơn hàng.Khách hàng` khác, không thể được sử dụng bởi Field liên kết `Đơn hàng.Người giới thiệu` (ngay cả khi bảng dữ liệu mục tiêu của cả hai đều là `Khách hàng`).

Đó là vì biến và cấu hình bên trong mẫu Popup quan hệ phụ thuộc vào ngữ cảnh quan hệ liên kết cụ thể.

#### Action quan hệ tái sử dụng mẫu bảng dữ liệu mục tiêu

Field/Action liên kết có thể tái sử dụng **mẫu Popup không quan hệ của bảng dữ liệu mục tiêu** (mẫu được tạo bởi Action Collection hoặc Action Record không liên kết), miễn là bảng dữ liệu nhất quán.

Ví dụ: Field liên kết `Đơn hàng.Khách hàng` có thể sử dụng mẫu Popup của bảng dữ liệu `Khách hàng`. Cách này phù hợp để chia sẻ cùng một bộ cấu hình Popup giữa nhiều Field liên kết (ví dụ Popup chi tiết khách hàng thống nhất).

### Chuyển tham chiếu thành sao chép

Khi Popup đang tham chiếu mẫu, bạn có thể sử dụng `Chuyển tham chiếu thành sao chép` trong menu cài đặt, để chuyển Popup hiện tại thành cấu hình độc lập (ngắt tham chiếu), việc sửa đổi sau này không ảnh hưởng lẫn nhau.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Quản lý mẫu

Trong Cài đặt hệ thống → `UI Template` có thể xem và quản lý tất cả các mẫu:

- **Mẫu Block (v2)**: Quản lý mẫu Block
- **Mẫu Popup (v2)**: Quản lý mẫu Popup

> Mẫu Field xuất phát từ mẫu Block, được quản lý trong mẫu Block.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Các thao tác được hỗ trợ: xem, lọc, chỉnh sửa, xóa.

> **Lưu ý**: Nếu mẫu đang được tham chiếu, không thể xóa trực tiếp. Vui lòng sử dụng `Chuyển tham chiếu thành sao chép` ở vị trí tham chiếu mẫu này để ngắt tham chiếu trước, sau đó xóa mẫu.
