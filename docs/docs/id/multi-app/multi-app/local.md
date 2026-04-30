---
pkg: '@nocobase/plugin-app-supervisor'
title: "Mode Shared Memory Multi-app"
description: "Mode shared memory: multi-app pada single instance, APP_DISCOVERY_ADAPTER=local, APP_PROCESS_ADAPTER=local, database/Schema independen, JWT secret, custom domain, akses /apps/:appName/admin."
keywords: "shared memory,mode local,APP_DISCOVERY_ADAPTER,APP_PROCESS_ADAPTER,sub-app,application supervisor,NocoBase"
---
# Mode Shared Memory

## Pengantar

Saat pengguna ingin memisahkan bisnis pada level aplikasi, tetapi tidak ingin memperkenalkan arsitektur deployment dan operasi yang kompleks, dapat menggunakan mode multi-app shared memory.

Dalam mode ini, satu instance NocoBase dapat menjalankan beberapa aplikasi secara bersamaan. Setiap aplikasi independen, dapat terhubung ke database independen, dapat dibuat, dijalankan, dan dihentikan secara terpisah, tetapi mereka berbagi proses dan ruang memory yang sama, pengguna tetap hanya perlu memelihara satu instance NocoBase.

## Manual Penggunaan

### Konfigurasi Environment Variable

Sebelum menggunakan fitur multi-app, pastikan environment variable berikut diatur saat startup NocoBase:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Pembuatan Aplikasi

Klik "Application Supervisor" di menu System Settings, masuk ke halaman manajemen aplikasi.

![](https://static-docs.nocobase.com/202512291056215.png)

Klik tombol "Add new" untuk membuat aplikasi baru.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Penjelasan Item Konfigurasi

| Item Konfigurasi      | Penjelasan                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **App name**          | Nama aplikasi yang ditampilkan di interface                                                                                                                                                                                       |
| **App identifier**    | Identifier aplikasi, unik global                                                                                                                                                                                           |
| **Startup mode**      | - Start on first access: Sub-app dijalankan saat user pertama kali mengakses melalui URL<br>- Start with main app: Sub-app dijalankan bersama main app saat startup (akan menambah waktu startup main app)                                                                        |
| **Environment**       | Dalam mode shared memory, hanya local environment yang tersedia, yaitu `local`                                                                                                                                                               |
| **Database connection** | Digunakan untuk mengkonfigurasi data source utama aplikasi, mendukung tiga cara berikut:<br>- New database: Reuse service database saat ini, buat database independen<br>- New connection: Hubungkan ke service database lain<br>- Schema mode: Saat data source utama saat ini adalah PostgreSQL, buat Schema independen untuk aplikasi |
| **Upgrade**           | Jika di database yang dihubungkan terdapat data aplikasi NocoBase versi lama, apakah mengizinkan upgrade otomatis ke versi aplikasi saat ini                                                                                                             |
| **JWT secret**        | Secara otomatis menghasilkan JWT secret independen untuk aplikasi, memastikan session aplikasi independen dari main app dan aplikasi lain                                                                                                            |
| **Custom domain**     | Mengkonfigurasi domain akses independen untuk aplikasi                                                                                                                                                                                       |

### Startup Aplikasi

Klik tombol **Start** untuk menjalankan sub-app.

> Jika "Start on first access" dicentang saat pembuatan, akan otomatis dijalankan saat akses pertama kali.

![](https://static-docs.nocobase.com/202512291121065.png)

### Akses Aplikasi

Klik tombol **Access**, akan membuka sub-app di tab baru.

Default menggunakan `/apps/:appName/admin/` untuk mengakses sub-app, contohnya

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Sekaligus, Anda juga dapat mengkonfigurasi domain independen untuk sub-app, perlu mengarahkan domain ke ip saat ini. Jika menggunakan nginx, juga perlu menambahkan domain di konfigurasi nginx.

### Stop Aplikasi

Klik tombol **Stop** untuk menghentikan sub-app.

![](https://static-docs.nocobase.com/202512291122113.png)

### Status Aplikasi

Anda dapat melihat status saat ini dari setiap aplikasi di list.

![](https://static-docs.nocobase.com/202512291122339.png)

### Penghapusan Aplikasi

Klik tombol **Delete** untuk menghapus aplikasi.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

### 1. Manajemen Plugin

Plugin yang dapat digunakan aplikasi lain sama dengan main app (termasuk versi), tetapi dapat dikonfigurasi dan digunakan secara independen.

### 2. Isolasi Database

Aplikasi lain dapat dikonfigurasi dengan database independen. Jika ingin sharing data antar aplikasi, dapat diimplementasikan melalui external data source.

### 3. Backup dan Migrasi Data

Saat ini backup data di main app tidak mendukung termasuk data aplikasi lain (hanya termasuk informasi dasar aplikasi), perlu backup dan migrasi manual di dalam aplikasi lain.

### 4. Deployment dan Update

Dalam mode shared memory, versi aplikasi lain akan secara otomatis mengikuti upgrade main app, secara otomatis menjamin konsistensi versi aplikasi.

### 5. Session Aplikasi

- Jika aplikasi menggunakan JWT secret independen, maka session aplikasi independen dari main app dan aplikasi lain. Jika mengakses aplikasi yang berbeda melalui sub-path domain yang sama, karena TOKEN aplikasi di-cache di LocalStorage, perlu login ulang saat berpindah antar aplikasi yang berbeda. Disarankan mengkonfigurasi domain independen untuk aplikasi yang berbeda untuk mencapai isolasi session yang lebih baik.
- Jika aplikasi tidak menggunakan JWT secret independen, maka akan berbagi session dengan main app. Setelah mengakses aplikasi lain di browser yang sama dan kembali ke main app, tidak perlu login ulang. Tetapi ada risiko keamanan, jika user ID di aplikasi yang berbeda duplikat, dapat menyebabkan user mengakses data aplikasi lain secara tidak sah.
