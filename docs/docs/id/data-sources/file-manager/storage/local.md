---
title: "Penyimpanan Lokal"
description: "Mesin penyimpanan lokal menyimpan file ke hard disk server, dengan konfigurasi jalur penyimpanan dan URL akses, cocok untuk deployment tunggal."
keywords: "Penyimpanan Lokal,Local Storage,Penyimpanan file,Hard disk server,NocoBase"
---

# Penyimpanan lokal

File yang diunggah akan disimpan di direktori hard disk lokal server, cocok untuk skenario dengan jumlah total file unggahan yang dikelola sistem relatif sedikit atau bersifat eksperimental.

## Parameter konfigurasi

![Contoh konfigurasi mesin penyimpanan file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Catatan}
Hanya parameter khusus mesin penyimpanan lokal yang dijelaskan. Untuk parameter umum, silakan lihat [Parameter umum mesin](./index.md#引擎通用参数).
:::

### Jalur

Menentukan jalur relatif tempat file disimpan di server sekaligus jalur akses URL. Misalnya: “`user/avatar`” (tanpa “`/`” di awal dan akhir), yang berarti:

1. Jalur relatif tempat file yang diunggah disimpan di server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Awalan alamat URL saat diakses: `http://localhost:13000/storage/uploads/user/avatar`.