---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực: Trình xác thực TOTP

## Giới thiệu

Trình xác thực TOTP cho phép người dùng liên kết bất kỳ trình xác thực nào tuân thủ tiêu chuẩn Mật khẩu dùng một lần dựa trên thời gian (TOTP) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), và thực hiện xác minh danh tính bằng mật khẩu dùng một lần dựa trên thời gian (TOTP).

## Cấu hình của quản trị viên

Truy cập trang Quản lý xác thực.

![](https://static-docs.nocobase.com/202502271726791.png)

Thêm - Trình xác thực TOTP

![](https://static-docs.nocobase.com/202502271745028.png)

Ngoài mã định danh duy nhất và tiêu đề, Trình xác thực TOTP không yêu cầu cấu hình bổ sung nào khác.

![](https://static-docs.nocobase.com/202502271746034.png)

## Liên kết của người dùng

Sau khi thêm trình xác thực, người dùng có thể liên kết trình xác thực TOTP trong khu vực quản lý xác thực cá nhân của họ.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Plugin hiện chưa cung cấp cơ chế mã khôi phục. Sau khi liên kết trình xác thực TOTP, người dùng nên bảo quản cẩn thận. Nếu vô tình làm mất trình xác thực, họ có thể sử dụng phương pháp xác thực thay thế để xác minh danh tính, hủy liên kết trình xác thực, sau đó liên kết lại.
:::

## Hủy liên kết của người dùng

Hủy liên kết trình xác thực yêu cầu xác minh bằng phương pháp xác thực đã liên kết.

![](https://static-docs.nocobase.com/202502282103205.png)