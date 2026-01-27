---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Autentikasi: DingTalk

## Pendahuluan

Plugin Autentikasi: DingTalk memungkinkan pengguna untuk masuk ke NocoBase menggunakan akun DingTalk mereka.

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Mengajukan Izin API di Konsol Pengembang DingTalk

Lihat <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Platform Terbuka DingTalk - Menerapkan Login ke Situs Web Pihak Ketiga</a> untuk membuat aplikasi.

Masuk ke konsol manajemen aplikasi dan aktifkan "Informasi Nomor Telepon Pribadi" dan "Izin Baca Informasi Pribadi Buku Alamat".

![](https://static-docs.nocobase.com/202406120006620.png)

## Mendapatkan Kredensial dari Konsol Pengembang DingTalk

Salin Client ID dan Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Menambahkan Autentikasi DingTalk di NocoBase

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202406112348051.png)

Tambahkan - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Konfigurasi

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - Apakah akan membuat pengguna baru secara otomatis jika tidak ada pengguna yang cocok dengan nomor telepon.
- Client ID dan Client Secret - Isi informasi yang disalin pada langkah sebelumnya.
- Redirect URL - URL Callback, salin dan lanjutkan ke langkah berikutnya.

## Mengonfigurasi URL Callback di Konsol Pengembang DingTalk

Tempel URL Callback yang disalin ke Konsol Pengembang DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Masuk

Kunjungi halaman masuk dan klik tombol di bawah formulir masuk untuk memulai login pihak ketiga.

![](https://static-docs.nocobase.com/202406120014539.png)