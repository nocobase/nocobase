---
pkg: '@nocobase/plugin-auth-sms'
title: "Xác thực SMS"
description: "Xác thực SMS NocoBase: đăng ký và đăng nhập bằng mã SMS, cần kết hợp với SMS verifier của plugin-verification, hỗ trợ tự động đăng ký khi user không tồn tại."
keywords: "xác thực SMS,đăng nhập SMS,đăng nhập bằng mã,tự động đăng ký,NocoBase"
---

# Xác thực SMS

## Giới thiệu

Plugin xác thực SMS hỗ trợ người dùng đăng ký và đăng nhập NocoBase qua SMS.

> Cần kết hợp với chức năng SMS code do [plugin `@nocobase/plugin-verification`](/auth-verification/verification/index.md) cung cấp

## Thêm xác thực SMS

Vào trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202502282112517.png)

Thêm - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Cấu hình phiên bản mới

:::info{title=Mẹo}
Cấu hình phiên bản mới được giới thiệu từ `1.6.0-alpha.30` và dự kiến hỗ trợ ổn định từ `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verificator:** Gắn một SMS verifier để gửi mã SMS. Nếu chưa có verifier khả dụng, bạn cần truy cập trang quản lý kiểm tra trước để tạo SMS verifier.
Tham khảo:

- [Kiểm tra](../verification/index.md)
- [Kiểm tra: SMS](../verification/sms/index.md)

Sign up automatically when the user does not exist: Khi tick chọn tùy chọn này, nếu số điện thoại người dùng nhập không tồn tại, hệ thống sẽ dùng số điện thoại làm nickname để đăng ký người dùng mới.

## Cấu hình phiên bản cũ

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Tính năng xác thực đăng nhập SMS sẽ sử dụng SMS Provider đã cấu hình và đặt làm mặc định để gửi SMS.

Sign up automatically when the user does not exist: Khi tick chọn tùy chọn này, nếu số điện thoại người dùng nhập không tồn tại, hệ thống sẽ dùng số điện thoại làm nickname để đăng ký người dùng mới.

## Đăng nhập

Truy cập trang đăng nhập để sử dụng.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)
