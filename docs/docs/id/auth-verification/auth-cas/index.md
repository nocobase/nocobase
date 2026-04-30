---
pkg: '@nocobase/plugin-auth-cas'
title: "Autentikasi: CAS"
description: "Autentikasi CAS NocoBase: mengikuti protokol Central Authentication Service, login menggunakan akun IdP pihak ketiga, mengaktifkan plugin, menambahkan autentikasi, mengkonfigurasi, dan login."
keywords: "CAS,Central Authentication Service,SSO,Single Sign-On,IdP,NocoBase"
---

# Autentikasi: CAS

## Pengantar

Plugin Autentikasi: CAS mengikuti standar protokol CAS (Central Authentication Service), memungkinkan pengguna login ke NocoBase menggunakan akun yang disediakan oleh penyedia layanan autentikasi identitas pihak ketiga (IdP).

## Instalasi

## Petunjuk Penggunaan

### Mengaktifkan Plugin

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Menambahkan Autentikasi CAS

Akses halaman manajemen autentikasi pengguna

http://localhost:13000/admin/settings/auth/authenticators

Tambahkan metode autentikasi CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Konfigurasi CAS dan aktifkan

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Akses Halaman Login

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)
