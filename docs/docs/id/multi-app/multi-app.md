---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Multi-aplikasi


## Pengantar

**Plugin Multi-aplikasi** memungkinkan Anda untuk secara dinamis membuat dan mengelola beberapa aplikasi independen tanpa perlu deployment terpisah. Setiap sub-aplikasi adalah instans yang sepenuhnya independen dengan basis data, **plugin**, dan konfigurasinya sendiri.

#### Skenario Penggunaan
- **Multi-tenancy**: Menyediakan instans aplikasi independen, di mana setiap pelanggan memiliki data, konfigurasi **plugin**, dan sistem izinnya sendiri.
- **Sistem utama dan sub-sistem untuk domain bisnis yang berbeda**: Sebuah sistem besar yang terdiri dari beberapa aplikasi kecil yang di-deploy secara independen.


:::warning
Plugin Multi-aplikasi itu sendiri tidak menyediakan kemampuan berbagi pengguna.
Jika Anda perlu berbagi pengguna antar beberapa aplikasi, Anda dapat menggunakannya bersama dengan **[plugin Autentikasi](/auth-verification)**.
:::


## Instalasi

Di manajemen **plugin**, temukan **plugin Multi-aplikasi** dan aktifkan.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Panduan Penggunaan


### Membuat Sub-aplikasi

Di menu pengaturan sistem, klik "Multi-aplikasi" untuk masuk ke halaman manajemen multi-aplikasi:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klik tombol "Tambah Baru" untuk membuat sub-aplikasi baru:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Deskripsi Kolom Formulir

*   **Nama**: Pengidentifikasi sub-aplikasi, unik secara global.
*   **Nama Tampilan**: Nama sub-aplikasi yang ditampilkan di antarmuka.
*   **Mode Startup**:
    *   **Mulai pada kunjungan pertama**: Sub-aplikasi dimulai hanya ketika pengguna mengaksesnya melalui URL untuk pertama kalinya;
    *   **Mulai bersama aplikasi utama**: Sub-aplikasi dimulai bersamaan dengan aplikasi utama (ini akan meningkatkan waktu startup aplikasi utama).
*   **Port**: Nomor port yang digunakan oleh sub-aplikasi saat berjalan.
*   **Domain Kustom**: Konfigurasi subdomain independen untuk sub-aplikasi.
*   **Sematkan ke menu**: Sematkan entri sub-aplikasi ke sisi kiri bilah navigasi atas.
*   **Koneksi Basis Data**: Digunakan untuk mengonfigurasi **sumber data** untuk sub-aplikasi, mendukung tiga metode berikut:
    *   **Basis data baru**: Menggunakan kembali layanan data saat ini untuk membuat basis data independen.
    *   **Koneksi data baru**: Mengonfigurasi layanan basis data yang sepenuhnya baru.
    *   **Mode Skema**: Membuat skema independen untuk sub-aplikasi di PostgreSQL.
*   **Peningkatan**: Jika basis data yang terhubung berisi struktur data NocoBase versi lama, maka akan secara otomatis ditingkatkan ke versi saat ini.


### Memulai dan Menghentikan Sub-aplikasi

Klik tombol **Mulai** untuk memulai sub-aplikasi;
> Jika *“Mulai pada kunjungan pertama”* dicentang saat pembuatan, maka akan otomatis dimulai pada kunjungan pertama.

Klik tombol **Lihat**, sub-aplikasi akan terbuka di tab baru.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Status dan Log Sub-aplikasi

Dalam daftar, Anda dapat melihat penggunaan memori dan CPU setiap aplikasi.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klik tombol **Log** untuk melihat log runtime sub-aplikasi.
> Jika sub-aplikasi tidak dapat diakses setelah dimulai (misalnya, karena basis data rusak), Anda dapat menggunakan log untuk memecahkan masalah.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Menghapus Sub-aplikasi

Klik tombol **Hapus** untuk menghapus sub-aplikasi.
> Saat menghapus, Anda dapat memilih apakah akan menghapus basis data juga. Harap berhati-hati, karena tindakan ini tidak dapat dibatalkan.


### Mengakses Sub-aplikasi
Secara default, sub-aplikasi diakses menggunakan `/_app/:appName/admin/`, contohnya:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Anda juga dapat mengonfigurasi subdomain independen untuk sub-aplikasi. Anda perlu me-resolve domain ke IP saat ini, dan jika Anda menggunakan Nginx, Anda juga perlu menambahkan domain ke konfigurasi Nginx.


### Mengelola Sub-aplikasi melalui Baris Perintah

Di direktori root proyek, Anda dapat menggunakan baris perintah untuk mengelola instans sub-aplikasi melalui **PM2**:

```bash
yarn nocobase pm2 list              # Melihat daftar instans yang sedang berjalan
yarn nocobase pm2 stop [appname]    # Menghentikan proses sub-aplikasi tertentu
yarn nocobase pm2 delete [appname]  # Menghapus proses sub-aplikasi tertentu
yarn nocobase pm2 kill              # Menghentikan secara paksa semua proses yang dimulai (mungkin termasuk instans aplikasi utama)
```

### Migrasi Data dari Multi-aplikasi Lama

Masuk ke halaman manajemen multi-aplikasi lama dan klik tombol **Migrasi data ke multi-aplikasi baru** untuk melakukan migrasi data.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Pertanyaan Umum

#### 1. Manajemen Plugin
Sub-aplikasi dapat menggunakan **plugin** yang sama dengan aplikasi utama (termasuk versi), tetapi dapat dikonfigurasi dan digunakan secara independen.

#### 2. Isolasi Basis Data
Sub-aplikasi dapat dikonfigurasi dengan basis data independen. Jika Anda ingin berbagi data antar aplikasi, Anda dapat melakukannya melalui **sumber data** eksternal.

#### 3. Pencadangan dan Migrasi Data
Saat ini, pencadangan data di aplikasi utama tidak menyertakan data sub-aplikasi (hanya informasi dasar sub-aplikasi). Anda perlu mencadangkan dan memigrasi data secara manual di dalam setiap sub-aplikasi.

#### 4. Deployment dan Pembaruan
Versi sub-aplikasi akan secara otomatis ditingkatkan bersamaan dengan aplikasi utama, memastikan konsistensi versi antara aplikasi utama dan sub-aplikasi.

#### 5. Manajemen Sumber Daya
Konsumsi sumber daya setiap sub-aplikasi pada dasarnya sama dengan aplikasi utama. Saat ini, satu aplikasi menggunakan sekitar 500-600MB memori.