---
pkg: '@nocobase/plugin-file-manager'
title: "Storage Engine: Local Storage"
description: "Local storage menyimpan file ke hard disk server, cocok untuk skenario skala kecil atau eksperimen, mengkonfigurasi parameter seperti path, akses URL, batasan ukuran, dll."
keywords: "local storage,Local Storage,hard disk server,storage path,file storage,NocoBase"
---

# Storage Engine: Local Storage

File yang di-upload akan disimpan di direktori hard disk lokal server, cocok untuk skenario di mana total file yang dikelola sistem sedikit atau eksperimen.


:::warning Perhatian

Local Storage tidak mendukung akses privat. Setelah file di-upload, NocoBase membuat URL yang dapat diakses langsung, dan siapa pun yang memiliki URL tersebut dapat mengakses file.

Jika perlu menyimpan kontrak, dokumen identitas, materi internal, atau file lain yang tidak boleh publik, gunakan [S3 Pro](./s3-pro). Jika file historis sudah ada, lihat [Migrasi ke S3 Pro](./migrate-to-s3-pro.md).

Jika tidak menggunakan Docker atau konfigurasi nginx resmi, dan mengakses file upload lokal melalui proxy kustom, pastikan path `/storage/uploads/` mengatur `X-Content-Type-Options: nosniff` dan mengembalikan file active content seperti `html`, `svg`, `xhtml`, dan `pdf` sebagai attachment. Untuk detail, lihat [panduan keamanan: File Storage](../../security/guide.md).

:::

## Parameter Konfigurasi

![Contoh konfigurasi storage engine file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Tips}
Hanya memperkenalkan parameter spesifik untuk local storage engine. Untuk parameter umum lihat [Parameter Umum Engine](./index.md#parameter-umum-engine).
:::

### Path

Mengekspresikan baik relative path penyimpanan file di server maupun URL access path. Contohnya: "`user/avatar`" (tanpa "`/`" di awal dan akhir), mewakili:

1. Relative path penyimpanan saat upload file di server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefix alamat URL saat akses: `http://localhost:13000/storage/uploads/user/avatar`.
