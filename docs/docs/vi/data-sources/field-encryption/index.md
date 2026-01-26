---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Mã hóa

## Giới thiệu

Một số dữ liệu kinh doanh nhạy cảm, như số điện thoại khách hàng, địa chỉ email, số thẻ, v.v., có thể được mã hóa. Sau khi mã hóa, dữ liệu sẽ được lưu trữ dưới dạng văn bản mã hóa (ciphertext) vào cơ sở dữ liệu.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Phương thức mã hóa

:::warning
Plugin sẽ tự động tạo một `khóa ứng dụng`, khóa này được lưu trữ trong thư mục `/storage/apps/main/encryption-field-keys`.

Tên tệp `khóa ứng dụng` là ID khóa, với phần mở rộng là `.key`. Vui lòng không tự ý thay đổi tên tệp.

Vui lòng bảo quản cẩn thận tệp `khóa ứng dụng`. Nếu bạn làm mất tệp `khóa ứng dụng`, dữ liệu đã mã hóa sẽ không thể được giải mã.

Nếu plugin được kích hoạt bởi một ứng dụng con, thư mục lưu trữ khóa mặc định là `/storage/apps/${tên_ứng_dụng_con}/encryption-field-keys`.
:::

### Cách thức hoạt động

Sử dụng phương pháp mã hóa phong bì (Envelope Encryption).

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Quy trình tạo khóa
1. Khi tạo trường mã hóa lần đầu tiên, hệ thống sẽ tự động tạo một `khóa ứng dụng` 32 bit và lưu trữ nó dưới dạng mã hóa Base64 vào thư mục lưu trữ mặc định.
2. Mỗi khi tạo một trường mã hóa mới, một `khóa trường` 32 bit ngẫu nhiên sẽ được tạo cho trường đó. Sau đó, nó được mã hóa bằng `khóa ứng dụng` và một `vector mã hóa trường` 16 bit được tạo ngẫu nhiên (thuật toán mã hóa `AES`), rồi lưu vào trường `options` của bảng `fields`.

### Quy trình mã hóa trường
1. Mỗi khi ghi dữ liệu vào một trường mã hóa, hệ thống sẽ lấy `khóa trường` và `vector mã hóa trường` đã mã hóa từ trường `options` của bảng `fields`.
2. Giải mã `khóa trường` đã mã hóa bằng cách sử dụng `khóa ứng dụng` và `vector mã hóa trường`. Sau đó, dữ liệu được mã hóa bằng `khóa trường` và một `vector mã hóa dữ liệu` 16 bit được tạo ngẫu nhiên (thuật toán mã hóa `AES`).
3. Sử dụng `khóa trường` đã giải mã để ký dữ liệu (thuật toán tóm tắt `HMAC-SHA256`) và chuyển đổi thành chuỗi mã hóa Base64 (`chữ ký dữ liệu` được tạo ra sau đó sẽ được sử dụng để truy xuất dữ liệu).
4. Nối nhị phân `vector mã hóa dữ liệu` 16 bit và `văn bản mã hóa dữ liệu` đã mã hóa, rồi chuyển đổi thành chuỗi mã hóa Base64.
5. Nối chuỗi mã hóa Base64 của `chữ ký dữ liệu` và chuỗi mã hóa Base64 của `văn bản mã hóa dữ liệu` đã ghép nối, phân tách bằng dấu chấm `.`.
6. Lưu chuỗi cuối cùng đã ghép nối vào cơ sở dữ liệu.

## Biến môi trường

Nếu bạn muốn chỉ định một `khóa ứng dụng` tùy chỉnh, bạn có thể sử dụng biến môi trường `ENCRYPTION_FIELD_KEY_PATH`. Plugin sẽ tải tệp tại đường dẫn đó làm `khóa ứng dụng`.

Yêu cầu định dạng tệp `khóa ứng dụng`:
1. Phần mở rộng của tệp phải là `.key`.
2. Tên tệp sẽ được sử dụng làm ID khóa; nên sử dụng UUID để đảm bảo tính duy nhất.
3. Nội dung tệp phải là dữ liệu nhị phân 32 bit được mã hóa Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Cấu hình trường

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Ảnh hưởng đến việc lọc sau khi mã hóa

Các trường đã mã hóa chỉ hỗ trợ các điều kiện lọc: bằng, không bằng, tồn tại, không tồn tại.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Quy trình lọc dữ liệu:
1. Lấy `khóa trường` của trường mã hóa và giải mã nó bằng `khóa ứng dụng`.
2. Sử dụng `khóa trường` để ký văn bản tìm kiếm do người dùng nhập (thuật toán tóm tắt `HMAC-SHA256`).
3. Nối chữ ký với dấu phân cách `.` và thực hiện truy vấn khớp tiền tố trên trường mã hóa trong cơ sở dữ liệu.

## Xoay vòng khóa

:::warning
Trước khi sử dụng lệnh xoay vòng khóa `nocobase key-rotation`, hãy đảm bảo rằng ứng dụng đã tải plugin này.
:::

Khi di chuyển ứng dụng sang môi trường mới, nếu bạn không muốn tiếp tục sử dụng cùng một khóa với môi trường cũ, bạn có thể sử dụng lệnh `nocobase key-rotation` để thay thế `khóa ứng dụng`.

Để chạy lệnh xoay vòng khóa, bạn cần chỉ định `khóa ứng dụng` của môi trường cũ. Sau khi lệnh được thực thi, một `khóa ứng dụng` mới sẽ được tạo và thay thế khóa cũ. Khóa ứng dụng mới sẽ được lưu trữ (dưới dạng mã hóa Base64) vào thư mục mặc định.

```bash
# --key-path chỉ định tệp khóa ứng dụng của môi trường cũ tương ứng với dữ liệu đã mã hóa trong cơ sở dữ liệu
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Nếu bạn muốn thay thế `khóa ứng dụng` của một ứng dụng con, bạn cần thêm tham số `--app-name` để chỉ định `tên` của ứng dụng con.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```