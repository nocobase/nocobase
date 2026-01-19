---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực hai yếu tố (2FA)

## Giới thiệu

Xác thực hai yếu tố (2FA) là một biện pháp bảo mật bổ sung được sử dụng khi đăng nhập ứng dụng. Khi ứng dụng bật 2FA, người dùng đăng nhập bằng mật khẩu sẽ cần cung cấp thêm một phương thức xác thực khác, ví dụ như mã OTP, TOTP, v.v.

:::info{title=Lưu ý}
Hiện tại, quy trình 2FA chỉ áp dụng cho đăng nhập bằng mật khẩu. Nếu ứng dụng của bạn đã bật SSO hoặc các phương thức xác thực khác, vui lòng sử dụng các biện pháp bảo vệ xác thực đa yếu tố (MFA) do nhà cung cấp danh tính (IdP) tương ứng cung cấp.
:::

## Bật plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Cấu hình dành cho quản trị viên

Sau khi bật plugin, một trang cấu hình 2FA sẽ được thêm vào trang quản lý trình xác thực.

Quản trị viên cần đánh dấu vào tùy chọn "Bắt buộc xác thực hai yếu tố (2FA) cho tất cả người dùng", đồng thời chọn loại trình xác thực khả dụng để liên kết. Nếu không có trình xác thực nào khả dụng, trước tiên bạn cần tạo trình xác thực mới trên trang quản lý xác minh. Tham khảo: [Xác minh](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Đăng nhập của người dùng

Sau khi ứng dụng bật 2FA, khi người dùng đăng nhập bằng mật khẩu, họ sẽ trải qua quy trình xác minh 2FA.

Nếu người dùng chưa liên kết bất kỳ trình xác thực được chỉ định nào, họ sẽ được yêu cầu thực hiện liên kết. Sau khi liên kết thành công, họ có thể truy cập ứng dụng.

![](https://static-docs.nocobase.com/202502282110829.png)

Nếu người dùng đã liên kết một trong các trình xác thực được chỉ định, họ sẽ được yêu cầu xác thực danh tính thông qua trình xác thực đã liên kết. Sau khi xác minh thành công, họ có thể truy cập ứng dụng.

![](https://static-docs.nocobase.com/202502282110148.png)

Sau khi đăng nhập thành công, người dùng có thể liên kết thêm các trình xác thực khác trên trang quản lý xác minh trong trung tâm cá nhân của họ.

![](https://static-docs.nocobase.com/202502282110024.png)