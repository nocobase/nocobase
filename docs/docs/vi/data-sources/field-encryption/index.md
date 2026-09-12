---
pkg: "@nocobase/plugin-field-encryption"
title: "Mã hóa trường"
description: "Mã hóa và lưu trữ dữ liệu nghiệp vụ riêng tư (số điện thoại, email, số thẻ, v.v.) dưới dạng bản mã trong cơ sở dữ liệu để bảo vệ thông tin nhạy cảm."
keywords: "Mã hóa trường,Encryption,Dữ liệu nhạy cảm,Lưu trữ bản mã,NocoBase"
---
# Mã hóa

## Giới thiệu

Một số dữ liệu nghiệp vụ riêng tư, chẳng hạn như số điện thoại, địa chỉ email, số thẻ của khách hàng, v.v., có thể được mã hóa. Sau khi mã hóa, dữ liệu sẽ được lưu trữ trong cơ sở dữ liệu dưới dạng bản mã.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Phương thức mã hóa

:::warning
Plugin sẽ tự động tạo một`应用密钥`, khóa này được lưu trong thư mục `/storage/apps/main/encryption-field-keys`.

Tên tệp `应用密钥` là ID khóa, phần mở rộng là `.key`. Không được tùy ý sửa đổi tên tệp.

Vui lòng bảo quản`应用密钥` tệp cẩn thận. Nếu làm mất`应用密钥` tệp, dữ liệu đã mã hóa sẽ không thể giải mã.

Nếu plugin được bật trong ứng dụng con, thư mục lưu mặc định của khóa là `/storage/apps/${子应用name}/encryption-field-keys`
:::

### Nguyên lý hoạt động

Sử dụng phương thức mã hóa phong bì

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Quy trình tạo khóa
1. Khi tạo trường mã hóa lần đầu tiên, hệ thống sẽ tự động tạo một`应用密钥` 32 bit và lưu vào thư mục lưu trữ mặc định dưới dạng mã hóa base64.
2. Mỗi khi tạo một trường mã hóa mới, hệ thống sẽ tạo một`字段密钥` 32 bit ngẫu nhiên cho trường đó, sau đó sử dụng`应用密钥` và`字段加密向量` 16 bit được tạo ngẫu nhiên để mã hóa nó (thuật toán mã hóa`AES`), rồi lưu vào bảng `fields`, trong trường `options`.

### Quy trình mã hóa trường
1. Mỗi khi ghi dữ liệu vào trường mã hóa, trước tiên hệ thống sẽ lấy từ bảng `fields`, trường `options`, các `字段密钥` và `字段加密向量` đã mã hóa.
2. Sử dụng`应用密钥` và`字段加密向量` để giải mã`字段密钥` đã mã hóa, sau đó sử dụng`字段密钥` và`数据加密向量` 16 bit được tạo ngẫu nhiên để mã hóa dữ liệu (thuật toán mã hóa`AES`).
3. Sử dụng`字段密钥` sau khi giải mã để ký dữ liệu (thuật toán băm`HMAC-SHA256`), rồi chuyển đổi thành chuỗi bằng mã hóa base64 (`数据签名` được tạo ra sẽ được dùng để truy vấn dữ liệu sau này).
4. Nối nhị phân`数据加密向量` 16 bit và`数据密文` đã mã hóa, rồi chuyển đổi thành chuỗi bằng mã hóa base64.
5. Nối chuỗi mã hóa base64 của`数据签名` và chuỗi mã hóa base64 của`数据密文` sau khi nối, phân tách bằng '.'.
6. Lưu chuỗi sau cùng vào cơ sở dữ liệu.


## Biến môi trường

Nếu muốn chỉ định`应用密钥`, có thể sử dụng biến môi trường`ENCRYPTION_FIELD_KEY_PATH`. Plugin sẽ tải tệp trong đường dẫn đó làm`应用密钥`.

`应用密钥`Yêu cầu về định dạng tệp:
1. Phần mở rộng của tệp phải là`.key`.
2. Tên tệp sẽ được dùng làm ID khóa; nên sử dụng UUID để đảm bảo tính duy nhất.
3. Nội dung tệp là dữ liệu nhị phân 32 bit được mã hóa base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Cấu hình trường

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Ảnh hưởng của việc lọc sau khi mã hóa

Các trường đã mã hóa chỉ hỗ trợ: bằng, khác, tồn tại, không tồn tại.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Phương thức lọc dữ liệu:
1. Lấy`字段密钥` của trường mã hóa, sử dụng`应用密钥` để giải mã`字段密钥`.
2. Sử dụng`字段密钥` để ký văn bản tìm kiếm do người dùng nhập (thuật toán băm`HMAC-SHA256`).
3. Dùng văn bản tìm kiếm đã ký nối với`.` làm dấu phân cách, rồi thực hiện tìm kiếm khớp tiền tố trên trường mã hóa trong cơ sở dữ liệu.

## Xoay vòng khóa

:::warning
Trước khi sử dụng lệnh xoay vòng khóa`nocobase key-rotation`, hãy xác nhận rằng ứng dụng đã tải plugin này.
:::

Sau khi di chuyển ứng dụng sang môi trường mới, nếu không muốn tiếp tục sử dụng khóa giống với môi trường cũ, có thể sử dụng lệnh`nocobase key-rotation` để thay thế`应用密钥`.

Để chạy lệnh xoay vòng khóa, cần chỉ định khóa ứng dụng của môi trường cũ. Sau khi chạy lệnh, khóa ứng dụng mới sẽ được tạo và thay thế khóa cũ. Khóa ứng dụng mới sẽ được lưu vào thư mục lưu trữ mặc định dưới dạng mã hóa base64.

```bash
# --key-path 指定的是和数据库加密数据对应的旧环境的应用密钥文件
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Nếu thay thế ứng dụng con`应用密钥`, cần thêm tham số`--app-name` để chỉ định`name` của ứng dụng con.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
