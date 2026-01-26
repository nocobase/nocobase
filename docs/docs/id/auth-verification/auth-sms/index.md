---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Autentikasi SMS

## Pendahuluan

Plugin autentikasi SMS mendukung pengguna untuk mendaftar dan masuk ke NocoBase melalui SMS.

> Ini memerlukan penggunaan bersama dengan fungsi kode verifikasi SMS yang disediakan oleh [`@nocobase/plugin-verification` plugin](/auth-verification/verification/).

## Menambahkan Autentikasi SMS

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202502282112517.png)

Tambahkan - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Konfigurasi Versi Baru

:::info{title=Catatan}
Konfigurasi baru diperkenalkan pada `1.6.0-alpha.30` dan direncanakan untuk dukungan stabil mulai dari `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verifikator:** Ikat verifikator SMS untuk mengirim kode verifikasi SMS. Jika tidak ada verifikator yang tersedia, Anda perlu pergi ke halaman manajemen Verifikasi untuk membuat verifikator SMS terlebih dahulu.
Lihat juga:

- [Verifikasi](../verification/index.md)
- [Verifikasi: SMS](../verification/sms/index.md)

**Daftar otomatis saat pengguna tidak ada:** Ketika opsi ini dicentang, jika nomor telepon pengguna tidak ada, pengguna baru akan didaftarkan menggunakan nomor telepon sebagai nama panggilan.

## Konfigurasi Versi Lama

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Fitur autentikasi masuk SMS akan menggunakan Provider kode verifikasi SMS yang telah dikonfigurasi dan diatur sebagai default untuk mengirim pesan teks.

**Daftar otomatis saat pengguna tidak ada:** Ketika opsi ini dicentang, jika nomor telepon pengguna tidak ada, pengguna baru akan didaftarkan menggunakan nomor telepon sebagai nama panggilan.

## Masuk

Kunjungi halaman masuk untuk menggunakannya.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)