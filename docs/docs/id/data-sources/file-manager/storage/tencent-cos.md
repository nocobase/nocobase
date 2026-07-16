---
title: "Tencent COS"
description: "Konfigurasi storage engine Tencent COS: Bucket, Region, SecretId, upload file object storage."
keywords: "Tencent COS,Tencent Object Storage,COS storage,cloud storage,NocoBase"
---

# Tencent COS

Storage engine berbasis Tencent COS, sebelum digunakan perlu menyiapkan akun dan izin terkait.

## Parameter Konfigurasi

![Contoh konfigurasi storage engine Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Tips}
Hanya menjelaskan parameter khusus storage engine Tencent COS, untuk parameter umum harap lihat [Parameter Umum Engine](./index.md#parameter-umum-engine).
:::

### Region

Isi region penyimpanan COS, contoh: `ap-chengdu`.

:::info{title=Tips}
Anda dapat melihat informasi region storage space di [Tencent COS Console](https://console.cloud.tencent.com/cos), dan hanya perlu mengambil bagian prefix region (tanpa domain lengkap).
:::

### SecretId

Isi ID access key Tencent.

### SecretKey

Isi Secret access key Tencent.

### Bucket

Isi nama Bucket penyimpanan COS, contoh: `qing-cdn-1234189398`.
