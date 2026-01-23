---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Autentikasi: SAML 2.0

## Pendahuluan

Plugin Autentikasi: SAML 2.0 mengikuti standar protokol SAML 2.0 (Security Assertion Markup Language 2.0), memungkinkan pengguna untuk masuk ke NocoBase menggunakan akun yang disediakan oleh penyedia layanan autentikasi identitas pihak ketiga (IdP).

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Menambahkan Autentikasi SAML

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202411130004459.png)

Tambah - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Konfigurasi

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

-   **URL SSO** - Disediakan oleh IdP, digunakan untuk *single sign-on*.
-   **Sertifikat Publik (*Public Certificate*)** - Disediakan oleh IdP.
-   **ID Entitas (*IdP Issuer*)** - Opsional, disediakan oleh IdP.
-   **HTTP** - Centang jika aplikasi NocoBase Anda menggunakan protokol HTTP.
-   **Gunakan kolom ini untuk mengikat pengguna** - Kolom yang digunakan untuk mencocokkan dan mengikat dengan pengguna yang sudah ada. Dapat memilih email atau nama pengguna, defaultnya adalah email. Informasi pengguna yang dibawa oleh IdP perlu menyertakan kolom `email` atau `username`.
-   **Daftar otomatis jika pengguna tidak ada** - Apakah akan membuat pengguna baru secara otomatis jika tidak ditemukan pengguna yang cocok.
-   **Penggunaan** - `SP Issuer / EntityID` dan `ACS URL` digunakan untuk disalin dan diisi ke dalam konfigurasi yang sesuai di IdP.

## Pemetaan Kolom

Pemetaan kolom perlu dikonfigurasi pada platform konfigurasi IdP. Anda dapat merujuk ke [contoh](./examples/google.md).

Kolom yang tersedia untuk pemetaan di NocoBase adalah:

-   email (wajib)
-   phone (hanya berlaku untuk platform yang mendukung `phone` dalam cakupannya, seperti Alibaba Cloud, Feishu)
-   nickname
-   username
-   firstName
-   lastName

`nameID` dibawa oleh protokol SAML dan tidak perlu dipetakan; ini akan disimpan sebagai pengidentifikasi pengguna yang unik.
Prioritas aturan penggunaan nama panggilan pengguna baru: `nickname` > `firstName lastName` > `username` > `nameID`
Saat ini, pemetaan organisasi dan peran pengguna belum didukung.

## Masuk

Kunjungi halaman masuk, lalu klik tombol di bawah formulir masuk untuk memulai masuk pihak ketiga.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)