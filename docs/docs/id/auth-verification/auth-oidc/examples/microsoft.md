---
title: "Contoh Konfigurasi OIDC: Microsoft Entra ID"
description: "Konfigurasi login OIDC dengan Microsoft Entra ID: mendaftarkan aplikasi, mengkonfigurasi callback URL, mendapatkan Client ID, Client Secret, Tenant ID, lalu mengisi authenticator NocoBase."
keywords: "OIDC,Microsoft Entra,Azure AD,OAuth,Client ID,callback URL,NocoBase"
---

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Menambahkan Authenticator Baru di NocoBase

Pertama, tambahkan authenticator baru di NocoBase: Plugin Settings - Autentikasi Pengguna - Tambah - OIDC.

Salin callback URL.

![](https://static-docs.nocobase.com/202412021504114.png)

## Mendaftarkan Aplikasi

Buka Microsoft Entra Admin Center, daftarkan aplikasi baru.

![](https://static-docs.nocobase.com/202412021506837.png)

Di sini, isi callback URL yang baru saja Anda salin.

![](https://static-docs.nocobase.com/202412021520696.png)

## Mendapatkan dan Mengisi Informasi Terkait

Klik untuk masuk ke aplikasi yang baru saja didaftarkan, di halaman utama salin **Application (client) ID** dan **Directory (tenant) ID**.

![](https://static-docs.nocobase.com/202412021522063.png)

Klik Certificates & secrets, buat client secret baru (Client secrets), dan salin **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Korelasi antara informasi di atas dan konfigurasi authenticator NocoBase adalah sebagai berikut:

| Informasi Microsoft Entra | Konfigurasi Authenticator NocoBase                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application (client) ID   | Client ID                                                                                                                                                                                |
| Client secrets - Value    | Client secret                                                                                                                                                                            |
| Directory (tenant) ID     | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, `{tenant}` perlu diganti dengan Directory (tenant) ID yang sesuai                          |
