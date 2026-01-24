:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Masuk dengan Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Dapatkan Kredensial Google OAuth 2.0

[Konsol Google Cloud](https://console.cloud.google.com/apis/credentials) - Buat Kredensial - ID Klien OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Masuk ke antarmuka konfigurasi dan isi URL pengalihan yang diotorisasi. URL pengalihan dapat diperoleh saat menambahkan autentikator di NocoBase, biasanya adalah `http(s)://host:port/api/oidc:redirect`. Lihat bagian [Panduan Pengguna - Konfigurasi](../index.md#konfigurasi).

![](https://static-docs.nocobase.com/2407bf52ec966a16334894cb3d9d126.png)

## Tambahkan Autentikator Baru di NocoBase

Pengaturan Plugin - Autentikasi Pengguna - Tambah - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Lihat parameter yang dijelaskan dalam [Panduan Pengguna - Konfigurasi](../index.md#konfigurasi) untuk menyelesaikan konfigurasi autentikator.