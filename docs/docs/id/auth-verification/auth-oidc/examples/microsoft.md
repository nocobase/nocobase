:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Menambahkan Autentikator di NocoBase

Pertama, tambahkan autentikator baru di NocoBase: Pengaturan plugin - Autentikasi Pengguna - Tambah - OIDC.

Salin URL callback.

![](https://static-docs.nocobase.com/202412021504114.png)

## Mendaftarkan Aplikasi

Buka pusat admin Microsoft Entra dan daftarkan aplikasi baru.

![](https://static-docs.nocobase.com/202412021506837.png)

Tempel URL callback yang baru saja Anda salin di sini.

![](https://static-docs.nocobase.com/202412021520696.png)

## Mendapatkan dan Mengisi Informasi yang Sesuai

Klik aplikasi yang baru saja Anda daftarkan, lalu salin **Application (client) ID** dan **Directory (tenant) ID** dari halaman ikhtisar.

![](https://static-docs.nocobase.com/202412021522063.png)

Klik `Certificates & secrets`, buat rahasia klien (Client secrets) baru, dan salin **Value**-nya.

![](https://static-docs.nocobase.com/202412021522846.png)

Berikut adalah pemetaan antara informasi Microsoft Entra dan konfigurasi autentikator NocoBase:

| Informasi Microsoft Entra | Bidang Autentikator NocoBase                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID   | Client ID                                                                                                                                        |
| Client secrets - Value    | Client secret                                                                                                                                    |
| Directory (tenant) ID     | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, ganti `{tenant}` dengan Directory (tenant) ID yang sesuai |