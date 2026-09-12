---
title: "Ví dụ cấu hình OIDC: Sign in with Google"
description: "Cấu hình đăng nhập OIDC với Google OAuth 2.0: tạo OAuth client ID, cấu hình authorized redirect URL, thêm authenticator OIDC trên NocoBase."
keywords: "OIDC,Google,OAuth 2.0,Sign in with Google,authorized redirect,NocoBase"
---

# Sign in with Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Lấy thông tin Google OAuth 2.0

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Tạo thông tin xác thực - OAuth client ID

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Vào giao diện cấu hình, điền authorized redirect URL. Redirect URL có thể lấy được khi thêm authenticator trên NocoBase, thường có dạng `http(s)://host:port/api/oidc:redirect`. Xem phần [Hướng dẫn sử dụng - Cấu hình](../index.md#cấu-hình).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Thêm authenticator trên NocoBase

Cài đặt plugin - Xác thực người dùng - Thêm - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Tham khảo các tham số được giới thiệu trong [Hướng dẫn sử dụng - Cấu hình](../index.md#cấu-hình) để hoàn tất cấu hình authenticator.
