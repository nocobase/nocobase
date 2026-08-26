---
pkg: '@nocobase/plugin-verification-totp-authenticator'
title: "Xác minh: TOTP Authenticator"
description: "NocoBase TOTP Authenticator: mật khẩu một lần dựa trên thời gian theo chuẩn RFC-6238, hỗ trợ Google Authenticator và các authenticator khác, gắn kết và hủy gắn kết người dùng."
keywords: "TOTP,Google Authenticator,mật khẩu động,OTP,RFC-6238,gắn kết authenticator,NocoBase"
---

# Xác minh: TOTP Authenticator

## Giới thiệu

TOTP Authenticator hỗ trợ người dùng gắn kết bất kỳ authenticator nào tuân theo chuẩn TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), thực hiện xác minh danh tính thông qua mật khẩu một lần dựa trên thời gian (TOTP).

## Cấu hình của Quản trị viên

Vào trang quản lý xác minh.

![](https://static-docs.nocobase.com/202502271726791.png)

Thêm - TOTP verifier

![](https://static-docs.nocobase.com/202502271745028.png)

Ngoài định danh duy nhất và tiêu đề, TOTP verifier không cần cấu hình thêm gì khác.

![](https://static-docs.nocobase.com/202502271746034.png)

## Người dùng gắn kết

Sau khi thêm verifier, người dùng có thể gắn kết TOTP Authenticator trong phần quản lý xác minh ở trung tâm cá nhân.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Plugin tạm thời chưa cung cấp cơ chế recovery code, sau khi gắn kết TOTP Authenticator, vui lòng giữ gìn cẩn thận. Nếu lỡ làm mất authenticator, bạn có thể sử dụng phương thức xác minh khác để xác minh danh tính, hoặc thông qua phương thức xác minh khác để hủy gắn kết rồi gắn kết lại.
:::

## Người dùng hủy gắn kết

Hủy gắn kết authenticator cần thông qua phương thức xác minh đã gắn kết để thực hiện xác minh.

![](https://static-docs.nocobase.com/202502282103205.png)
