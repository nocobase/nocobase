---
pkg: '@nocobase/plugin-auth'
title: "Manajemen Authenticator"
description: "Manajemen authenticator NocoBase: mengaktifkan authenticator, menambahkan tipe autentikasi, mengkonfigurasi tampilan halaman login, mendukung password, SAML, OIDC, dan metode autentikasi lainnya yang dapat diperluas."
keywords: "manajemen authenticator,tipe autentikasi,mengaktifkan authenticator,konfigurasi halaman login,NocoBase"
---

# Manajemen Authenticator

## Manajemen Autentikasi Pengguna

Saat plugin autentikasi pengguna diinstal, akan diinisialisasi metode autentikasi `Password` berbasis username dan email pengguna.

![](https://static-docs.nocobase.com/66eaa9d5421c9cb713b117366bd8a5d5.png)

## Mengaktifkan Authenticator

![](https://static-docs.nocobase.com/7f1fb8f8ca5de67ffc68eff0a65848f5.png)

Hanya tipe autentikasi yang aktif yang akan ditampilkan di halaman login.

![](https://static-docs.nocobase.com/8375a36ef98417af0f0977f1e07345dd.png)

## Tipe Autentikasi Pengguna

![](https://static-docs.nocobase.com/da4250c0cea343ebe470cbf7be4b12e4.png)

Dengan menambahkan authenticator dengan tipe yang berbeda, Anda dapat menambahkan metode autentikasi yang sesuai pada sistem.

Selain tipe autentikasi yang disediakan oleh plugin yang sudah ada, developer juga dapat memperluas tipe autentikasi pengguna sendiri. Lihat [Panduan Pengembangan](./dev/index.md).
