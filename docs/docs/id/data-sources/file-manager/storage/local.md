---
title: "Penyimpanan Lokal"
description: "Storage engine penyimpanan lokal menyimpan file ke hard disk server, mengonfigurasi path penyimpanan, URL akses, cocok untuk deployment single-server."
keywords: "penyimpanan lokal,Local Storage,penyimpanan file,hard disk server,NocoBase"
---

# Penyimpanan Lokal

File yang diupload akan disimpan di direktori hard disk lokal server, cocok untuk skenario di mana total file upload yang dikelola sistem relatif sedikit atau eksperimental.

## Parameter Konfigurasi

![Contoh konfigurasi storage engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Tips}
Hanya menjelaskan parameter khusus storage engine penyimpanan lokal, untuk parameter umum harap lihat [Parameter Umum Engine](./index.md#parameter-umum-engine).
:::

### Path

Sekaligus mengekspresikan path relatif file yang disimpan di server dan path akses URL. Contoh: "`user/avatar`" (tanpa "`/`" di awal dan akhir), mewakili:

1. Path relatif penyimpanan di server saat upload file: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefix alamat URL saat akses: `http://localhost:13000/storage/uploads/user/avatar`.
