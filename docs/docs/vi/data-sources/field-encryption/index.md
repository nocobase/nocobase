---
pkg: "@nocobase/plugin-field-encryption"
title: "Field Encryption"
description: "Mã hóa lưu trữ dữ liệu nghiệp vụ riêng tư (số điện thoại, email, số thẻ, v.v.), lưu vào database dưới dạng ciphertext, bảo vệ thông tin nhạy cảm."
keywords: "Field encryption,Encryption,Sensitive data,Ciphertext storage,NocoBase"
---
# Encryption

## Giới thiệu

Một số dữ liệu nghiệp vụ riêng tư, như số điện thoại khách hàng, địa chỉ email, số thẻ, v.v., có thể được mã hóa, sau khi mã hóa, sẽ được lưu vào database dưới dạng ciphertext.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Cách thức mã hóa

:::warning
Plugin sẽ tự động sinh ra một `application key`, key này được lưu trong thư mục `/storage/apps/main/encryption-field-keys`.

Tên file của `application key` là Key ID, phần mở rộng là `.key`, vui lòng không tùy ý sửa tên file.

Vui lòng giữ gìn file `application key` cẩn thận, nếu mất file `application key`, dữ liệu được mã hóa sẽ không thể giải mã.

Nếu là sub-app kích hoạt plugin, thư mục lưu trữ key mặc định là `/storage/apps/${tên sub-app}/encryption-field-keys`
:::

### Nguyên lý hoạt động

Sử dụng phương pháp mã hóa envelope

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Quy trình tạo key
1. Lần đầu tiên tạo field encryption, hệ thống sẽ tự động sinh ra một `application key` 32 bit, lưu vào thư mục storage mặc định ở format base64 encoding.
2. Mỗi lần tạo field encryption mới, sẽ sinh ngẫu nhiên `field key` 32 bit cho field này, sau đó sử dụng `application key` và `field encryption vector` 16 bit được sinh ngẫu nhiên để mã hóa nó (thuật toán mã hóa `AES`), sau đó lưu vào field `options` của bảng `fields`.

### Quy trình mã hóa field
1. Mỗi lần ghi dữ liệu vào field encryption, sẽ lấy `field key` đã mã hóa và `field encryption vector` từ field `options` của bảng `fields` trước.
2. Sử dụng `application key` và `field encryption vector` để giải mã `field key` đã mã hóa, sau đó sử dụng `field key` và `data encryption vector` 16 bit được sinh ngẫu nhiên để mã hóa dữ liệu (thuật toán mã hóa `AES`).
3. Sử dụng `field key` đã giải mã để ký dữ liệu (thuật toán digest `HMAC-SHA256`), chuyển đổi thành chuỗi ở format base64 encoding (`data signature` được sinh ra dùng cho việc tìm kiếm dữ liệu sau này).
4. Ghép nối binary `data encryption vector` 16 bit và `data ciphertext` đã mã hóa, chuyển đổi thành chuỗi ở format base64 encoding.
5. Ghép nối chuỗi `data signature` ở format base64 encoding và chuỗi `data ciphertext` đã ghép nối ở format base64 encoding với dấu phân cách '.'.
6. Lưu chuỗi đã ghép nối cuối cùng vào database.


## Biến môi trường

Nếu muốn chỉ định `application key`, có thể sử dụng biến môi trường `ENCRYPTION_FIELD_KEY_PATH`, plugin sẽ load file ở đường dẫn đó làm `application key`.

Yêu cầu format file `application key`:
1. Phần mở rộng file phải là `.key`.
2. Tên file sẽ được dùng làm Key ID, tốt nhất là sử dụng uuid để đảm bảo tính duy nhất.
3. Nội dung file là dữ liệu binary 32 bit ở format base64 encoding.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Cấu hình Field

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Ảnh hưởng đến lọc sau khi mã hóa

Field đã mã hóa chỉ hỗ trợ: bằng, không bằng, tồn tại, không tồn tại.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Cách thức lọc dữ liệu:
1. Lấy `field key` của field encryption, sử dụng `application key` để giải mã `field key`.
2. Sử dụng `field key` để ký văn bản tìm kiếm do người dùng nhập (thuật toán digest `HMAC-SHA256`).
3. Sử dụng văn bản tìm kiếm đã ký ghép với dấu phân cách `.`, thực hiện tìm kiếm prefix matching đối với field encryption trong database.

## Key rotation

:::warning
Trước khi sử dụng lệnh key rotation `nocobase key-rotation`, hãy xác nhận ứng dụng đã load plugin này.
:::

Sau khi ứng dụng được di chuyển sang môi trường mới, nếu không muốn tiếp tục sử dụng key giống với môi trường cũ, có thể sử dụng lệnh `nocobase key-rotation` để thay thế `application key`.

Khi chạy lệnh key rotation cần chỉ định application key của môi trường cũ, sau khi chạy lệnh sẽ sinh ra application key mới và thay thế key cũ. Application key mới sẽ được lưu vào thư mục storage mặc định ở format base64 encoding.

```bash
# --key-path chỉ định file application key của môi trường cũ tương ứng với dữ liệu mã hóa trong database
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Nếu là thay thế `application key` của sub-app, cần thêm tham số `--app-name`, chỉ định `name` của sub-app

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
