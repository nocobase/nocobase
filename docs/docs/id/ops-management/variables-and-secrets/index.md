---
title: "Variable dan Secret"
description: "Variable dan secret ops management: mengkonfigurasi environment variable dan secret secara terpusat, mendukung penyimpanan data sensitif, reuse konfigurasi, isolasi environment, perbedaan dengan .env, konfigurasi SMTP workflow, konfigurasi koneksi database."
keywords: "variable dan secret,environment variable,data sensitif,reuse konfigurasi,isolasi environment,ops management,NocoBase"
---

# Variable dan Secret

<PluginInfo name="environment-variables"></PluginInfo>

## Pengantar

Mengkonfigurasi dan mengelola environment variable dan secret secara terpusat, untuk penyimpanan data sensitif, reuse data konfigurasi, isolasi konfigurasi environment, dll.

## Perbedaan dengan `.env`

| **Fitur**     | **File `.env`**                                         | **Environment variable dan secret yang dikonfigurasi dinamis**           |
| ------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Lokasi penyimpanan** | Disimpan di file `.env` di root direktori proyek           | Disimpan di tabel `environmentVariables` database                        |
| **Cara loading** | Dimuat ke `process.env` saat startup aplikasi melalui tool seperti `dotenv` | Dibaca secara dinamis, dimuat ke `app.environment` saat startup aplikasi |
| **Cara modifikasi** | Perlu mengedit file langsung, perlu restart aplikasi setelah modifikasi  | Mendukung modifikasi saat runtime, setelah modifikasi cukup reload konfigurasi aplikasi |
| **Isolasi environment** | Setiap environment (development, testing, production) perlu memelihara file `.env` terpisah | Setiap environment (development, testing, production) perlu memelihara data tabel `environmentVariables` terpisah |
| **Skenario penggunaan** | Cocok untuk konfigurasi statis tetap, seperti informasi database utama aplikasi | Cocok untuk konfigurasi dinamis yang sering disesuaikan atau terikat dengan logika bisnis, seperti database eksternal, file storage, dll |

## Instalasi

Plugin built-in, tidak perlu diinstal terpisah.

## Penggunaan

### Reuse Data Konfigurasi

Contohnya beberapa lokasi di workflow membutuhkan node email dan perlu konfigurasi SMTP, Anda dapat menyimpan konfigurasi SMTP umum ke environment variable.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Penyimpanan Data Sensitif

Penyimpanan data seperti informasi konfigurasi database eksternal, secret cloud file storage, dll.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolasi Konfigurasi Environment

Dalam environment software development, testing, dan production yang berbeda, gunakan strategi manajemen konfigurasi independen untuk memastikan konfigurasi dan data setiap environment tidak saling mengganggu. Setiap environment memiliki settings, variable, dan resource independen masing-masing, sehingga dapat menghindari konflik antara environment development, testing, dan production, sekaligus memastikan sistem dapat berjalan sesuai harapan di setiap environment.

Contohnya, untuk file storage service, konfigurasi development environment dan production environment mungkin berbeda, seperti berikut:

Environment development

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Environment production

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Manajemen Environment Variable

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Menambahkan Environment Variable

- Mendukung penambahan single dan batch
- Mendukung plain text dan encryption

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Penambahan single

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Penambahan batch

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Perhatian

### Restart Aplikasi

Setelah modifikasi atau penghapusan environment variable, akan muncul prompt restart aplikasi di bagian atas. Setelah restart, environment variable yang diubah baru akan berlaku.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Penyimpanan Encrypted

Data encrypted dari environment variable menggunakan AES symmetric encryption, PRIVATE KEY untuk encrypt/decrypt disimpan di storage, mohon disimpan dengan baik. Jika hilang atau ditulis ulang, data yang di-encrypt tidak akan dapat di-decrypt.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Plugin yang Saat Ini Mendukung Environment Variable

### Action: Custom request

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Auth: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Auth: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Auth: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Auth: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Auth: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Auth: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Data source: External MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Data source: External MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Data source: External Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Data source: External PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Data source: External SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Data source: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Data source: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### File storage: Local

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### File storage: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### File storage: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### File storage: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### File storage: S3 Pro

Belum di-adapt

### Map: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Map: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Email settings

Belum di-adapt

### Notification: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Public forms

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### System settings

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verification: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verification: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Workflow

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)
