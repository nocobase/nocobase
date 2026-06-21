---
pkg: '@nocobase/plugin-auth-wecom'
title: "Autentikasi: WeCom"
description: "Login WeCom NocoBase: mendukung otorisasi OAuth aplikasi mandiri WeCom, konfigurasi Company ID, AgentId, Secret, authorized callback domain, automatic login."
keywords: "WeCom,login WeCom,OAuth,aplikasi mandiri,AgentId,NocoBase"
---

# Autentikasi: WeCom

## Pengantar

Plugin **WeCom** mendukung pengguna untuk login ke NocoBase menggunakan akun WeCom.

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Membuat dan Mengkonfigurasi Aplikasi Mandiri WeCom

Masuk ke admin backend WeCom, buat aplikasi mandiri WeCom.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Klik aplikasi untuk masuk ke halaman detail, scroll ke bawah, klik "WeCom Authorized Login".

![](https://static-docs.nocobase.com/202406272104655.png)

Atur authorized callback domain ke domain aplikasi NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Kembali ke halaman detail aplikasi, klik "Web Authorization & JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Atur dan verifikasi domain callback yang dapat digunakan sebagai fungsi otorisasi web aplikasi OAuth2.0.

![](https://static-docs.nocobase.com/202406272107899.png)

Pada halaman detail aplikasi, klik "Trusted IP".

![](https://static-docs.nocobase.com/202406272108834.png)

Konfigurasi IP aplikasi NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Mendapatkan Kunci dari Admin Backend WeCom

Pada admin backend WeCom - My Company, salin "Company ID".

![](https://static-docs.nocobase.com/202406272111637.png)

Pada admin backend WeCom - Application Management, masuk ke halaman detail aplikasi yang dibuat di langkah sebelumnya, salin AgentId dan Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Menambahkan Autentikasi WeCom di NocoBase

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202406272115044.png)

Tambahkan - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Konfigurasi

![](https://static-docs.nocobase.com/202412041459250.png)

| Item Konfigurasi                                                                                      | Keterangan                                                                                                | Versi    |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| When a phone number does not match an existing user, <br />should a new user be created automatically | Apakah secara otomatis membuat pengguna baru ketika nomor telepon tidak cocok dengan pengguna yang ada.   | -        |
| Company ID                                                                                            | Company ID, didapat dari admin backend WeCom.                                                              | -        |
| AgentId                                                                                               | Didapat dari konfigurasi aplikasi mandiri di admin backend WeCom.                                          | -        |
| Secret                                                                                                | Didapat dari konfigurasi aplikasi mandiri di admin backend WeCom.                                          | -        |
| Origin                                                                                                | Domain aplikasi saat ini.                                                                                  | -        |
| Workbench application redirect link                                                                   | Path aplikasi yang akan dituju setelah login berhasil.                                                     | `v1.4.0` |
| Automatic login                                                                                       | Saat membuka link aplikasi di browser WeCom, login otomatis. Ketika ada beberapa authenticator WeCom yang dikonfigurasi, hanya satu yang dapat mengaktifkan opsi ini. | `v1.4.0` |
| Workbench application homepage link                                                                   | Link halaman utama aplikasi workbench.                                                                     | -        |

## Mengkonfigurasi Halaman Utama Aplikasi WeCom

:::info
Pada versi `v1.4.0` ke atas, jika opsi "Automatic login" diaktifkan, link halaman utama aplikasi dapat disederhanakan menjadi: `https://<url>/<path>`, misalnya `https://example.nocobase.com/admin`.

Anda juga dapat mengkonfigurasi mobile dan desktop secara terpisah, misalnya `https://example.nocobase.com/m` dan `https://example.nocobase.com/admin`.
:::

Masuk ke admin backend WeCom, isi link halaman utama aplikasi workbench yang disalin ke kolom alamat halaman utama aplikasi terkait.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Login

Akses halaman login, klik tombol di bawah formulir login untuk memulai login pihak ketiga.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Karena pembatasan izin WeCom terhadap informasi sensitif seperti nomor telepon, otorisasi hanya dapat diselesaikan di klien WeCom. Saat pertama kali menggunakan login WeCom, ikuti langkah-langkah di bawah untuk menyelesaikan otorisasi login pertama di klien WeCom.
:::

## Login Pertama Kali

Dari klien WeCom, masuk ke workbench, scroll ke bawah, klik aplikasi untuk masuk ke halaman utama aplikasi yang sebelumnya diisi, lalu otorisasi login pertama dapat diselesaikan. Setelah itu, Anda dapat menggunakan login WeCom di aplikasi NocoBase.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />
