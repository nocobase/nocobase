---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Autentikasi: OIDC

## Pendahuluan

Plugin Autentikasi: OIDC mengikuti standar protokol OIDC (Open ConnectID), menggunakan alur Kode Otorisasi (Authorization Code Flow), untuk memungkinkan pengguna masuk ke NocoBase menggunakan akun yang disediakan oleh penyedia layanan autentikasi identitas pihak ketiga (IdP).

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Menambahkan Autentikasi OIDC

Masuk ke halaman manajemen plugin autentikasi pengguna.

![](https://static-docs.nocobase.com/202411130004459.png)

Tambah - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Konfigurasi

### Konfigurasi Dasar

![](https://static-docs.nocobase.com/202411130006341.png)

| Konfigurasi                                        | Deskripsi                                                                                                                                                              | Versi          |
| :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Daftar otomatis jika pengguna tidak ada            | Apakah akan secara otomatis membuat pengguna baru jika tidak ditemukan pengguna yang cocok.                                                                               | -              |
| Issuer                                             | Issuer disediakan oleh IdP, biasanya diakhiri dengan `/.well-known/openid-configuration`.                                                                               | -              |
| Client ID                                          | Client ID                                                                                                                                                              | -              |
| Client Secret                                      | Client Secret                                                                                                                                                          | -              |
| scope                                              | Opsional, defaultnya `openid email profile`.                                                                                                                           | -              |
| id_token signed response algorithm                 | Algoritma penandatanganan untuk `id_token`, defaultnya `RS256`.                                                                                                        | -              |
| Aktifkan logout yang diinisiasi RP                 | Mengaktifkan logout yang diinisiasi RP. Mengakhiri sesi IdP saat pengguna logout. Callback logout IdP harus menggunakan URL pengalihan setelah logout yang disediakan di [Penggunaan](#penggunaan). | `v1.3.44-beta` |

### Pemetaan Bidang

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Konfigurasi                       | Deskripsi                                                                                                                                                               |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pemetaan Bidang                   | Pemetaan bidang. NocoBase saat ini mendukung pemetaan bidang seperti nama panggilan, email, dan nomor telepon. Nama panggilan default menggunakan `openid`.                 |
| Gunakan bidang ini untuk mengikat pengguna | Digunakan untuk mencocokkan dan mengikat dengan pengguna yang sudah ada. Anda dapat memilih email atau nama pengguna, dengan email sebagai default. IdP harus menyediakan informasi `email` atau `username`. |

### Konfigurasi Lanjutan

![](https://static-docs.nocobase.com/202411130013306.png)

| Konfigurasi                                                       | Deskripsi