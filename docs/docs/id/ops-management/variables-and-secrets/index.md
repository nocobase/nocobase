---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Variabel dan Kunci Rahasia

## Pendahuluan

Konfigurasi dan pengelolaan variabel lingkungan serta kunci rahasia secara terpusat untuk penyimpanan data sensitif, penggunaan ulang data konfigurasi, dan isolasi konfigurasi lingkungan.

## Perbedaan dengan `.env`

| **Fitur** | **File `.env`** | **Variabel dan Kunci Rahasia yang Dikonfigurasi Secara Dinamis** |
| :-------- | :------------------------------------------------------ | :------------------------------------------------------------------------ |
| **Lokasi Penyimpanan** | Disimpan dalam file `.env` di direktori root proyek | Disimpan dalam tabel `environmentVariables` di database |
| **Metode Pemuatan** | Dimuat ke `process.env` menggunakan alat seperti `dotenv` saat aplikasi dimulai | Dibaca secara dinamis dan dimuat ke `app.environment` saat aplikasi dimulai |
| **Metode Modifikasi** | Membutuhkan pengeditan file secara langsung, dan aplikasi perlu dimulai ulang agar perubahan berlaku | Mendukung modifikasi saat runtime, perubahan langsung berlaku setelah memuat ulang konfigurasi aplikasi |
| **Isolasi Lingkungan** | Setiap lingkungan (pengembangan, pengujian, produksi) memerlukan pemeliharaan file `.env` secara terpisah | Setiap lingkungan (pengembangan, pengujian, produksi) memerlukan pemeliharaan data dalam tabel `environmentVariables` secara terpisah |
| **Skenario yang Berlaku** | Cocok untuk konfigurasi statis yang tetap, seperti informasi database utama untuk aplikasi | Cocok untuk konfigurasi dinamis yang memerlukan penyesuaian sering atau terikat dengan logika bisnis, seperti database eksternal, informasi penyimpanan file, dll. |

## Instalasi

**Plugin** bawaan, tidak perlu instalasi terpisah.

## Penggunaan

### Penggunaan Ulang Data Konfigurasi

Misalnya, jika beberapa bagian dalam **alur kerja** memerlukan node email dan konfigurasi SMTP, konfigurasi SMTP umum dapat disimpan dalam variabel lingkungan.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Penyimpanan Data Sensitif

Penyimpanan berbagai informasi konfigurasi database eksternal, kunci penyimpanan file cloud, dan data serupa lainnya.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolasi Konfigurasi Lingkungan

Dalam berbagai lingkungan seperti pengembangan, pengujian, dan produksi, strategi pengelolaan konfigurasi yang independen digunakan untuk memastikan bahwa konfigurasi dan data setiap lingkungan tidak saling mengganggu. Setiap lingkungan memiliki pengaturan, variabel, dan sumber daya independennya sendiri, yang menghindari konflik antara lingkungan pengembangan, pengujian, dan produksi, sekaligus memastikan sistem berjalan sesuai harapan di setiap lingkungan.

Misalnya, untuk layanan penyimpanan file, konfigurasi lingkungan pengembangan dan produksi mungkin berbeda, seperti di bawah ini:

Lingkungan Pengembangan

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Lingkungan Produksi

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Pengelolaan Variabel Lingkungan

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Menambahkan Variabel Lingkungan

- Mendukung penambahan tunggal dan massal
- Mendukung penyimpanan teks biasa dan terenkripsi

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Penambahan Tunggal

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Penambahan Massal

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Catatan Penting

### Memulai Ulang Aplikasi

Setelah memodifikasi atau menghapus variabel lingkungan, akan muncul notifikasi di bagian atas untuk memulai ulang aplikasi. Perubahan pada variabel lingkungan hanya akan berlaku setelah aplikasi dimulai ulang.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Penyimpanan Terenkripsi

Data terenkripsi untuk variabel lingkungan menggunakan enkripsi simetris AES. PRIVATE KEY untuk enkripsi dan dekripsi disimpan di direktori `storage`. Harap jaga baik-baik; jika hilang atau ditimpa, data terenkripsi tidak dapat didekripsi.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## **Plugin** yang Saat Ini Mendukung Variabel Lingkungan

### Aksi: Permintaan Kustom

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Autentikasi: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Autentikasi: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Autentikasi: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Autentikasi: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Autentikasi: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Autentikasi: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### **Sumber Data**: MariaDB Eksternal

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### **Sumber Data**: MySQL Eksternal

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### **Sumber Data**: Oracle Eksternal

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### **Sumber Data**: PostgreSQL Eksternal

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### **Sumber Data**: SQL Server Eksternal

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### **Sumber Data**: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### **Sumber Data**: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Penyimpanan File: Lokal

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Penyimpanan File: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Penyimpanan File: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Penyimpanan File: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Penyimpanan File: S3 Pro

Belum diadaptasi

### Peta: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Peta: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Pengaturan Email

Belum diadaptasi

### Notifikasi: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Formulir Publik

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Pengaturan Sistem

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verifikasi: SMS Aliyun

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verifikasi: SMS Tencent

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### **Alur Kerja**

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)