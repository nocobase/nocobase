---
title: 'Cấu hình hộp thư'
description: 'Cấu hình nhà cung cấp và kết nối hộp thư của người dùng.'
---

# Cấu hình hộp thư

Quản trị viên cấu hình cách ứng dụng kết nối với nhà cung cấp email. Sau đó người dùng tự kết nối hộp thư của mình. Nếu đã có sẵn nhà cung cấp, người dùng có thể kết nối từ trang tài khoản hộp thư.

## Quản trị viên chuẩn bị

Cấu hình máy chủ mail và phương thức kết nối của nhà cung cấp trước khi kết nối hộp thư cá nhân. Khi đó người dùng kết nối tài khoản mà không phải lặp lại việc thiết lập nhà cung cấp.

| Cách tích hợp   | Thông tin cần có                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| IMAP/SMTP     | Địa chỉ máy chủ thư đến và thư đi, cổng và thiết lập kết nối bảo mật.               |
| Gmail         | Một ứng dụng Google OAuth, thông tin client và URL callback của ứng dụng.            |
| Microsoft 365 | Một ứng dụng Microsoft OAuth, thông tin client và phê duyệt của tổ chức nếu cần. |

Lập trình viên hoặc quản trị viên triển khai của ứng dụng duy trì các thiết lập này trong `mail.providers` của cấu hình server. Người dùng kết nối hộp thư cá nhân từ trang tài khoản hộp thư của ứng dụng.

Ví dụ, đưa các thiết lập máy chủ mailbox.org sau cho Agent của bạn:

```text
Configure mailbox.org integration for the application:
- IMAP server: imap.mailbox.org, port 993, using SSL/TLS.
- SMTP server: smtp.mailbox.org, port 465, using SSL/TLS.
Add a mailbox accounts page where users enter their email address, username, and password and choose a starting date for initial synchronization.
```

Với OAuth, quản trị viên đăng ký URL callback của ứng dụng với nhà cung cấp và hoàn tất các phê duyệt quyền cần thiết.

## Kết nối hộp thư của bạn

Mở trang tài khoản hộp thư và nhấn **Kết nối tài khoản**:

- **IMAP/SMTP**: chọn nhà cung cấp và nhập địa chỉ, tên người dùng và mật khẩu hoặc mật khẩu ứng dụng theo yêu cầu của nhà cung cấp.
- **Gmail hoặc Microsoft 365**: chọn nhà cung cấp, đăng nhập và cấp quyền truy cập trên trang của nhà cung cấp.
- Chọn ngày bắt đầu nhập các thư hiện có.

Nhập mật khẩu hộp thư trong biểu mẫu kết nối. Quản trị viên lưu các secret OAuth trong cấu hình triển khai.

## Khác biệt giữa các cách tích hợp

Gmail và Microsoft 365 hỗ trợ đồng bộ và sắp xếp đầy đủ hơn. IMAP/SMTP chủ yếu nhập thư mới và gửi email. Nó không đồng bộ đầy đủ các thay đổi đã đọc, xóa hoặc di chuyển từ client khác, và không hỗ trợ thư nháp của nhà cung cấp, bí danh người gửi, đồng bộ đẩy hay di chuyển vào thư mục của nhà cung cấp. Thư nháp cục bộ của ứng dụng vẫn có thể lưu nội dung chưa gửi.

## Câu hỏi thường gặp

### Ứng dụng không có lối vào hộp thư

Hãy yêu cầu Agent tích hợp Mail và thêm trung tâm thư cùng trang tài khoản hộp thư vào điều hướng của ứng dụng.

### OAuth không quay lại ứng dụng

Hãy nhờ quản trị viên đối chiếu URL callback đã đăng ký với cấu hình ứng dụng và đảm bảo trang quay lại truy cập được.

### Không có thư nào sau khi kết nối

Kiểm tra ngày bắt đầu đồng bộ có bao gồm các thư đó không và việc đồng bộ đã hoàn tất chưa. Nhập một lịch sử lớn sẽ mất thời gian. Nếu tác vụ nền không chạy, quản trị viên có thể kiểm tra bản ghi đồng bộ và các dịch vụ của ứng dụng.
