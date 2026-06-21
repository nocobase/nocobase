---
title: "Contoh Konfigurasi SAML: Google Workspace"
description: "Mengkonfigurasi Google Workspace sebagai SAML IdP: pengaturan aplikasi web dan mobile, menyalin SSO URL dan sertifikat, menambahkan authenticator SAML di NocoBase, attribute mapping."
keywords: "SAML,Google Workspace,konfigurasi IdP,SSO,attribute mapping,sertifikat,NocoBase"
---

# Google Workspace

## Mengatur Google sebagai IdP

[Google Admin Console](https://admin.google.com/) - Aplikasi - Aplikasi Web dan Mobile

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Setelah melakukan pengaturan aplikasi, salin **SSO URL**, **Entity ID**, dan **Certificate**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Menambahkan Authenticator Baru di NocoBase

Plugin Settings - Autentikasi Pengguna - Tambah - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Isi informasi yang baru saja disalin secara berurutan

- SSO URL: SSO URL
- Public Certificate: Certificate
- idP Issuer: Entity ID
- http: Centang jika pengujian dilakukan di http lokal

Setelah itu, salin SP Issuer/EntityID dan ACS URL pada bagian Usage.

## Mengisi Informasi SP di Google

Kembali ke Google console, di halaman **Detail Penyedia Layanan**, masukkan ACS URL dan Entity ID yang baru saja disalin, dan centang **Signed Response**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Pada bagian **Attribute Mapping**, tambahkan mapping untuk memetakan atribut yang sesuai.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)
