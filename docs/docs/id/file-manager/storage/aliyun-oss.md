---
pkg: '@nocobase/plugin-file-manager'
title: "Storage Engine: Aliyun OSS"
description: "Konfigurasi storage engine Aliyun OSS built-in NocoBase: region, AccessKey, bucket, timeout, cocok untuk Aliyun Object Storage Service."
keywords: "Aliyun OSS,Aliyun Storage,AccessKey,bucket,object storage,konfigurasi OSS,NocoBase"
---

# Storage Engine: Aliyun OSS

Storage engine berdasarkan Aliyun OSS, perlu menyiapkan akun dan permission terkait sebelum digunakan.

## Parameter Konfigurasi

![Contoh konfigurasi storage engine Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Tips}
Hanya memperkenalkan parameter spesifik untuk Aliyun OSS storage engine. Untuk parameter umum lihat [Parameter Umum Engine](./index#parameter-umum-engine).
:::

### Region

Isi region storage OSS, contohnya: `oss-cn-hangzhou`.

:::info{title=Tips}
Anda dapat melihat informasi region storage space di [Aliyun OSS Console](https://oss.console.aliyun.com/), dan hanya perlu mengambil bagian prefix region saja (tidak perlu domain lengkap).
:::

### AccessKey ID

Isi ID Aliyun access key.

### AccessKey Secret

Isi Secret Aliyun access key.

### Bucket

Isi nama bucket OSS storage.

### Timeout

Isi timeout untuk upload ke Aliyun OSS, satuan milisecond, default `60000` milisecond (atau 60 detik).
