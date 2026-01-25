---
pkg: '@nocobase/plugin-auth'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực bằng mật khẩu

## Giao diện cấu hình

![](https://static-docs.nocobase.com/202411131505095.png)

## Cho phép đăng ký

Khi cho phép đăng ký, trang đăng nhập sẽ hiển thị liên kết để tạo tài khoản và bạn có thể chuyển đến trang đăng ký.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Trang đăng ký

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Khi không cho phép đăng ký, trang đăng nhập sẽ không hiển thị liên kết để tạo tài khoản.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Khi không cho phép đăng ký, bạn không thể truy cập trang đăng ký.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8030556.png)

## Cài đặt biểu mẫu đăng ký<Badge>v1.4.0-beta.7+</Badge>

Bạn có thể cài đặt những trường nào trong **bộ sưu tập** người dùng sẽ hiển thị trên biểu mẫu đăng ký và liệu chúng có bắt buộc hay không. Ít nhất một trong các trường tên người dùng hoặc email cần được cài đặt là hiển thị và bắt buộc.

![](https://static-docs.nocobase.com/202411262133669.png)

Trang đăng ký

![](https://static-docs.nocobase.com/202411262135801.png)

## Quên mật khẩu<Badge>v1.8.0+</Badge>

Tính năng quên mật khẩu cho phép người dùng đặt lại mật khẩu thông qua xác minh email khi họ quên mật khẩu.

### Cấu hình dành cho quản trị viên

1.  **Bật tính năng quên mật khẩu**

    Trong tab "Cài đặt" > "Xác thực người dùng" > "Quên mật khẩu", hãy chọn hộp kiểm "Bật tính năng quên mật khẩu".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Cấu hình kênh thông báo**

    Chọn một kênh thông báo email (hiện tại chỉ hỗ trợ email). Nếu không có kênh thông báo nào khả dụng, bạn cần thêm một kênh trước.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Cấu hình email đặt lại mật khẩu**

    Tùy chỉnh chủ đề và nội dung email, hỗ trợ định dạng HTML hoặc văn bản thuần túy. Bạn có thể sử dụng các biến sau:
    - Người dùng hiện tại (Current user)
    - Cài đặt hệ thống (System settings)
    - Liên kết đặt lại mật khẩu (Reset password link)
    - Thời hạn hiệu lực của liên kết đặt lại (phút) (Reset link expiration (minutes))

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Đặt thời hạn hiệu lực của liên kết đặt lại**

    Đặt thời gian hiệu lực (tính bằng phút) cho liên kết đặt lại, mặc định là 120 phút.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Quy trình sử dụng dành cho người dùng

1.  **Gửi yêu cầu đặt lại mật khẩu**

    Trên trang đăng nhập, nhấp vào liên kết "Quên mật khẩu" (quản trị viên cần bật tính năng quên mật khẩu trước) để truy cập trang quên mật khẩu.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Nhập địa chỉ email đã đăng ký và nhấp vào nút "Gửi email đặt lại".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Đặt lại mật khẩu**

    Người dùng sẽ nhận được một email chứa liên kết đặt lại. Sau khi nhấp vào liên kết, hãy đặt mật khẩu mới trên trang được mở.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Sau khi hoàn tất cài đặt, người dùng có thể đăng nhập vào hệ thống bằng mật khẩu mới.

### Lưu ý

- Liên kết đặt lại có giới hạn thời gian, mặc định có hiệu lực trong vòng 120 phút sau khi tạo (có thể được quản trị viên cấu hình).
- Liên kết chỉ có thể sử dụng một lần và sẽ mất hiệu lực ngay lập tức sau khi sử dụng.
- Nếu người dùng không nhận được email đặt lại, vui lòng kiểm tra xem địa chỉ email có đúng không hoặc kiểm tra thư mục thư rác.
- Quản trị viên nên đảm bảo rằng cấu hình máy chủ email là chính xác để đảm bảo email đặt lại có thể được gửi thành công.