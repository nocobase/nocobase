---
pkg: '@nocobase/plugin-file-manager'
title: "Storage Engine: Tencent Cloud COS"
description: "Konfigurasi storage engine Tencent Cloud COS built-in NocoBase: region, SecretId, SecretKey, bucket, cocok untuk Tencent Cloud Object Storage."
keywords: "Tencent Cloud COS,Tencent Cloud Storage,SecretId,SecretKey,bucket,object storage,NocoBase"
---

# Tencent Cloud COS

Storage engine berdasarkan Tencent Cloud COS, perlu menyiapkan akun dan permission terkait sebelum digunakan.

## Parameter Konfigurasi

![Contoh konfigurasi storage engine Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Tips}
Hanya memperkenalkan parameter spesifik untuk Tencent Cloud COS storage engine. Untuk parameter umum lihat [Parameter Umum Engine](./index.md#parameter-umum-engine).
:::

### Region

Isi region storage COS, contohnya: `ap-chengdu`.

:::info{title=Tips}
Anda dapat melihat informasi region storage space di [Tencent Cloud COS Console](https://console.cloud.tencent.com/cos), dan hanya perlu mengambil bagian prefix region saja (tidak perlu domain lengkap).
:::

### SecretId

Isi ID Tencent Cloud access key.

### SecretKey

Isi Secret Tencent Cloud access key.

### Bucket

Isi nama bucket COS storage, contohnya: `qing-cdn-1234189398`.
