---
pkg: "@nocobase/plugin-block-reference"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Khối Tham Chiếu

## Giới thiệu
Khối Tham Chiếu cho phép bạn hiển thị trực tiếp một khối đã được cấu hình sẵn trên trang hiện tại bằng cách điền UID của khối mục tiêu, mà không cần phải cấu hình lại từ đầu.

## Kích hoạt plugin
Plugin này được tích hợp sẵn nhưng mặc định chưa được kích hoạt.
Mở "Quản lý plugin" → tìm "Khối: Tham chiếu" → nhấp vào "Kích hoạt".

![Kích hoạt khối Tham chiếu trong Trình quản lý plugin](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Cách thêm
1) Thêm khối → nhóm "Các khối khác" → chọn "Khối Tham chiếu".
2) Trong "Cấu hình Khối Tham chiếu", điền các thông tin sau:
   - `Block UID`: UID của khối mục tiêu
   - `Chế độ tham chiếu`: chọn `Tham chiếu` hoặc `Sao chép`

![Minh họa thêm và cấu hình khối Tham chiếu](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Cách lấy Block UID
- Mở menu cài đặt của khối mục tiêu, sau đó nhấp vào `Sao chép UID` để sao chép UID của khối đó.

![Ví dụ sao chép UID khối](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Chế độ và hành vi
- `Tham chiếu` (mặc định)
  - Chia sẻ cùng một cấu hình với khối gốc; mọi chỉnh sửa trên khối gốc hoặc từ bất kỳ vị trí tham chiếu nào cũng sẽ được cập nhật đồng bộ trên tất cả các tham chiếu.

- `Sao chép`
  - Tạo ra một khối độc lập giống hệt khối gốc tại thời điểm sao chép; các thay đổi sau đó sẽ không ảnh hưởng lẫn nhau và không đồng bộ.

## Cấu hình
- Đối với khối Tham chiếu:
  - `Cấu hình Khối Tham chiếu`: dùng để chỉ định Block UID của khối mục tiêu và chọn chế độ "Tham chiếu/Sao chép";
  - Đồng thời, bạn sẽ thấy toàn bộ cài đặt của "khối được tham chiếu" (tương đương với việc cấu hình trực tiếp trên khối gốc).

![Giao diện cấu hình khối Tham chiếu](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Đối với khối Sao chép:
  - Khối được tạo ra sau khi sao chép sẽ có cùng loại với khối gốc và chỉ chứa các cài đặt riêng của khối đó;
  - Nó sẽ không còn chứa `Cấu hình Khối Tham chiếu`.

## Trạng thái lỗi và dự phòng
- Khi khối mục tiêu bị thiếu/không hợp lệ: hệ thống sẽ hiển thị thông báo trạng thái lỗi. Bạn có thể cấu hình lại trong cài đặt của khối Tham chiếu (Cấu hình Khối Tham chiếu → Block UID), sau đó lưu lại để khôi phục hiển thị.

![Trạng thái lỗi khi khối mục tiêu không hợp lệ](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Lưu ý và giới hạn
- Đây là tính năng thử nghiệm, vui lòng thận trọng khi sử dụng trong môi trường sản xuất.
- Khi sao chép khối, một số cấu hình phụ thuộc vào Block UID mục tiêu có thể cần được cấu hình lại.
- Tất cả các cấu hình của khối tham chiếu sẽ được đồng bộ tự động, bao gồm cả các cấu hình như "phạm vi dữ liệu". Tuy nhiên, khối tham chiếu có thể có [cấu hình luồng sự kiện](/interface-builder/event-flow/) riêng. Do đó, bạn có thể gián tiếp đạt được các cấu hình phạm vi dữ liệu hoặc các cấu hình liên quan khác nhau cho mỗi tham chiếu thông qua luồng sự kiện và các thao tác JavaScript tùy chỉnh.