---
title: "Xác thực người dùng"
description: "Module xác thực người dùng NocoBase: interface xác thực core, plugin xác thực mật khẩu, hỗ trợ SAML, OIDC, CAS, LDAP, WeCom, DingTalk, SMS và các phương thức xác thực mở rộng."
keywords: "xác thực người dùng,đăng nhập,đăng ký,xác thực mật khẩu,đăng nhập một lần,plugin xác thực,NocoBase"
---

# Xác thực người dùng

Module xác thực người dùng NocoBase được tạo thành từ hai phần chính:

- `@nocobase/auth` trong core định nghĩa các interface có thể mở rộng và middleware liên quan đến xác thực người dùng như đăng nhập, đăng ký, kiểm tra, đồng thời dùng để đăng ký và quản lý các phương thức xác thực mở rộng
- Plugin `@nocobase/plugin-auth` dùng để khởi tạo module quản lý xác thực trong core, đồng thời cung cấp phương thức xác thực cơ bản bằng tên người dùng (hoặc email)/mật khẩu.

> Cần kết hợp với chức năng quản lý người dùng được cung cấp bởi [plugin `@nocobase/plugin-users`](/users-permissions/user)

Ngoài ra, NocoBase còn cung cấp nhiều plugin xác thực người dùng khác

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/index.md) - cung cấp chức năng đăng nhập bằng SMS
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/index.md) - cung cấp chức năng đăng nhập SAML SSO
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/index.md) - cung cấp chức năng đăng nhập OIDC SSO
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/index.md) - cung cấp chức năng đăng nhập CAS SSO
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/index.md) - cung cấp chức năng đăng nhập LDAP SSO
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/index.md) - cung cấp chức năng đăng nhập WeCom
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/index.md) - cung cấp chức năng đăng nhập DingTalk

Thông qua các plugin trên, sau khi quản trị viên cấu hình phương thức xác thực tương ứng, người dùng có thể đăng nhập trực tiếp bằng danh tính được cung cấp bởi Google Workspace, Microsoft Azure, hoặc kết nối với các công cụ nền tảng như Auth0, Logto, Keycloak. Ngoài ra, bạn cũng có thể dễ dàng mở rộng các phương thức xác thực khác thông qua interface cơ bản mà chúng tôi cung cấp.
