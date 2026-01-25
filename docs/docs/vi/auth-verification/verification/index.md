---
pkg: "@nocobase/plugin-verification"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Xác minh

:::info{title=Lưu ý}
Bắt đầu từ phiên bản `1.6.0-alpha.30`, tính năng **mã xác minh** ban đầu đã được nâng cấp thành **Quản lý Xác minh**, hỗ trợ quản lý và tích hợp nhiều phương thức xác minh danh tính người dùng khác nhau. Sau khi người dùng liên kết phương thức xác minh tương ứng, họ có thể thực hiện xác minh danh tính khi cần thiết. Tính năng này dự kiến sẽ được hỗ trợ ổn định từ phiên bản `1.7.0` trở đi.
:::



## Giới thiệu

**Trung tâm Quản lý Xác minh hỗ trợ quản lý và tích hợp nhiều phương thức xác minh danh tính người dùng khác nhau.** Ví dụ:

- Mã xác minh SMS – Được cung cấp mặc định bởi **plugin** xác minh. Tham khảo: [Xác minh: SMS](./sms)
- Trình xác thực TOTP – Tham khảo: [Xác minh: Trình xác thực TOTP](../verification-totp/)

Các nhà phát triển cũng có thể mở rộng các loại xác minh khác dưới dạng **plugin**. Tham khảo: [Mở rộng loại xác minh](./dev/type)

**Sau khi người dùng liên kết phương thức xác minh tương ứng, họ có thể thực hiện xác minh danh tính trong các trường hợp cần thiết.** Ví dụ:

- Đăng nhập bằng mã xác minh SMS – Tham khảo: [Xác thực: SMS](./sms)
- Xác thực hai yếu tố (2FA) – Tham khảo: [Xác thực hai yếu tố (2FA)](../2fa)
- Xác minh thứ cấp cho các thao tác rủi ro – Sẽ hỗ trợ trong tương lai

Các nhà phát triển cũng có thể tích hợp xác minh danh tính vào các trường hợp cần thiết khác bằng cách mở rộng **plugin**. Tham khảo: [Mở rộng các trường hợp xác minh](./dev/scene)

**Sự khác biệt và mối liên hệ giữa Module Xác minh và Module Xác thực người dùng:** Module Xác thực người dùng chủ yếu chịu trách nhiệm xác thực danh tính trong các trường hợp đăng nhập của người dùng, trong đó các quy trình như đăng nhập bằng SMS, xác thực hai yếu tố phụ thuộc vào các trình xác minh do Module Xác minh cung cấp; còn Module Xác minh chịu trách nhiệm xác minh danh tính cho các thao tác rủi ro khác nhau, trong đó đăng nhập của người dùng là một trong các trường hợp rủi ro đó.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)