---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/multi-space/multi-app).
:::

# Multi-aplikasi

## Pendahuluan

**Plugin Multi-aplikasi (Multi-app)** memungkinkan pembuatan dan pengelolaan beberapa aplikasi independen secara dinamis tanpa perlu melakukan deployment terpisah. Setiap sub-aplikasi adalah instansi yang sepenuhnya independen, memiliki database, plugin, dan konfigurasi sendiri.

#### Skenario Penggunaan
- **Multi-tenancy**: Menyediakan instansi aplikasi independen di mana setiap pelanggan memiliki data, konfigurasi plugin, dan sistem izin mereka sendiri.
- **Sistem Utama dan Sub-sistem untuk Domain Bisnis yang Berbeda**: Sebuah sistem besar yang terdiri dari beberapa aplikasi kecil yang di-deploy secara independen.

:::warning
Plugin Multi-aplikasi sendiri tidak menyediakan kemampuan berbagi pengguna.  
Untuk mengintegrasikan pengguna di berbagai aplikasi, plugin ini dapat digunakan bersama dengan **[Plugin Autentikasi](/auth-verification)**.
:::

## Instalasi

Temukan plugin **Multi-aplikasi (Multi-app)** di manajemen plugin dan aktifkan.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Panduan Pengguna

### Pembuatan Sub-aplikasi

Klik "Multi-aplikasi" pada menu pengaturan sistem untuk masuk ke halaman manajemen multi-aplikasi:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klik tombol "Tambah Baru" untuk membuat sub-aplikasi baru:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Deskripsi Bidang Formulir

* **Nama**: Identitas sub-aplikasi, unik secara global.
* **Nama Tampilan**: Nama sub-aplikasi yang ditampilkan di antarmuka.
* **Mode Startup**:
  * **Mulai saat akses pertama**: Sub-aplikasi hanya dimulai ketika pengguna mengaksesnya melalui URL untuk pertama kalinya.
  * **Mulai bersama aplikasi utama**: Sub-aplikasi dimulai secara bersamaan dengan aplikasi utama (ini akan menambah waktu startup aplikasi utama).
* **Port**: Nomor port yang digunakan oleh sub-aplikasi selama runtime.
* **Domain Kustom**: Konfigurasi subdomain independen untuk sub-aplikasi.
* **Sematkan ke Menu**: Menyematkan entri sub-aplikasi ke sisi kiri bilah navigasi atas.
* **Koneksi Database**: Digunakan untuk mengonfigurasi sumber data untuk sub-aplikasi, mendukung tiga metode:
  * **Database Baru**: Menggunakan kembali layanan data saat ini untuk membuat database independen.
  * **Koneksi Data Baru**: Mengonfigurasi layanan database yang benar-benar baru.
  * **Mode Skema**: Membuat Skema independen untuk sub-aplikasi di PostgreSQL.
* **Pembaruan (Upgrade)**: Jika database yang terhubung berisi struktur data NocoBase versi lama, maka akan diperbarui secara otomatis ke versi saat ini.

### Menjalankan dan Menghentikan Sub-aplikasi

Klik tombol **Mulai** untuk menjalankan sub-aplikasi;  
> Jika *"Mulai saat akses pertama"* dicentang saat pembuatan, aplikasi akan dimulai secara otomatis pada kunjungan pertama.  

Klik tombol **Lihat** untuk membuka sub-aplikasi di tab baru.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Status Berjalan dan Log Sub-aplikasi

Anda dapat melihat penggunaan memori dan CPU dari setiap aplikasi dalam daftar.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klik tombol **Log** untuk melihat log runtime sub-aplikasi.  
> Jika sub-aplikasi tidak dapat diakses setelah dimulai (misalnya karena kerusakan database), Anda dapat melakukan troubleshooting melalui log.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Penghapusan Sub-aplikasi

Klik tombol **Hapus** untuk menghapus sub-aplikasi.  
> Saat menghapus, Anda dapat memilih apakah akan menghapus database juga. Harap berhati-hati, tindakan ini tidak dapat dibatalkan.

### Mengakses Sub-aplikasi
Secara default, gunakan `/_app/:appName/admin/` untuk mengakses sub-aplikasi, contohnya:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Selain itu, Anda juga dapat mengonfigurasi subdomain independen untuk sub-aplikasi. Anda perlu mengarahkan domain ke IP saat ini. Jika menggunakan Nginx, domain tersebut juga harus ditambahkan ke konfigurasi Nginx.

### Mengelola Sub-aplikasi melalui CLI

Di direktori root proyek, Anda dapat menggunakan baris perintah melalui **PM2** untuk mengelola instansi sub-aplikasi:

```bash
yarn nocobase pm2 list              # Melihat daftar instansi yang sedang berjalan
yarn nocobase pm2 stop [appname]    # Menghentikan proses sub-aplikasi tertentu
yarn nocobase pm2 delete [appname]  # Menghapus proses sub-aplikasi tertentu
yarn nocobase pm2 kill              # Menghentikan paksa semua proses yang dimulai (mungkin termasuk instansi aplikasi utama)
```

### Migrasi Data Multi-aplikasi Lama

Masuk ke halaman manajemen multi-aplikasi lama, klik tombol **Migrasi Data ke Multi-aplikasi Baru** untuk melakukan migrasi data.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Pertanyaan Umum (FAQ)

#### 1. Manajemen Plugin
Sub-aplikasi dapat menggunakan plugin yang sama dengan aplikasi utama (termasuk versinya), namun plugin dapat dikonfigurasi dan digunakan secara independen.

#### 2. Isolasi Database
Sub-aplikasi dapat dikonfigurasi dengan database independen. Jika Anda ingin berbagi data antar aplikasi, hal ini dapat dicapai melalui sumber data eksternal.

#### 3. Cadangan dan Migrasi Data
Saat ini, pencadangan data pada aplikasi utama tidak mencakup data sub-aplikasi (hanya mencakup informasi dasar sub-aplikasi). Pencadangan dan migrasi harus dilakukan secara manual di dalam setiap sub-aplikasi.

#### 4. Deployment dan Pembaruan
Versi sub-aplikasi akan secara otomatis mengikuti pembaruan aplikasi utama, memastikan konsistensi versi antara aplikasi utama dan sub-aplikasi.

#### 5. Manajemen Sumber Daya
Konsumsi sumber daya dari setiap sub-aplikasi pada dasarnya sama dengan aplikasi utama. Saat ini, penggunaan memori untuk satu aplikasi adalah sekitar 500-600MB.