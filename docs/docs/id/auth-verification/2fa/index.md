---
pkg: '@nocobase/plugin-two-factor-authentication'
title: "Two-Factor Authentication (2FA)"
description: "Two-Factor Authentication NocoBase: verifikasi tambahan saat login password (OTP, TOTP), administrator mengaktifkan 2FA, mengikat authenticator, alur pengikatan dan verifikasi pengguna."
keywords: "2FA,Two-Factor Authentication,MFA,OTP,TOTP,pengikatan authenticator,NocoBase"
---

# Two-Factor Authentication (2FA)

## Pengantar

Two-Factor Authentication (2FA) adalah langkah verifikasi identitas tambahan yang digunakan saat login ke aplikasi. Ketika 2FA diaktifkan pada aplikasi, pengguna harus menyediakan metode verifikasi identitas lain saat login dengan password, seperti: kode verifikasi OTP, TOTP, dan lain-lain.

:::info{title=Tips}
Saat ini alur 2FA hanya berlaku untuk login dengan password. Jika aplikasi Anda mengaktifkan metode autentikasi lain seperti SSO, harap gunakan langkah-langkah perlindungan Multi-Factor Authentication (MFA) yang disediakan oleh IdP terkait.  
:::

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Konfigurasi Administrator

Setelah plugin diaktifkan, halaman konfigurasi 2FA akan ditambahkan pada halaman manajemen authenticator.

Administrator perlu mencentang opsi "Aktifkan Two-Factor Authentication (2FA) untuk semua pengguna", dan juga perlu memilih authenticator dengan tipe yang tersedia untuk diikat. Jika tidak ada authenticator yang tersedia, Anda perlu pergi ke halaman manajemen verifikasi terlebih dahulu untuk membuat authenticator baru. Lihat: [Verifikasi](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Login Pengguna

Setelah 2FA diaktifkan pada aplikasi, ketika pengguna login dengan password, mereka akan masuk ke alur verifikasi 2FA.

Jika pengguna belum mengikat salah satu dari authenticator yang ditentukan, pengguna akan diminta untuk melakukan pengikatan. Setelah pengikatan berhasil, pengguna dapat masuk ke aplikasi.

![](https://static-docs.nocobase.com/202502282110829.png)

Jika pengguna telah mengikat salah satu authenticator yang ditentukan, pengguna akan diminta untuk melakukan verifikasi identitas melalui authenticator yang telah diikat. Setelah verifikasi berhasil, pengguna dapat masuk ke aplikasi.

![](https://static-docs.nocobase.com/202502282110148.png)

Setelah berhasil login, pengguna dapat mengikat authenticator lain di halaman manajemen verifikasi pada pusat profil.

![](https://static-docs.nocobase.com/202502282110024.png)
