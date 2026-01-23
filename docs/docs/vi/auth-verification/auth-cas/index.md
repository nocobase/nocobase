---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực: CAS

## Giới thiệu

Plugin Xác thực: CAS tuân thủ tiêu chuẩn giao thức CAS (Central Authentication Service), cho phép người dùng đăng nhập vào NocoBase bằng tài khoản do các nhà cung cấp dịch vụ xác thực danh tính bên thứ ba (IdP) cung cấp.

## Cài đặt

## Hướng dẫn sử dụng

### Kích hoạt plugin

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Thêm xác thực CAS

Truy cập trang quản lý xác thực người dùng

http://localhost:13000/admin/settings/auth/authenticators

Thêm phương thức xác thực CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Cấu hình CAS và kích hoạt

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Truy cập trang đăng nhập

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)