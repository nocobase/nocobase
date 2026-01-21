---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Autentikasi: WeCom

## Pendahuluan

**Plugin WeCom** mendukung pengguna untuk masuk ke NocoBase menggunakan akun WeCom mereka.

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Membuat dan Mengonfigurasi Aplikasi Buatan Sendiri WeCom

Buka konsol admin WeCom untuk membuat aplikasi buatan sendiri.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Klik aplikasi untuk masuk ke halaman detailnya, gulir ke bawah, lalu klik "Login Resmi WeCom".

![](https://static-docs.nocobase.com/202406272104655.png)

Atur domain *callback* resmi ke domain aplikasi NocoBase Anda.

![](https://static-docs.nocobase.com/202406272105662.png)

Kembali ke halaman detail aplikasi dan klik "Otorisasi Web dan JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Atur dan verifikasi domain *callback* untuk fitur otorisasi web OAuth2.0 aplikasi.

![](https://static-docs.nocobase.com/202406272107899.png)

Pada halaman detail aplikasi, klik "IP Tepercaya Perusahaan".

![](https://static-docs.nocobase.com/202406272108834.png)

Konfigurasi IP aplikasi NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Mendapatkan Kredensial dari Konsol Admin WeCom

Di konsol admin WeCom, di bawah "Perusahaan Saya", salin "ID Perusahaan".

![](https://static-docs.nocobase.com/202406272111637.png)

Di konsol admin WeCom, di bawah "Manajemen Aplikasi", buka halaman detail aplikasi yang dibuat pada langkah sebelumnya dan salin AgentId serta Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Menambahkan Autentikasi WeCom di NocoBase

Buka halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202406272115044.png)

Tambah - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Konfigurasi

![](https://static-docs.nocobase.com/202412041459250.png)

| Opsi Konfigurasi                                                                                      | Deskripsi                                                                                                                                                                                     | Persyaratan Versi |
| :---------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------- |
| Saat nomor telepon tidak cocok dengan pengguna yang sudah ada, <br />apakah pengguna baru harus dibuat secara otomatis | Saat nomor telepon tidak cocok dengan pengguna yang sudah ada, apakah akan membuat pengguna baru secara otomatis.                                                                             | -                 |
| ID Perusahaan                                                                                         | ID Perusahaan, didapatkan dari konsol admin WeCom.                                                                                                                                            | -                 |
| AgentId                                                                                               | Didapatkan dari konfigurasi aplikasi buatan sendiri di konsol admin WeCom.                                                                                                                    | -                 |
| Secret                                                                                                | Didapatkan dari konfigurasi aplikasi buatan sendiri di konsol admin WeCom.                                                                                                                    | -                 |
| Origin                                                                                                | Domain aplikasi saat ini.                                                                                                                                                                     | -                 |
| Tautan pengalihan aplikasi *workbench*                                                                | Jalur aplikasi untuk dialihkan setelah berhasil masuk.                                                                                                                                        | `v1.4.0`          |
| Login otomatis                                                                                        | Otomatis masuk saat tautan aplikasi dibuka di peramban WeCom. Jika ada beberapa autentikator WeCom yang dikonfigurasi, hanya satu yang dapat mengaktifkan opsi ini.                            | `v1.4.0`          |
| Tautan beranda aplikasi *workbench*                                                                   | Tautan beranda aplikasi *workbench*.                                                                                                                                                          | -                 |

## Mengonfigurasi Beranda Aplikasi WeCom

:::info
Untuk versi `v1.4.0` dan di atasnya, saat opsi "Login otomatis" diaktifkan, tautan beranda aplikasi dapat disederhanakan menjadi: `https://<url>/<path>`, contohnya `https://example.nocobase.com/admin`.

Anda juga dapat mengonfigurasi tautan terpisah untuk seluler dan desktop, contohnya `https://example.nocobase.com/m` dan `https://example.nocobase.com/admin`.
:::

Buka konsol admin WeCom dan tempel tautan beranda aplikasi *workbench* yang telah disalin ke kolom alamat beranda aplikasi yang sesuai.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Login

Kunjungi halaman login dan klik tombol di bawah formulir login untuk memulai login pihak ketiga.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Karena batasan izin WeCom pada informasi sensitif seperti nomor telepon, otorisasi hanya dapat diselesaikan di dalam klien WeCom. Saat login dengan WeCom untuk pertama kalinya, ikuti langkah-langkah di bawah ini untuk menyelesaikan otorisasi login awal di dalam klien WeCom.
:::

## Login Pertama Kali

Dari klien WeCom, buka *Workbench*, gulir ke bawah, dan klik aplikasi untuk masuk ke beranda yang telah Anda konfigurasikan sebelumnya. Ini akan menyelesaikan otorisasi awal. Setelah itu, Anda dapat menggunakan WeCom untuk login ke aplikasi NocoBase Anda.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />