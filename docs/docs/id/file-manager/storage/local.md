---
pkg: '@nocobase/plugin-file-manager'
title: "Storage Engine: Local Storage"
description: "Local storage menyimpan file ke hard disk server, cocok untuk skenario skala kecil atau eksperimen, mengkonfigurasi parameter seperti path, akses URL, batasan ukuran, dll."
keywords: "local storage,Local Storage,hard disk server,storage path,file storage,NocoBase"
---

# Storage Engine: Local Storage

File yang di-upload akan disimpan di direktori hard disk lokal server, cocok untuk skenario di mana total file yang dikelola sistem sedikit atau eksperimen.

## Parameter Konfigurasi

![Contoh konfigurasi storage engine file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Tips}
Hanya memperkenalkan parameter spesifik untuk local storage engine. Untuk parameter umum lihat [Parameter Umum Engine](./index.md#parameter-umum-engine).
:::

### Path

Mengekspresikan baik relative path penyimpanan file di server maupun URL access path. Contohnya: "`user/avatar`" (tanpa "`/`" di awal dan akhir), mewakili:

1. Relative path penyimpanan saat upload file di server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefix alamat URL saat akses: `http://localhost:13000/storage/uploads/user/avatar`.
