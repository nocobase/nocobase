---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Xác thực: DingTalk"
description: "Đăng nhập DingTalk NocoBase: hỗ trợ đăng nhập bằng tài khoản DingTalk, cấu hình Client ID, Client Secret, callback URL, mở quyền số điện thoại cá nhân và danh bạ."
keywords: "DingTalk,đăng nhập DingTalk,OAuth,Client ID,callback URL,NocoBase"
---

# Xác thực: DingTalk

## Giới thiệu

Plugin Xác thực: DingTalk hỗ trợ người dùng đăng nhập NocoBase bằng tài khoản DingTalk.

## Kích hoạt plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Đăng ký quyền API trên DingTalk Developer Console

Tham khảo <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Open Platform - Hiện thực đăng nhập website bên thứ ba</a>, tạo một ứng dụng.

Vào trang quản lý ứng dụng, mở quyền "Thông tin số điện thoại cá nhân" và "Quyền đọc thông tin cá nhân từ danh bạ".

![](https://static-docs.nocobase.com/202406120006620.png)

## Lấy key từ DingTalk Developer Console

Copy Client ID và Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Thêm xác thực DingTalk trên NocoBase

Vào trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202406112348051.png)

Thêm - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Cấu hình

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - Khi không match được người dùng hiện có bằng số điện thoại, có tự động tạo người dùng mới hay không.
- Client ID và Client Secret - Điền thông tin đã copy ở bước trước.
- Redirect URL - Callback URL, copy và chuyển sang bước tiếp theo.

## Cấu hình callback URL trên DingTalk Developer Console

Điền callback URL đã copy vào DingTalk Developer Console.

![](https://static-docs.nocobase.com/202406120012221.png)

## Đăng nhập

Truy cập trang đăng nhập, click nút bên dưới form đăng nhập để bắt đầu đăng nhập bên thứ ba.

![](https://static-docs.nocobase.com/202406120014539.png)
