---
pkg: '@nocobase/plugin-app-supervisor'
title: 'App SSO'
description: 'App SSO dalam multi-app: login otomatis ke sub-aplikasi dari aplikasi utama atau app switcher, dengan mapping username dan signup otomatis.'
keywords: 'multi-app,App SSO,login otomatis,app switcher,sub-aplikasi,NocoBase'
---

# App SSO

App SSO menyederhanakan proses login saat pengguna masuk ke sub-aplikasi dalam skenario multi-app.

Setelah diaktifkan, saat pengguna masuk ke sub-aplikasi dari entry aplikasi utama atau berpindah antar sub-aplikasi, sistem akan mencoba login otomatis ke sub-aplikasi tujuan sebagai pengguna saat ini. Pengguna tidak perlu mengisi username dan password berulang kali di setiap sub-aplikasi.

## Skenario penggunaan

App SSO cocok untuk skenario berikut:

- Aplikasi utama menjadi entry terpadu menuju berbagai sub-aplikasi bisnis
- Sistem dipisah menjadi beberapa sub-aplikasi, tetapi pengalaman login tetap berkelanjutan
- Pengguna sering berpindah antar sub-aplikasi
- Akun pengguna antar sub-aplikasi dipetakan dengan username yang sama

## Mengaktifkan App SSO

Buka "App Supervisor", buat atau edit sub-aplikasi, lalu aktifkan "App SSO" di "Authentication configuration".

Setelah aktif, sub-aplikasi dapat memicu login otomatis melalui entry aplikasi utama atau app switcher.

> Setelah mengubah konfigurasi autentikasi, biasanya sub-aplikasi perlu direstart agar perubahan berlaku.

![](https://static-docs.nocobase.com/202605271406542.png)

## Signup otomatis

Jika pengguna terkait belum ada di sub-aplikasi tujuan, Anda dapat mengaktifkan "Automatically sign up when user does not exist".

Setelah aktif, saat pengguna pertama kali masuk melalui App SSO, sistem membuat pengguna dasar di sub-aplikasi berdasarkan informasi pengguna dari aplikasi utama.

Mapping pengguna terutama berdasarkan username:

- Jika username sama di aplikasi utama dan sub-aplikasi, pengguna terkait di sub-aplikasi akan login
- Jika username belum ada di sub-aplikasi, pengguna hanya dibuat ketika signup otomatis aktif
- Jika signup otomatis tidak aktif, administrator perlu membuat pengguna terlebih dahulu di sub-aplikasi

Role dan permission setelah pengguna dibuat ditentukan oleh konfigurasi pengguna dan permission sub-aplikasi.

## Entry yang memicu login otomatis

App SSO terutama dipicu oleh:

- Masuk ke sub-aplikasi dari entry aplikasi utama
- Masuk dari app switcher di kiri atas
- Berpindah dari satu sub-aplikasi ke sub-aplikasi lain

Akses langsung ke halaman login atau alamat sub-aplikasi tidak memaksa status login aplikasi utama. Ini menjaga metode login milik sub-aplikasi.

## FAQ

### Sudah diaktifkan tetapi belum login otomatis?

Periksa:

- Apakah App SSO sudah aktif untuk sub-aplikasi
- Apakah sub-aplikasi sudah direstart
- Apakah pengguna masuk dari entry aplikasi utama atau app switcher
- Apakah ada pengguna dengan username yang sama di sub-aplikasi
- Jika pengguna belum ada, apakah signup otomatis sudah aktif

### Mengapa akses langsung ke sub-aplikasi tidak login otomatis?

Ini perilaku yang diharapkan. Saat diakses langsung, sub-aplikasi mungkin perlu menggunakan metode loginnya sendiri.
