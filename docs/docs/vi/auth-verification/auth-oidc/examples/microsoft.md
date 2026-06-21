---
title: "Ví dụ cấu hình OIDC: Microsoft Entra ID"
description: "Cấu hình đăng nhập OIDC với Microsoft Entra ID: đăng ký ứng dụng, cấu hình callback URL, lấy Client ID, Client Secret, Tenant ID, điền vào authenticator NocoBase."
keywords: "OIDC,Microsoft Entra,Azure AD,OAuth,Client ID,callback URL,NocoBase"
---

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Thêm authenticator trên NocoBase

Trước tiên thêm một authenticator mới trên NocoBase: Cài đặt plugin - Xác thực người dùng - Thêm - OIDC.

Copy callback URL.

![](https://static-docs.nocobase.com/202412021504114.png)

## Đăng ký ứng dụng

Mở Microsoft Entra Admin Center, đăng ký một ứng dụng mới.

![](https://static-docs.nocobase.com/202412021506837.png)

Điền callback URL vừa copy vào đây.

![](https://static-docs.nocobase.com/202412021520696.png)

## Lấy và điền thông tin tương ứng

Click vào ứng dụng vừa đăng ký, copy **Application (client) ID** và **Directory (tenant) ID** trên trang chính.

![](https://static-docs.nocobase.com/202412021522063.png)

Click Certificates & secrets, tạo một Client secret mới và copy **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Mối quan hệ giữa các thông tin trên và cấu hình authenticator NocoBase như sau:

| Thông tin Microsoft Entra | Cấu hình authenticator NocoBase |
| ------------------------- | ------------------------------ |
| Application (client) ID | Client ID |
| Client secrets - Value | Client secret |
| Directory (tenant) ID | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, `{tenant}` cần thay bằng Directory (tenant) ID tương ứng |
