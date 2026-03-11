---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/multi-app/multi-app/local).
:::

# Mode Memori Bersama

## Pendahuluan

Ketika pengguna ingin melakukan pemisahan bisnis pada tingkat aplikasi, namun tidak ingin memperkenalkan arsitektur penerapan dan operasional yang kompleks, mode multi-aplikasi memori bersama dapat digunakan.

Dalam mode ini, beberapa aplikasi dapat berjalan secara bersamaan dalam satu instans NocoBase. Setiap aplikasi bersifat independen, dapat terhubung ke database independen, serta dapat dibuat, dijalankan, dan dihentikan secara terpisah, namun mereka berbagi proses dan ruang memori yang sama, sehingga pengguna tetap hanya perlu memelihara satu instans NocoBase.

## Panduan Pengguna

### Konfigurasi Variabel Lingkungan

Sebelum menggunakan fitur multi-aplikasi, pastikan variabel lingkungan berikut telah diatur saat NocoBase dijalankan:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Pembuatan Aplikasi

Klik 「Pengawas Aplikasi」 di menu pengaturan sistem untuk masuk ke halaman manajemen aplikasi.

![](https://static-docs.nocobase.com/202512291056215.png)

Klik tombol 「Tambah Baru」 untuk membuat aplikasi baru.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Penjelasan Item Konfigurasi

| Item Konfigurasi | Penjelasan |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nama Aplikasi** | Nama aplikasi yang ditampilkan di antarmuka |
| **Identitas Aplikasi** | Identitas aplikasi, unik secara global |
| **Mode Mulai** | - Mulai saat akses pertama: Aplikasi hanya akan dimulai saat pengguna mengaksesnya melalui URL untuk pertama kalinya<br>- Mulai bersama aplikasi utama: Aplikasi anak akan dimulai bersamaan dengan aplikasi utama (akan menambah waktu mulai aplikasi utama) |
| **Lingkungan** | Dalam mode memori bersama, hanya lingkungan lokal yang tersedia, yaitu `local` |
| **Koneksi Database** | Digunakan untuk mengonfigurasi sumber data utama aplikasi, mendukung tiga cara berikut:<br>- Database baru: Menggunakan kembali layanan database saat ini dan membuat database independen<br>- Koneksi data baru: Menghubungkan ke layanan database lain<br>- Mode Schema: Saat sumber data utama saat ini adalah PostgreSQL, buat Schema independen untuk aplikasi |
| **Pembaruan** | Jika database yang terhubung berisi data aplikasi NocoBase versi lama, apakah diizinkan untuk memperbarui secara otomatis ke versi aplikasi saat ini |
| **Kunci JWT** | Menghasilkan kunci JWT independen secara otomatis untuk aplikasi, memastikan sesi aplikasi independen dari aplikasi utama dan aplikasi lainnya |
| **Domain Kustom** | Mengonfigurasi domain akses independen untuk aplikasi |

### Menjalankan Aplikasi

Klik tombol **Mulai** untuk menjalankan aplikasi anak.

> Jika opsi _“Mulai saat akses pertama”_ dicentang saat pembuatan, aplikasi akan dimulai secara otomatis saat diakses pertama kali.

![](https://static-docs.nocobase.com/202512291121065.png)

### Mengakses Aplikasi

Klik tombol **Akses** untuk membuka aplikasi anak di tab baru.

Secara default, gunakan `/apps/:appName/admin/` untuk mengakses aplikasi anak, misalnya:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Selain itu, Anda juga dapat mengonfigurasi domain independen untuk aplikasi anak. Domain tersebut perlu diarahkan ke IP saat ini, dan jika menggunakan Nginx, domain tersebut juga perlu ditambahkan ke konfigurasi Nginx.

### Menghentikan Aplikasi

Klik tombol **Berhenti** untuk menghentikan aplikasi anak.

![](https://static-docs.nocobase.com/202512291122113.png)

### Status Aplikasi

Anda dapat melihat status saat ini dari setiap aplikasi dalam daftar.

![](https://static-docs.nocobase.com/202512291122339.png)

### Menghapus Aplikasi

Klik tombol **Hapus** untuk menghapus aplikasi.

![](https://static-docs.nocobase.com/202512291122178.png)

## Pertanyaan Umum

### 1. Manajemen Plugin

Plugin yang dapat digunakan oleh aplikasi lain sama dengan aplikasi utama (termasuk versinya), namun plugin dapat dikonfigurasi dan digunakan secara independen.

### 2. Isolasi Database

Aplikasi lain dapat mengonfigurasi database independen. Jika ingin berbagi data antar aplikasi, hal ini dapat dilakukan melalui sumber data eksternal.

### 3. Pencadangan dan Migrasi Data

Saat ini, pencadangan data pada aplikasi utama tidak mendukung penyertaan data dari aplikasi lain (hanya menyertakan informasi dasar aplikasi). Pencadangan dan migrasi perlu dilakukan secara manual di dalam aplikasi masing-masing.

### 4. Penerapan dan Pembaruan

Dalam mode memori bersama, versi aplikasi lain akan secara otomatis mengikuti pembaruan aplikasi utama, memastikan konsistensi versi aplikasi secara otomatis.

### 5. Sesi Aplikasi

- Jika aplikasi menggunakan kunci JWT independen, maka sesi aplikasi akan independen dari aplikasi utama dan aplikasi lainnya. Jika mengakses aplikasi yang berbeda melalui sub-jalur dari domain yang sama, karena TOKEN aplikasi disimpan dalam LocalStorage, Anda perlu masuk kembali saat berpindah antar aplikasi. Disarankan untuk mengonfigurasi domain independen untuk setiap aplikasi guna mencapai isolasi sesi yang lebih baik.
- Jika aplikasi tidak menggunakan kunci JWT independen, maka aplikasi akan berbagi sesi dengan aplikasi utama. Setelah mengakses aplikasi lain di browser yang sama, Anda tidak perlu masuk kembali saat kembali ke aplikasi utama. Namun, terdapat risiko keamanan; jika ID pengguna di aplikasi yang berbeda sama, hal ini dapat menyebabkan akses tidak sah ke data aplikasi lain.