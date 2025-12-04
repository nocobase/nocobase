---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực bằng SMS

## Giới thiệu

Plugin xác thực bằng SMS hỗ trợ người dùng đăng ký và đăng nhập vào NocoBase thông qua tin nhắn SMS.

> Lưu ý: Plugin này cần được sử dụng kết hợp với chức năng mã xác minh SMS do [`plugin @nocobase/plugin-verification`](/auth-verification/verification/) cung cấp.

## Thêm xác thực bằng SMS

Truy cập trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202502282112517.png)

Thêm - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Cấu hình phiên bản mới

:::info{title=Lưu ý}
Cấu hình mới được giới thiệu từ phiên bản `1.6.0-alpha.30` và dự kiến sẽ được hỗ trợ ổn định từ `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Trình xác minh (Verificator):** Liên kết một trình xác minh SMS để gửi mã xác minh SMS. Nếu không có trình xác minh nào khả dụng, bạn cần truy cập trang quản lý xác minh để tạo trình xác minh SMS trước.
Xem thêm:

- [Xác minh](../verification/index.md)
- [Xác minh: SMS](../verification/sms/index.md)

**Tự động đăng ký khi người dùng không tồn tại (Sign up automatically when the user does not exist):** Khi tùy chọn này được chọn, nếu số điện thoại của người dùng không tồn tại, một người dùng mới sẽ được đăng ký với số điện thoại làm biệt danh.

## Cấu hình phiên bản cũ

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Tính năng xác thực đăng nhập SMS sẽ sử dụng Nhà cung cấp (Provider) mã xác minh SMS đã được cấu hình và đặt làm mặc định để gửi tin nhắn.

**Tự động đăng ký khi người dùng không tồn tại (Sign up automatically when the user does not exist):** Khi tùy chọn này được chọn, nếu số điện thoại của người dùng không tồn tại, một người dùng mới sẽ được đăng ký với số điện thoại làm biệt danh.

## Đăng nhập

Truy cập trang đăng nhập để sử dụng.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)