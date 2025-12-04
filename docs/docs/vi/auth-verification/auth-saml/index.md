---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực: SAML 2.0

## Giới thiệu

Plugin Xác thực: SAML 2.0 tuân thủ tiêu chuẩn giao thức SAML 2.0 (Security Assertion Markup Language 2.0), cho phép người dùng đăng nhập vào NocoBase bằng tài khoản do các nhà cung cấp dịch vụ xác thực danh tính bên thứ ba (IdP) cung cấp.

## Kích hoạt plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Thêm xác thực SAML

Truy cập trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202411130004459.png)

Thêm - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Cấu hình

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - Do IdP cung cấp, là địa chỉ URL dùng cho đăng nhập một lần (SSO).
- Khóa công khai (Public Certificate) - Do IdP cung cấp.
- ID thực thể (IdP Issuer) - Tùy chọn, do IdP cung cấp.
- HTTP - Nếu ứng dụng NocoBase của bạn sử dụng giao thức HTTP, vui lòng chọn.
- Use this field to bind the user - Trường dùng để khớp và liên kết với người dùng hiện có, có thể chọn email hoặc tên người dùng, mặc định là email. Thông tin người dùng do IdP cung cấp cần chứa trường `email` hoặc `username`.
- Sign up automatically when the user does not exist - Khi không tìm thấy người dùng hiện có để khớp và liên kết, có tự động tạo người dùng mới hay không.
- Sử dụng (Usage) - `SP Issuer / EntityID` và `ACS URL` được dùng để sao chép và điền vào cấu hình tương ứng trong IdP.

## Ánh xạ trường

Việc ánh xạ trường cần được cấu hình trên nền tảng cấu hình của IdP, bạn có thể tham khảo [ví dụ](./examples/google.md).

Các trường có sẵn để ánh xạ trong NocoBase bao gồm:

- email (bắt buộc)
- phone (chỉ có hiệu lực đối với các nền tảng (IdP) hỗ trợ `phone` trong phạm vi của họ, ví dụ như Alibaba Cloud, Feishu)
- nickname
- username
- firstName
- lastName

`nameID` được giao thức SAML mang theo, không cần ánh xạ, và sẽ được lưu làm định danh người dùng duy nhất.
Thứ tự ưu tiên cho quy tắc sử dụng biệt danh của người dùng mới là: `nickname` > `firstName lastName` > `username` > `nameID`
Hiện tại không hỗ trợ ánh xạ tổ chức và vai trò của người dùng.

## Đăng nhập

Truy cập trang đăng nhập, sau đó nhấp vào nút bên dưới biểu mẫu đăng nhập để bắt đầu đăng nhập bằng bên thứ ba.

![](https://static-docs.nocobase.com/7496365c9d36a294948e6adeb5b24bc.png)