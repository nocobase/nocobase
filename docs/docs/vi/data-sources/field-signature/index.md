---
pkg: "@nocobase/plugin-field-signature"
---

# Trường dữ liệu bảng dữ liệu: Chữ ký viết tay

## Giới thiệu

Trường chữ ký viết tay cho phép người dùng viết chữ ký bằng chuột hoặc màn hình cảm ứng trên canvas. Sau khi lưu, hình ảnh chữ ký sẽ được ghi vào **bảng dữ liệu tệp** đã chọn và sử dụng lại quy trình tải lên và lưu trữ tệp do **trình quản lý tệp** cung cấp.

## Cài đặt

1. Đảm bảo môi trường hiện tại là **bản chuyên nghiệp trở lên** và giấy phép còn hiệu lực.
2. Mở **trình quản lý plugin**, tìm **Trường dữ liệu bảng dữ liệu: Chữ ký viết tay** (`@nocobase/plugin-field-signature`) và bật plugin.
3. Đảm bảo đã bật **trình quản lý tệp** (`@nocobase/plugin-file-manager`). Trường chữ ký viết tay phụ thuộc vào khả năng cung cấp bảng dữ liệu tệp, tải lên và lưu trữ của plugin này; nếu chưa bật, hình ảnh chữ ký sẽ không thể được lưu.

## Hướng dẫn sử dụng

### Thêm trường

Trong **nguồn dữ liệu** → chọn bảng dữ liệu → **cấu hình trường** → **thêm trường** → chọn **chữ ký viết tay** trong nhóm đa phương tiện.

### Cấu hình trường

- **Bảng dữ liệu tệp**: bắt buộc; hãy chọn một bảng dữ liệu tệp dùng để lưu tệp (ví dụ: `attachments`), hình ảnh chữ ký sẽ được lưu tại đây.
- Cấu hình lưu trữ và quy tắc tải lên thực tế được sử dụng cho hình ảnh chữ ký sẽ do chính bảng dữ liệu tệp đã chọn quyết định.

### Cấu hình giao diện

- Sau khi thêm trường chữ ký viết tay vào biểu mẫu, bạn có thể điều chỉnh **cài đặt chữ ký** trong cấu hình giao diện của trường, bao gồm màu nét bút, màu nền, chiều rộng canvas chữ ký, chiều cao canvas chữ ký, chiều rộng hình thu nhỏ và chiều cao hình thu nhỏ.
- Trong trường hợp hiển thị chỉ đọc, bạn cũng có thể điều chỉnh chiều rộng và chiều cao của hình thu nhỏ chữ ký để kiểm soát kích thước hiển thị của hình ảnh chữ ký.
### Thao tác trên giao diện

- Nhấp vào khu vực trường để mở canvas chữ ký. Sau khi viết xong, xác nhận để tải lên và liên kết với bản ghi tệp tương ứng.
- Trên các thiết bị có màn hình nhỏ, có thể sử dụng giao diện chữ ký ở chế độ ngang/toàn màn hình để thuận tiện cho việc viết.
![20260709232226](https://static-docs.nocobase.com/20260709232226.png)
