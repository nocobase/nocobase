---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/ui-templates).
:::

# Mẫu giao diện (UI Templates)

## Giới thiệu

Mẫu giao diện được sử dụng để tái sử dụng các cấu hình trong quá trình xây dựng giao diện, giúp giảm bớt việc thiết lập lặp đi lặp lại và giữ cho các cấu hình ở nhiều nơi được cập nhật đồng bộ khi cần thiết.

Hiện tại, các loại mẫu được hỗ trợ bao gồm:

- **Mẫu khối (Block Template)**: Tái sử dụng toàn bộ cấu hình của một khối.
- **Mẫu trường (Field Template)**: Tái sử dụng cấu hình "vùng trường" trong các khối biểu mẫu hoặc khối chi tiết.
- **Mẫu cửa sổ bật lên (Popup Template)**: Tái sử dụng cấu hình cửa sổ bật lên được kích hoạt bởi các thao tác hoặc trường dữ liệu.

## Khái niệm cốt lõi

### Tham chiếu và Sao chép

Thông thường có hai cách để sử dụng mẫu:

- **Tham chiếu (Reference)**: Nhiều nơi chia sẻ cùng một cấu hình mẫu; khi chỉnh sửa mẫu hoặc bất kỳ điểm tham chiếu nào, các điểm tham chiếu khác sẽ được cập nhật đồng bộ.
- **Sao chép (Duplicate)**: Sao chép thành một cấu hình độc lập; các thay đổi sau đó sẽ không ảnh hưởng lẫn nhau.

### Lưu thành mẫu

Khi một khối hoặc cửa sổ bật lên đã được cấu hình xong, bạn có thể sử dụng tùy chọn `Lưu thành mẫu` trong menu cài đặt của nó và chọn phương thức lưu:

- **Chuyển đổi ... hiện tại thành mẫu**: Sau khi lưu, vị trí hiện tại sẽ chuyển sang dạng tham chiếu đến mẫu đó.
- **Sao chép ... hiện tại thành mẫu**: Chỉ tạo mẫu mới, vị trí hiện tại vẫn giữ nguyên cấu hình độc lập.

## Mẫu khối

### Lưu khối thành mẫu

1) Mở menu cài đặt của khối mục tiêu, nhấp vào `Lưu thành mẫu`.
2) Điền `Tên mẫu` / `Mô tả mẫu` và chọn chế độ lưu:
   - **Chuyển đổi khối hiện tại thành mẫu**: Sau khi lưu, khối hiện tại sẽ được thay thế bằng khối `Mẫu khối` (tức là tham chiếu đến mẫu đó).
   - **Sao chép khối hiện tại thành mẫu**: Chỉ tạo mẫu, khối hiện tại không thay đổi.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Sử dụng mẫu khối

1) Thêm khối → "Khối khác" → `Mẫu khối`.
2) Trong cấu hình, chọn:
   - **Mẫu**: Chọn một mẫu có sẵn.
   - **Chế độ**: `Tham chiếu` hoặc `Sao chép`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Chuyển đổi tham chiếu thành sao chép

Khi một khối đang tham chiếu đến một mẫu, bạn có thể sử dụng tùy chọn `Chuyển đổi tham chiếu thành sao chép` trong menu cài đặt khối để biến khối hiện tại thành một khối thông thường (ngắt kết nối tham chiếu), các chỉnh sửa sau này sẽ không ảnh hưởng đến mẫu.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Lưu ý

- Chế độ `Sao chép` sẽ tạo lại UID cho khối và các nút con, một số cấu hình phụ thuộc vào UID có thể cần phải thiết lập lại.

## Mẫu trường

Mẫu trường được sử dụng để tái sử dụng cấu hình vùng trường (lựa chọn trường, bố cục và cài đặt trường) trong **khối biểu mẫu** và **khối chi tiết**, tránh việc thêm trường lặp lại trên nhiều trang hoặc khối.

> Mẫu trường chỉ tác động đến "vùng trường", không thay thế toàn bộ khối. Để tái sử dụng toàn bộ khối, vui lòng sử dụng Mẫu khối đã nêu ở trên.

### Sử dụng mẫu trường trong khối biểu mẫu/chi tiết

1) Vào chế độ cấu hình, mở menu "Trường" trong khối biểu mẫu hoặc khối chi tiết.
2) Chọn `Mẫu trường`.
3) Chọn một mẫu và chọn chế độ: `Tham chiếu` hoặc `Sao chép`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Thông báo ghi đè

Khi khối đã tồn tại các trường, việc sử dụng chế độ **Tham chiếu** thường sẽ hiển thị thông báo xác nhận (vì các trường tham chiếu sẽ thay thế vùng trường hiện tại).

### Chuyển đổi trường tham chiếu thành sao chép

Khi một khối đang tham chiếu đến một mẫu trường, bạn có thể sử dụng tùy chọn `Chuyển đổi trường tham chiếu thành sao chép` trong menu cài đặt khối để biến vùng trường hiện tại thành cấu hình độc lập (ngắt kết nối tham chiếu).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Lưu ý

- Mẫu trường chỉ áp dụng cho **khối biểu mẫu** và **khối chi tiết**.
- Khi bảng dữ liệu liên kết của mẫu và khối hiện tại không khớp nhau, mẫu sẽ hiển thị là không khả dụng trong bộ chọn kèm theo lý do.
- Nếu bạn muốn thực hiện "điều chỉnh cá nhân hóa" cho các trường trong khối hiện tại, nên sử dụng trực tiếp chế độ `Sao chép` hoặc thực hiện "Chuyển đổi trường tham chiếu thành sao chép" trước.

## Mẫu cửa sổ bật lên

Mẫu cửa sổ bật lên được sử dụng để tái sử dụng một bộ giao diện cửa sổ bật lên và logic tương tác. Về các cấu hình thông thường như cách mở, kích thước cửa sổ, vui lòng tham khảo [Chỉnh sửa cửa sổ bật lên](/interface-builder/actions/action-settings/edit-popup).

### Lưu cửa sổ bật lên thành mẫu

1) Mở menu cài đặt của nút hoặc trường có thể kích hoạt cửa sổ bật lên, nhấp vào `Lưu thành mẫu`.
2) Điền tên/mô tả mẫu và chọn chế độ lưu:
   - **Chuyển đổi cửa sổ hiện tại thành mẫu**: Sau khi lưu, cửa sổ hiện tại sẽ chuyển sang tham chiếu mẫu này.
   - **Sao chép cửa sổ hiện tại thành mẫu**: Chỉ tạo mẫu, cửa sổ hiện tại giữ nguyên.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Sử dụng mẫu trong cấu hình cửa sổ bật lên

1) Mở cấu hình cửa sổ bật lên của nút hoặc trường.
2) Chọn mẫu trong mục `Mẫu cửa sổ bật lên` để tái sử dụng.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Điều kiện sử dụng (Phạm vi khả dụng của mẫu)

Mẫu cửa sổ bật lên liên quan đến ngữ cảnh thao tác kích hoạt nó. Bộ chọn sẽ tự động lọc hoặc vô hiệu hóa các mẫu không tương thích dựa trên ngữ cảnh hiện tại (lý do sẽ được hiển thị nếu không đáp ứng điều kiện).

| Loại thao tác hiện tại | Mẫu cửa sổ bật lên có thể sử dụng |
| --- | --- |
| **Thao tác Bộ sưu tập** | Mẫu được tạo từ thao tác Bộ sưu tập của cùng một Bộ sưu tập |
| **Thao tác Bản ghi không liên kết** | Mẫu được tạo từ thao tác Bộ sưu tập hoặc thao tác Bản ghi không liên kết của cùng một Bộ sưu tập |
| **Thao tác Bản ghi liên kết** | Mẫu được tạo từ thao tác Bộ sưu tập hoặc thao tác Bản ghi không liên kết của cùng một Bộ sưu tập; hoặc mẫu được tạo từ thao tác Bản ghi liên kết của cùng một trường liên kết |

### Cửa sổ bật lên dữ liệu quan hệ

Mẫu cửa sổ bật lên được kích hoạt bởi dữ liệu quan hệ (trường liên kết) có các quy tắc khớp đặc biệt:

#### Khớp chính xác cho mẫu cửa sổ liên kết

Khi một mẫu cửa sổ bật lên được tạo từ một **Thao tác Bản ghi liên kết** (mẫu có chứa `associationName`), mẫu đó chỉ có thể được sử dụng bởi các thao tác hoặc trường có **cùng một trường liên kết chính xác**.

Ví dụ: Một mẫu cửa sổ bật lên được tạo trên trường liên kết `Đơn hàng.Khách hàng` chỉ có thể được sử dụng bởi các thao tác của trường liên kết `Đơn hàng.Khách hàng` khác. Nó không thể được sử dụng bởi trường liên kết `Đơn hàng.Người giới thiệu` (ngay cả khi cả hai đều hướng tới cùng một bảng dữ liệu `Khách hàng`).

Điều này là do các biến và cấu hình bên trong mẫu cửa sổ liên kết phụ thuộc vào ngữ cảnh quan hệ cụ thể.

#### Thao tác liên kết tái sử dụng mẫu của bảng dữ liệu mục tiêu

Các trường hoặc thao tác liên kết có thể tái sử dụng **mẫu cửa sổ bật lên không liên kết của bảng dữ liệu mục tiêu** (mẫu được tạo bởi thao tác Bộ sưu tập hoặc thao tác Bản ghi không liên kết), miễn là bảng dữ liệu khớp nhau.

Ví dụ: Trường liên kết `Đơn hàng.Khách hàng` có thể sử dụng mẫu cửa sổ bật lên của bảng dữ liệu `Khách hàng`. Cách tiếp cận này phù hợp để chia sẻ cùng một cấu hình cửa sổ bật lên giữa nhiều trường liên kết (như một cửa sổ chi tiết khách hàng thống nhất).

### Chuyển đổi tham chiếu thành sao chép

Khi một cửa sổ bật lên đang tham chiếu đến một mẫu, bạn có thể sử dụng `Chuyển đổi tham chiếu thành sao chép` trong menu cài đặt để biến cửa sổ hiện tại thành cấu hình độc lập (ngắt kết nối tham chiếu).

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Quản lý mẫu

Trong Cài đặt hệ thống → `Mẫu giao diện`, bạn có thể xem và quản lý tất cả các mẫu:

- **Mẫu khối (v2)**: Quản lý các mẫu khối.
- **Mẫu cửa sổ bật lên (v2)**: Quản lý các mẫu cửa sổ bật lên.

> Mẫu trường có nguồn gốc từ mẫu khối và được quản lý trong phần mẫu khối.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Các thao tác hỗ trợ: Xem, Lọc, Chỉnh sửa, Xóa.

> **Lưu ý**: Nếu một mẫu đang được tham chiếu, nó không thể bị xóa trực tiếp. Vui lòng sử dụng `Chuyển đổi tham chiếu thành sao chép` tại các vị trí đang tham chiếu mẫu đó để ngắt kết nối trước khi thực hiện xóa mẫu.