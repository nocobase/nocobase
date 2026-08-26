---
title: "Autentikasi Pengguna"
description: "Modul autentikasi pengguna NocoBase: antarmuka autentikasi kernel, plugin autentikasi password, mendukung metode autentikasi yang dapat diperluas seperti SAML, OIDC, CAS, LDAP, WeCom, DingTalk, dan SMS."
keywords: "autentikasi pengguna,login,daftar,autentikasi password,Single Sign-On,plugin autentikasi,NocoBase"
---

# Autentikasi Pengguna

Modul autentikasi pengguna NocoBase terutama terdiri dari dua bagian:

- `@nocobase/auth` di kernel mendefinisikan antarmuka dan middleware yang dapat diperluas terkait autentikasi pengguna seperti login, pendaftaran, dan validasi, serta digunakan untuk mendaftarkan dan mengelola berbagai metode autentikasi yang dapat diperluas.
- `@nocobase/plugin-auth` di plugin digunakan untuk menginisialisasi modul manajemen autentikasi di kernel, dan juga menyediakan metode autentikasi dasar berupa username (atau email)/password.

> Perlu digunakan bersama dengan fungsi manajemen pengguna yang disediakan oleh [plugin `@nocobase/plugin-users`](/users-permissions/user)

Selain itu, NocoBase juga menyediakan berbagai plugin metode autentikasi pengguna lainnya:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/index.md) - Menyediakan fungsi login dengan verifikasi SMS
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/index.md) - Menyediakan fungsi login SSO SAML
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/index.md) - Menyediakan fungsi login SSO OIDC
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/index.md) - Menyediakan fungsi login SSO CAS
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/index.md) - Menyediakan fungsi login SSO LDAP
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/index.md) - Menyediakan fungsi login WeCom
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/index.md) - Menyediakan fungsi login DingTalk

Melalui plugin-plugin di atas, setelah administrator mengkonfigurasi metode autentikasi yang sesuai, pengguna dapat langsung login ke sistem menggunakan identitas pengguna yang disediakan oleh platform seperti Google Workspace dan Microsoft Azure, atau dapat juga terhubung ke alat platform seperti Auth0, Logto, dan Keycloak. Selain itu, developer juga dapat dengan mudah memperluas metode autentikasi lain yang dibutuhkan melalui antarmuka dasar yang kami sediakan.
