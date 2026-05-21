---
pkg: '@nocobase/plugin-auth-saml'
title: "Xác thực: SAML 2.0"
description: "Xác thực SAML 2.0 SSO NocoBase: tuân theo giao thức SAML, kết nối với IdP (như Google Workspace), cấu hình SSO URL, public key, ánh xạ field."
keywords: "SAML 2.0,SSO,đăng nhập một lần,IdP,Google Workspace,ánh xạ field,NocoBase"
---

# Xác thực: SAML 2.0

## Giới thiệu

Plugin Xác thực: SAML 2.0 tuân theo chuẩn giao thức SAML 2.0 (Security Assertion Markup Language 2.0), cho phép người dùng đăng nhập NocoBase bằng tài khoản do nhà cung cấp xác thực danh tính bên thứ ba (IdP) cung cấp.

## Kích hoạt plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Thêm xác thực SAML

Vào trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202411130004459.png)

Thêm - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Cấu hình

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - URL đăng nhập một lần do IdP cung cấp
- Public Certificate - Public key do IdP cung cấp
- IdP Issuer (Entity ID) - Tùy chọn, do IdP cung cấp
- http - Nếu ứng dụng NocoBase của bạn dùng giao thức http, hãy tick chọn
- Use this field to bind the user - Field dùng để match và gắn với người dùng hiện có, có thể chọn email hoặc username, mặc định là email. Cần thông tin người dùng do IdP mang theo phải có field `email` hoặc `username`.
- Sign up automatically when the user does not exist - Khi không tìm thấy người dùng hiện có để match, có tự động tạo người dùng mới hay không.
- Usage - `SP Issuer / EntityID` và `ACS URL` dùng để copy và điền vào cấu hình tương ứng của IdP.

## Ánh xạ field

Ánh xạ field cần được cấu hình trên nền tảng cấu hình của IdP, có thể tham khảo [ví dụ](./examples/google.md).

Các field NocoBase có thể được ánh xạ:

- email (bắt buộc)
- phone (chỉ có hiệu lực với nền tảng hỗ trợ scope `phone`, như Aliyun, Feishu)
- nickname
- username
- firstName
- lastName

`nameID` được mang theo bởi giao thức SAML, không cần ánh xạ, sẽ được lưu làm định danh duy nhất của người dùng.
Thứ tự ưu tiên của nickname người dùng mới: `nickname` > `firstName lastName` > `username` > `nameID`
Hiện chưa hỗ trợ ánh xạ tổ chức và vai trò người dùng.

## Đăng nhập

Truy cập trang đăng nhập, click nút bên dưới form đăng nhập để bắt đầu đăng nhập bên thứ ba.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)
