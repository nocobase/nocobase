---
pkg: '@nocobase/plugin-auth'
title: "Quản lý Authenticator"
description: "Quản lý authenticator NocoBase: kích hoạt authenticator, thêm loại xác thực, cấu hình hiển thị trên trang đăng nhập, hỗ trợ password, SAML, OIDC và các phương thức xác thực mở rộng."
keywords: "quản lý authenticator,loại xác thực,kích hoạt authenticator,cấu hình trang đăng nhập,NocoBase"
---

# Quản lý Authenticator

## Quản lý xác thực người dùng

Khi cài đặt plugin xác thực người dùng, hệ thống sẽ khởi tạo phương thức xác thực `mật khẩu`, dựa trên tên người dùng và email.

![](https://static-docs.nocobase.com/66eaa9d5421c9cb713b117366bd8a5d5.png)

## Kích hoạt authenticator

![](https://static-docs.nocobase.com/7f1fb8f8ca5de67ffc68eff0a65848f5.png)

Chỉ các loại xác thực đã kích hoạt mới hiển thị trên trang đăng nhập

![](https://static-docs.nocobase.com/8375a36ef98417af0f0977f1e07345dd.png)

## Loại xác thực người dùng

![](https://static-docs.nocobase.com/da4250c0cea343ebe470cbf7be4b12e4.png)

Bằng cách thêm các loại authenticator khác nhau, bạn có thể thêm phương thức xác thực tương ứng cho hệ thống.

Ngoài các loại xác thực do plugin có sẵn cung cấp, bạn cũng có thể tự mở rộng loại xác thực người dùng. Tham khảo [Hướng dẫn phát triển](./dev/index.md).
