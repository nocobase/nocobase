---
pkg: "@nocobase/plugin-wecom"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Sinkronisasi Data Pengguna dari WeChat Work

## Pendahuluan

**Plugin WeChat Work** mendukung sinkronisasi data pengguna dan departemen dari WeChat Work.

## Membuat dan Mengonfigurasi Aplikasi Kustom WeChat Work

Pertama, Anda perlu membuat aplikasi kustom di konsol admin WeChat Work dan mendapatkan **Corp ID**, **AgentId**, serta **Secret**.

Lihat [Autentikasi Pengguna - WeChat Work](/auth-verification/auth-wecom/).

## Menambahkan Sumber Data Sinkronisasi di NocoBase

Buka Pengguna & Izin - Sinkronisasi - Tambah, lalu isi informasi yang telah didapatkan.

![](https://static-docs.nocobase.com/202412041251867.png)

## Mengonfigurasi Sinkronisasi Kontak

Buka konsol admin WeChat Work - Keamanan dan Manajemen - Alat Manajemen, lalu klik Sinkronisasi Kontak.

![](https://static-docs.nocobase.com/202412041249958.png)

Konfigurasikan seperti yang ditunjukkan pada gambar, dan atur IP tepercaya perusahaan.

![](https://static-docs.nocobase.com/202412041250776.png)

Sekarang Anda dapat melanjutkan dengan sinkronisasi data pengguna.

## Mengatur Server Penerima Event

Jika Anda ingin perubahan data pengguna dan departemen di sisi WeChat Work dapat disinkronkan ke aplikasi NocoBase secara tepat waktu, Anda dapat melanjutkan dengan pengaturan lebih lanjut.

Setelah mengisi informasi konfigurasi sebelumnya, Anda dapat menyalin URL notifikasi callback kontak.

![](https://static-docs.nocobase.com/202412041256547.png)

Isikan ke pengaturan WeChat Work, dapatkan Token dan EncodingAESKey, lalu selesaikan konfigurasi sumber data sinkronisasi pengguna NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)