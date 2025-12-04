---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Xác thực: LDAP

## Giới thiệu

Plugin Xác thực: LDAP tuân thủ tiêu chuẩn giao thức LDAP (Lightweight Directory Access Protocol), cho phép người dùng đăng nhập vào NocoBase bằng tài khoản và mật khẩu từ máy chủ LDAP của họ.

## Kích hoạt plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Thêm xác thực LDAP

Truy cập trang quản lý plugin xác thực người dùng.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Thêm - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Cấu hình

### Cấu hình cơ bản

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- **Tự động đăng ký khi người dùng không tồn tại** - Tùy chọn tự động tạo người dùng mới nếu không tìm thấy người dùng hiện có phù hợp.
- **URL LDAP** - Địa chỉ máy chủ LDAP.
- **Bind DN** - DN dùng để kiểm tra kết nối máy chủ và tìm kiếm người dùng.
- **Mật khẩu Bind** - Mật khẩu của Bind DN.
- **Kiểm tra kết nối** - Nhấp vào nút để kiểm tra kết nối máy chủ và xác thực Bind DN.

### Cấu hình tìm kiếm

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- **Search DN** - DN dùng để tìm kiếm người dùng.
- **Bộ lọc tìm kiếm** - Điều kiện lọc để tìm kiếm người dùng, sử dụng `{{account}}` để đại diện cho tài khoản người dùng dùng khi đăng nhập.
- **Phạm vi** - `Base`, `One level`, `Subtree`, mặc định là `Subtree`.
- **Giới hạn kích thước** - Kích thước phân trang tìm kiếm.

### Ánh xạ thuộc tính

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- **Sử dụng trường này để liên kết người dùng** - Trường dùng để liên kết với người dùng hiện có. Chọn 'tên người dùng' nếu tài khoản đăng nhập là tên người dùng, hoặc 'email' nếu đó là địa chỉ email. Mặc định là tên người dùng.
- **Ánh xạ thuộc tính** - Ánh xạ các thuộc tính người dùng với các trường trong bảng người dùng của NocoBase.

## Đăng nhập

Truy cập trang đăng nhập và nhập tên người dùng cùng mật khẩu LDAP vào biểu mẫu đăng nhập.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>