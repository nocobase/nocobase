---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Verifikasi: Autentikator TOTP

## Pendahuluan

Autentikator TOTP memungkinkan pengguna untuk mengikat autentikator apa pun yang sesuai dengan spesifikasi TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), dan melakukan verifikasi identitas menggunakan kata sandi satu kali berbasis waktu (TOTP).

## Konfigurasi Administrator

Buka halaman Manajemen Verifikasi.

![](https://static-docs.nocobase.com/202502271726791.png)

Tambah - Autentikator TOTP

![](https://static-docs.nocobase.com/202502271745028.png)

Selain pengenal unik dan judul, tidak ada konfigurasi tambahan yang diperlukan untuk autentikator TOTP.

![](https://static-docs.nocobase.com/202502271746034.png)

## Pengikatan Pengguna

Setelah menambahkan autentikator, pengguna dapat mengikat autentikator TOTP di area manajemen verifikasi pribadi mereka.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Plugin saat ini belum menyediakan mekanisme kode pemulihan. Setelah autentikator TOTP terikat, pengguna disarankan untuk menyimpannya dengan aman. Jika autentikator tidak sengaja hilang, mereka dapat menggunakan metode verifikasi alternatif untuk memverifikasi identitas mereka, melepaskan ikatan autentikator, lalu mengikatnya kembali.
:::

## Pelepasan Ikatan Pengguna

Melepaskan ikatan autentikator memerlukan verifikasi menggunakan metode verifikasi yang sudah terikat.

![](https://static-docs.nocobase.com/202502282103205.png)