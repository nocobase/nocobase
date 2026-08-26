---
pkg: '@nocobase/plugin-auth-saml'
title: "Autentikasi: SAML 2.0"
description: "Autentikasi SSO SAML 2.0 NocoBase: mengikuti protokol SAML, mengintegrasikan IdP (seperti Google Workspace), mengkonfigurasi SSO URL, public key, dan field mapping."
keywords: "SAML 2.0,SSO,Single Sign-On,IdP,Google Workspace,field mapping,NocoBase"
---

# Autentikasi: SAML 2.0

## Pengantar

Plugin Autentikasi: SAML 2.0 mengikuti standar protokol SAML 2.0 (Security Assertion Markup Language 2.0), memungkinkan pengguna login ke NocoBase menggunakan akun yang disediakan oleh penyedia layanan autentikasi identitas pihak ketiga (IdP).

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Menambahkan Autentikasi SAML

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202411130004459.png)

Tambahkan - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Konfigurasi

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - URL untuk Single Sign-On yang disediakan oleh IdP
- Public Certificate - Disediakan oleh IdP
- IdP Issuer (Entity ID) - Opsional, disediakan oleh IdP
- http - Centang jika aplikasi NocoBase Anda menggunakan protokol http
- Use this field to bind the user - Field yang digunakan untuk mencocokkan dan mengikat pengguna yang ada, dapat dipilih email atau username, default email. Informasi pengguna yang dibawa IdP harus berisi field `email` atau `username`.
- Sign up automatically when the user does not exist - Apakah secara otomatis membuat pengguna baru ketika tidak ditemukan pengguna yang dapat dicocokkan dan diikat.
- Usage - `SP Issuer / EntityID` dan `ACS URL` digunakan untuk disalin dan diisi pada konfigurasi IdP terkait.

## Field Mapping

Field mapping perlu dikonfigurasi pada platform konfigurasi IdP. Lihat [contoh](./examples/google.md).

Field yang dapat dipetakan oleh NocoBase:

- email (wajib)
- phone (hanya berlaku pada platform yang scope-nya mendukung `phone`, seperti Alibaba Cloud, Feishu)
- nickname
- username
- firstName
- lastName

`nameID` dibawa oleh protokol SAML, tidak perlu dipetakan, dan akan disimpan sebagai identifier unik pengguna.
Aturan prioritas nickname pengguna baru: `nickname` > `firstName lastName` > `username` > `nameID`
Saat ini belum mendukung pemetaan organisasi dan role pengguna.

## Login

Akses halaman login, klik tombol di bawah formulir login untuk memulai login pihak ketiga.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)
