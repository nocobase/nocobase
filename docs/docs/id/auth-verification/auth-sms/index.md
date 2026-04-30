---
pkg: '@nocobase/plugin-auth-sms'
title: "Autentikasi SMS"
description: "Autentikasi SMS NocoBase: mendaftar dan login dengan kode verifikasi SMS, perlu digunakan bersama dengan verifier SMS plugin-verification, mendukung pendaftaran otomatis ketika pengguna belum ada."
keywords: "autentikasi SMS,login SMS,login dengan kode verifikasi,pendaftaran otomatis,NocoBase"
---

# Autentikasi SMS

## Pengantar

Plugin autentikasi SMS mendukung pengguna untuk mendaftar dan login ke NocoBase melalui SMS.

> Perlu digunakan bersama dengan fungsi kode verifikasi SMS yang disediakan oleh [plugin `@nocobase/plugin-verification`](/auth-verification/verification/index.md)

## Menambahkan Autentikasi SMS

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202502282112517.png)

Tambahkan - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Konfigurasi Versi Baru

:::info{title=Tips}
Konfigurasi versi baru diperkenalkan mulai `1.6.0-alpha.30`, dan direncanakan untuk mendapatkan dukungan stabil mulai `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verificator:** Mengikat verifier SMS yang digunakan untuk mengirim kode verifikasi SMS. Jika tidak ada verifier yang tersedia, Anda perlu pergi ke halaman manajemen verifikasi terlebih dahulu untuk membuat verifier SMS.  
Lihat:

- [Verifikasi](../verification/index.md)
- [Verifikasi: SMS](../verification/sms/index.md)

Sign up automatically when the user does not exist: Setelah opsi ini dicentang, ketika nomor telepon yang digunakan pengguna tidak ada, nomor telepon akan digunakan sebagai nickname untuk mendaftarkan pengguna baru.

## Konfigurasi Versi Lama

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Fungsi autentikasi login SMS akan menggunakan Provider kode verifikasi SMS yang telah dikonfigurasi dan diatur sebagai default untuk mengirim SMS.

Sign up automatically when the user does not exist: Setelah opsi ini dicentang, ketika nomor telepon yang digunakan pengguna tidak ada, nomor telepon akan digunakan sebagai nickname untuk mendaftarkan pengguna baru.

## Login

Akses halaman login untuk menggunakan.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)
