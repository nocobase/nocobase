---
pkg: '@nocobase/plugin-verification'
title: "Manajemen Verifikasi"
description: "Pusat manajemen verifikasi NocoBase: kode verifikasi SMS, TOTP authenticator, mendukung login SMS, 2FA, verifikasi sekunder operasi berisiko, tipe dan skenario verifikasi yang dapat diperluas."
keywords: "manajemen verifikasi,kode verifikasi SMS,TOTP,2FA,verifikasi identitas,verifikasi sekunder,NocoBase"
---

# Verifikasi

:::info{title=Tips}
Mulai `1.6.0-alpha.30`, fitur **Kode Verifikasi** asli telah ditingkatkan menjadi **Manajemen Verifikasi**, mendukung manajemen dan integrasi dengan berbagai metode verifikasi identitas pengguna. Setelah pengguna mengikat metode verifikasi yang sesuai, mereka dapat melakukan verifikasi identitas pada skenario yang diperlukan. Fitur ini direncanakan untuk mendapatkan dukungan stabil mulai `1.7.0`.
:::

<PluginInfo name="verification"></PluginInfo>

## Pengantar

**Pusat manajemen verifikasi mendukung manajemen dan integrasi berbagai metode verifikasi identitas pengguna.** Misalnya:

- Kode verifikasi SMS - Disediakan secara default oleh plugin verifikasi. Lihat: [Verifikasi: SMS](./sms)
- TOTP authenticator - Lihat: [Verifikasi: TOTP Authenticator](../verification-totp/index.md)

Developer juga dapat memperluas tipe verifikasi lain dalam bentuk plugin. Lihat: [Memperluas Tipe Verifikasi](./dev/type)

**Setelah pengguna mengikat metode verifikasi yang sesuai, mereka dapat melakukan verifikasi identitas pada skenario yang diperlukan.** Misalnya:

- Login dengan kode verifikasi SMS - Lihat: [Autentikasi: SMS](./sms)
- Two-Factor Authentication (2FA) - Lihat: [Two-Factor Authentication (2FA)](../2fa)
- Verifikasi sekunder operasi berisiko - Akan didukung di masa depan

Developer juga dapat memperluas dalam bentuk plugin untuk mengintegrasikan verifikasi identitas ke dalam skenario lain yang diperlukan. Lihat: [Memperluas Skenario Verifikasi](./dev/scene)

**Perbedaan dan keterkaitan antara modul verifikasi dengan modul autentikasi pengguna:** Modul autentikasi pengguna terutama bertanggung jawab atas autentikasi identitas pada skenario login pengguna, di mana alur seperti login SMS dan Two-Factor Authentication bergantung pada verifier yang disediakan oleh modul verifikasi; modul verifikasi bertanggung jawab atas verifikasi identitas pada berbagai operasi berisiko, dan login pengguna adalah salah satu skenario operasi berisiko.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)
