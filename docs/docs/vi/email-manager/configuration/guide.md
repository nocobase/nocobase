---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Quy trình cấu hình

## Tổng quan
Sau khi bật plugin Email, quản trị viên cần hoàn tất cấu hình cần thiết trước khi người dùng thông thường có thể kết nối tài khoản email của họ vào NocoBase. (Hiện tại, chỉ hỗ trợ đăng nhập ủy quyền cho tài khoản Outlook và Gmail; chưa hỗ trợ kết nối trực tiếp tài khoản Microsoft và Google.)

Cốt lõi của cấu hình nằm ở cài đặt xác thực cho các lệnh gọi API của nhà cung cấp dịch vụ email. Quản trị viên cần hoàn thành các bước sau để đảm bảo plugin hoạt động bình thường:

1.  **Lấy thông tin xác thực từ nhà cung cấp dịch vụ**
    -   Đăng nhập vào bảng điều khiển dành cho nhà phát triển của nhà cung cấp dịch vụ email (ví dụ: Google Cloud Console hoặc Microsoft Azure Portal).
    -   Tạo một ứng dụng hoặc dự án mới và bật dịch vụ API email Gmail hoặc Outlook.
    -   Lấy Client ID và Client Secret tương ứng.
    -   Cấu hình URI chuyển hướng (Redirect URI), đảm bảo khớp với địa chỉ callback của plugin NocoBase.

2.  **Cấu hình nhà cung cấp dịch vụ email**
    -   Truy cập trang cấu hình của plugin Email.
    -   Cung cấp thông tin xác thực API cần thiết, bao gồm Client ID, Client Secret, v.v., để đảm bảo ủy quyền đúng cách với nhà cung cấp dịch vụ email.

3.  **Đăng nhập ủy quyền**
    -   Người dùng đăng nhập vào tài khoản email của họ thông qua giao thức OAuth.
    -   Plugin sẽ tự động tạo và lưu trữ mã thông báo ủy quyền (authorization token) của người dùng để sử dụng cho các lệnh gọi API và thao tác email sau này.

4.  **Kết nối tài khoản email**
    -   Sau khi ủy quyền thành công, tài khoản email của người dùng sẽ được kết nối vào NocoBase.
    -   Plugin sẽ đồng bộ hóa dữ liệu email của người dùng và cung cấp các tính năng để quản lý, gửi và nhận email.

5.  **Sử dụng tính năng email**
    -   Người dùng có thể xem, quản lý và gửi email trực tiếp trong nền tảng.
    -   Tất cả các thao tác được hoàn thành thông qua các lệnh gọi API của nhà cung cấp dịch vụ email, đảm bảo đồng bộ hóa thời gian thực và truyền tải hiệu quả.

Thông qua quy trình được mô tả ở trên, plugin Email của NocoBase cung cấp cho người dùng các dịch vụ quản lý email hiệu quả và an toàn. Nếu bạn gặp bất kỳ vấn đề nào trong quá trình cấu hình, vui lòng tham khảo tài liệu liên quan hoặc liên hệ với đội ngũ hỗ trợ kỹ thuật để được giúp đỡ.

## Cấu hình plugin

### Bật plugin Email

1.  Truy cập trang quản lý plugin
2.  Tìm plugin "Email manager" và bật nó lên.

### Cấu hình nhà cung cấp dịch vụ email

Sau khi bật plugin Email, bạn có thể cấu hình các nhà cung cấp dịch vụ email. Hiện tại, NocoBase hỗ trợ dịch vụ email của Google và Microsoft. Nhấp vào "Cài đặt" -> "Cài đặt Email" trên thanh điều hướng để truy cập trang cài đặt.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Đối với mỗi nhà cung cấp dịch vụ, bạn cần điền Client ID và Client Secret. Các phần tiếp theo sẽ trình bày chi tiết cách lấy hai tham số này.