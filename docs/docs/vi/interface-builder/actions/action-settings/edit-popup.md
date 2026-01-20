:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Chỉnh sửa Cửa sổ bật lên

## Giới thiệu

Bất kỳ thao tác hoặc trường nào khi nhấp vào mà mở ra một cửa sổ bật lên đều hỗ trợ cấu hình cách mở, kích thước, v.v. của cửa sổ đó.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Chế độ mở

- Ngăn kéo

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Hộp thoại

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Trang con

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Kích thước Cửa sổ bật lên

- Lớn
- Trung bình (mặc định)
- Nhỏ

## UID Cửa sổ bật lên

"UID Cửa sổ bật lên" là UID của thành phần dùng để mở cửa sổ bật lên đó; nó cũng tương ứng với đoạn `viewUid` trong `view/:viewUid` trên thanh địa chỉ hiện tại. Bạn có thể nhanh chóng lấy được UID này bằng cách nhấp vào "Sao chép UID Cửa sổ bật lên" trong menu cài đặt của trường hoặc nút kích hoạt cửa sổ bật lên. Việc thiết lập UID cửa sổ bật lên giúp tái sử dụng cửa sổ bật lên một cách hiệu quả.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

### Cửa sổ bật lên nội bộ (mặc định)
- "UID Cửa sổ bật lên" bằng UID của nút thao tác hiện tại (mặc định là UID của nút này).

### Cửa sổ bật lên bên ngoài (tái sử dụng cửa sổ bật lên)
- Trong trường "UID Cửa sổ bật lên", nhập UID của nút kích hoạt từ một vị trí khác (tức là UID của cửa sổ bật lên đó) để tái sử dụng cửa sổ bật lên đó.
- Trường hợp sử dụng điển hình: nhiều trang/khối dùng chung một giao diện và logic cửa sổ bật lên, tránh cấu hình lặp lại.
- Khi sử dụng cửa sổ bật lên bên ngoài, một số cấu hình không thể sửa đổi (xem bên dưới).

## Các cấu hình liên quan khác

- `Nguồn dữ liệu / bộ sưu tập`: Chỉ hiển thị dạng đọc, dùng để giải thích nguồn dữ liệu mà cửa sổ bật lên này liên kết; mặc định lấy bộ sưu tập của khối hiện tại. Trong chế độ cửa sổ bật lên bên ngoài, cấu hình này sẽ kế thừa từ cửa sổ bật lên mục tiêu và không thể sửa đổi.
- `Tên liên kết`: Tùy chọn. Dùng để mở cửa sổ bật lên từ một "trường liên kết", chỉ hiển thị khi có giá trị mặc định. Trong chế độ cửa sổ bật lên bên ngoài, cấu hình này sẽ kế thừa từ cửa sổ bật lên mục tiêu và không thể sửa đổi.
- `ID nguồn`: Chỉ xuất hiện khi đã thiết lập `Tên liên kết`; mặc định sử dụng `sourceId` của ngữ cảnh hiện tại, có thể thay đổi thành biến hoặc giá trị cố định tùy theo nhu cầu.
- `filterByTk`: Có thể để trống, là một biến tùy chọn, hoặc một giá trị cố định, dùng để giới hạn các bản ghi dữ liệu của cửa sổ bật lên.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)