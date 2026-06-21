---
pkg: '@nocobase/plugin-two-factor-authentication'
title: "Xác thực hai yếu tố (2FA)"
description: "Xác thực hai yếu tố NocoBase: yêu cầu kiểm tra bổ sung khi đăng nhập bằng mật khẩu (OTP, TOTP), quản trị viên bật 2FA, gắn authenticator, quy trình gắn và kiểm tra của người dùng."
keywords: "2FA,xác thực hai yếu tố,MFA,OTP,TOTP,gắn authenticator,NocoBase"
---

# Xác thực hai yếu tố (2FA)

## Giới thiệu

Xác thực hai yếu tố (2FA) là biện pháp kiểm tra danh tính bổ sung được sử dụng khi đăng nhập ứng dụng. Khi ứng dụng bật 2FA, người dùng đăng nhập bằng mật khẩu sẽ phải cung cấp thêm một phương thức xác thực khác, ví dụ: mã OTP, TOTP, v.v.

:::info{title=Mẹo}
Hiện tại quy trình 2FA chỉ áp dụng cho đăng nhập bằng mật khẩu. Nếu ứng dụng đã bật SSO hoặc các phương thức xác thực khác, bạn nên sử dụng biện pháp bảo vệ MFA (Multi-Factor Authentication) do IdP tương ứng cung cấp.
:::

## Kích hoạt plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Cấu hình quản trị viên

Sau khi kích hoạt plugin, trang quản lý authenticator sẽ có thêm trang cấu hình 2FA.

Quản trị viên cần tick chọn "Bật xác thực hai yếu tố (2FA) cho tất cả người dùng", đồng thời chọn các loại authenticator khả dụng để gắn. Nếu chưa có authenticator khả dụng, bạn cần truy cập trang quản lý kiểm tra để tạo authenticator mới. Tham khảo: [Kiểm tra](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Người dùng đăng nhập

Sau khi ứng dụng bật 2FA, khi người dùng đăng nhập bằng mật khẩu sẽ vào quy trình kiểm tra 2FA.

Nếu người dùng chưa gắn bất kỳ authenticator nào được chỉ định, hệ thống sẽ yêu cầu gắn. Sau khi gắn thành công, người dùng có thể vào ứng dụng.

![](https://static-docs.nocobase.com/202502282110829.png)

Nếu người dùng đã gắn ít nhất một authenticator được chỉ định, hệ thống sẽ yêu cầu kiểm tra danh tính qua authenticator đã gắn. Sau khi kiểm tra thành công, người dùng có thể vào ứng dụng.

![](https://static-docs.nocobase.com/202502282110148.png)

Sau khi đăng nhập thành công, người dùng có thể gắn thêm các authenticator khác trong trang quản lý kiểm tra của trung tâm cá nhân.

![](https://static-docs.nocobase.com/202502282110024.png)
