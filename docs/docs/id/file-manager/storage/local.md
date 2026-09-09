---
pkg: '@nocobase/plugin-file-manager'
title: "Storage Engine: Local Storage"
description: "Local storage menyimpan file ke hard disk server, cocok untuk skenario skala kecil atau eksperimen, mengkonfigurasi parameter seperti path, akses URL, batasan ukuran, dll."
keywords: "local storage,Local Storage,hard disk server,storage path,file storage,NocoBase"
---

# Storage Engine: Local Storage

File yang di-upload akan disimpan di direktori hard disk lokal server, cocok untuk skenario di mana total file yang dikelola sistem sedikit atau eksperimen.


:::warning Perhatian

Gunakan stable URL `/files/` untuk file lokal jika memungkinkan agar NocoBase dapat memeriksa record file dan izin melihat role saat ini. URL lama `/storage/uploads/` tidak menerapkan izin tingkat record, tetapi Docker, Nginx bawaan, dan konfigurasi Nginx yang dibuat NocoBase CLI membatasinya untuk pengguna yang sudah login secara default.

Jika perlu menyimpan kontrak, dokumen identitas, materi internal, atau file lain yang tidak boleh publik, gunakan [S3 Pro](./s3-pro). Jika file historis sudah ada, lihat [Migrasi ke S3 Pro](./migrate-to-s3-pro.md).

Jika Nginx kustom menyajikan file lokal melalui `alias`, location `/storage/uploads/` harus menggunakan `auth_request` untuk memanggil endpoint autentikasi NocoBase. Jika tidak, pemeriksaan login default akan dilewati. Atur juga `X-Content-Type-Options: nosniff` dan kembalikan file active content seperti `html`, `svg`, `xhtml`, dan `pdf` sebagai attachment. Lihat [Reverse Proxy Nginx](../../nocobase-cli/production/reverse-proxy/nginx.md) untuk contoh lengkap dan konfigurasi sub-app, serta [panduan keamanan: File Storage](../../security/guide.md#file-storage) untuk risiko terkait.

Jika integrasi yang sudah ada bergantung pada akses anonim ke URL lama, atur `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` lalu restart aplikasi. Switch kompatibilitas ini hanya memengaruhi `/storage/uploads/` dan tidak mengubah izin tingkat record untuk `/files/`.

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
