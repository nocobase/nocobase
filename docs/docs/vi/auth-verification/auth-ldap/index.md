---
pkg: '@nocobase/plugin-auth-ldap'
title: "Xác thực: LDAP"
description: "Xác thực LDAP NocoBase: tuân theo giao thức LDAP, đăng nhập bằng tài khoản và mật khẩu của LDAP server, cấu hình LDAP URL, Bind DN, Search DN, ánh xạ thuộc tính."
keywords: "LDAP,directory service,xác thực doanh nghiệp,Bind DN,Search DN,ánh xạ thuộc tính,NocoBase"
---

# Xác thực: LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Giới thiệu

Plugin Xác thực: LDAP tuân theo chuẩn giao thức LDAP (Lightweight Directory Access Protocol), cho phép người dùng đăng nhập NocoBase bằng tài khoản và mật khẩu của LDAP server.

## Kích hoạt plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Thêm xác thực LDAP

Vào trang quản lý plugin xác thực người dùng.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Thêm - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Cấu hình

### Cấu hình cơ bản

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - Khi không tìm thấy người dùng hiện có để match, có tự động tạo người dùng mới hay không.
- LDAP URL - Địa chỉ LDAP server
- Bind DN - DN dùng để test kết nối server và search người dùng
- Bind password - Mật khẩu của Bind DN
- Test connection - Click nút để test kết nối server và tính hợp lệ của Bind DN.

### Cấu hình tìm kiếm

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - DN dùng để search người dùng
- Search filter - Điều kiện filter search người dùng, dùng `{{account}}` để biểu thị tài khoản người dùng nhập khi đăng nhập
- Scope - `Base`, `One level`, `Subtree`, mặc định `Subtree`
- Size limit - Kích thước phân trang search

### Ánh xạ thuộc tính

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - Field dùng để gắn người dùng hiện có. Nếu tài khoản đăng nhập là username, chọn username; nếu là email thì chọn email. Mặc định là username.
- Attribute map - Ánh xạ thuộc tính người dùng với field của bảng users NocoBase.

## Đăng nhập

Truy cập trang đăng nhập, nhập username và mật khẩu LDAP để đăng nhập.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>
