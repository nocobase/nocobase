---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Autentikasi: DingTalk"
description: "Login DingTalk NocoBase: mendukung login akun DingTalk, mengkonfigurasi Client ID, Client Secret, callback URL, mengaktifkan izin nomor telepon pribadi dan kontak."
keywords: "DingTalk,login DingTalk,OAuth,Client ID,callback URL,NocoBase"
---

# Autentikasi: DingTalk

## Pengantar

Plugin Autentikasi: DingTalk mendukung pengguna untuk login ke NocoBase menggunakan akun DingTalk.

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Mendaftar Izin Antarmuka di DingTalk Developer Backend

Lihat <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Open Platform - Implementasi Login Situs Web Pihak Ketiga</a>, lalu buat sebuah aplikasi.

Masuk ke aplikasi backend, aktifkan "Informasi Nomor Telepon Pribadi" dan "Izin Baca Informasi Pribadi Kontak".

![](https://static-docs.nocobase.com/202406120006620.png)

## Mendapatkan Kunci dari DingTalk Developer Backend

Salin Client ID dan Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Menambahkan Autentikasi DingTalk di NocoBase

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202406112348051.png)

Tambahkan - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Konfigurasi

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - Apakah secara otomatis membuat pengguna baru ketika nomor telepon tidak cocok dengan pengguna yang ada.
- Client ID dan Client Secret - Isi dengan informasi yang disalin pada langkah sebelumnya.
- Redirect URL - Callback URL, salin dan masuk ke langkah berikutnya.

## Mengkonfigurasi Callback URL di DingTalk Developer Backend

Isi callback URL yang disalin ke DingTalk developer backend.

![](https://static-docs.nocobase.com/202406120012221.png)

## Login

Akses halaman login, klik tombol di bawah formulir login untuk memulai login pihak ketiga.

![](https://static-docs.nocobase.com/202406120014539.png)
