:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Google Workspace

## Mengatur Google sebagai IdP

[Konsol Admin Google](https://admin.google.com/) - Aplikasi - Aplikasi Web dan Seluler

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Setelah mengatur aplikasi, salin **URL SSO**, **ID Entitas**, dan **Sertifikat**.

![](https://static-docs.nocobase.com/aafd20a7930e85411c0c8f368637e0.png)

## Menambahkan Autentikator Baru di NocoBase

Pengaturan plugin - Autentikasi Pengguna - Tambah - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Isi informasi yang baru saja disalin secara berurutan:

- URL SSO: URL SSO
- Sertifikat Publik: Sertifikat
- Penerbit IdP: ID Entitas
- http: Centang jika Anda melakukan pengujian secara lokal dengan http

Kemudian salin SP Issuer/EntityID dan URL ACS dari bagian Penggunaan.

## Mengisi Informasi SP di Google

Kembali ke Konsol Google, pada halaman **Detail Penyedia Layanan**, masukkan URL ACS dan ID Entitas yang telah disalin sebelumnya, lalu centang **Respons yang Ditandatangani**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc7384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Pada bagian **Pemetaan Atribut**, tambahkan pemetaan untuk atribut yang sesuai.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)