---
pkg: '@nocobase/plugin-verification-totp-authenticator'
title: "Verifikasi: TOTP Authenticator"
description: "TOTP authenticator NocoBase: time-based one-time password yang sesuai dengan RFC-6238, mendukung authenticator seperti Google Authenticator, pengikatan dan pelepasan ikatan pengguna."
keywords: "TOTP,Google Authenticator,one-time password,OTP,RFC-6238,pengikatan authenticator,NocoBase"
---

# Verifikasi: TOTP Authenticator

## Pengantar

Verifikasi TOTP authenticator mendukung pengguna untuk mengikat authenticator yang sesuai dengan spesifikasi TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), melakukan verifikasi identitas melalui time-based one-time password (TOTP).

## Konfigurasi Administrator

Masuk ke halaman manajemen verifikasi.

![](https://static-docs.nocobase.com/202502271726791.png)

Tambahkan - TOTP Authenticator

![](https://static-docs.nocobase.com/202502271745028.png)

Selain identifier unik dan judul, TOTP authenticator tidak memerlukan konfigurasi lain.

![](https://static-docs.nocobase.com/202502271746034.png)

## Pengikatan Pengguna

Setelah authenticator ditambahkan, pengguna dapat mengikat TOTP authenticator pada manajemen verifikasi di pusat profil.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Saat ini plugin belum menyediakan mekanisme recovery code, harap pengguna menyimpan dengan baik setelah mengikat TOTP authenticator. Jika authenticator hilang, Anda dapat menggunakan metode verifikasi lain untuk verifikasi identitas, atau melepas ikatan melalui metode verifikasi lain lalu mengikat ulang.
:::

## Pelepasan Ikatan Pengguna

Pelepasan ikatan authenticator perlu dilakukan dengan verifikasi melalui metode verifikasi yang telah diikat.

![](https://static-docs.nocobase.com/202502282103205.png)
