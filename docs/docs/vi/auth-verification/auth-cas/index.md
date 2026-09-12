---
pkg: '@nocobase/plugin-auth-cas'
title: "Xác thực: CAS"
description: "Xác thực CAS NocoBase: tuân theo giao thức Central Authentication Service, đăng nhập bằng tài khoản IdP bên thứ ba, kích hoạt plugin, thêm xác thực, cấu hình và đăng nhập."
keywords: "CAS,Central Authentication Service,SSO,đăng nhập một lần,IdP,NocoBase"
---

# Xác thực: CAS

## Giới thiệu

Plugin Xác thực: CAS tuân theo chuẩn giao thức CAS (Central Authentication Service), cho phép người dùng đăng nhập NocoBase bằng tài khoản do nhà cung cấp dịch vụ xác thực danh tính bên thứ ba (IdP) cung cấp.

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
