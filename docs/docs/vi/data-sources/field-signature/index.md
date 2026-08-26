---
pkg: "@nocobase/plugin-field-signature"
---

# Field: Handwritten Signature

## Giới thiệu

Field handwritten signature cho phép bạn ký tên trên canvas bằng chuột hoặc màn hình cảm ứng. Sau khi lưu, ảnh chữ ký sẽ được ghi vào **File Collection** đã chọn, và sử dụng quy trình upload và lưu trữ file được cung cấp bởi **File Manager**.

## Cài đặt

1. Xác nhận môi trường hiện tại là **Pro Edition trở lên**, và license còn hiệu lực.
2. Mở **Plugin Manager**, tìm **Field: Handwritten Signature** (`@nocobase/plugin-field-signature`) và kích hoạt.
3. Đảm bảo đã kích hoạt **File Manager** (`@nocobase/plugin-file-manager`). Field handwritten signature phụ thuộc vào nó để cung cấp khả năng file collection, upload và storage; nếu chưa kích hoạt sẽ không thể lưu ảnh chữ ký.

## Hướng dẫn sử dụng

### Thêm Field

Vào **Data Source** → Chọn Collection → **Configure fields** → **Add field** → Trong nhóm Media chọn **Handwritten Signature**.

### Cấu hình Field

- **File Collection**: Bắt buộc; vui lòng chọn một file collection để lưu file (ví dụ `attachments`), ảnh chữ ký sẽ được lưu vào đây.
- Cấu hình storage và quy tắc upload thực tế của ảnh chữ ký được quyết định bởi chính file collection được chọn.

### Cấu hình giao diện

- Sau khi thêm field handwritten signature vào form, có thể điều chỉnh **Signature settings** trong cấu hình giao diện của field, bao gồm màu nét, màu nền, chiều rộng canvas chữ ký, chiều cao canvas chữ ký, cũng như chiều rộng thumbnail và chiều cao thumbnail.
- Trong các tình huống hiển thị read-only, còn có thể điều chỉnh chiều rộng và chiều cao của thumbnail chữ ký, để kiểm soát kích thước hiển thị của ảnh chữ ký.

### Thao tác giao diện

- Nhấn vào vùng field để mở canvas chữ ký, sau khi viết xong xác nhận là có thể upload và liên kết với bản ghi file tương ứng.
- Trên thiết bị màn hình nhỏ có thể sử dụng giao diện chữ ký kiểu landscape/fullscreen, thuận tiện cho việc viết.
