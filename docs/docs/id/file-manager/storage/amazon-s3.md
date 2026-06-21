---
pkg: '@nocobase/plugin-file-manager'
title: "Storage Engine: Amazon S3"
description: "Konfigurasi storage engine Amazon S3 built-in NocoBase: region, AccessKey ID/Secret, nama bucket, cocok untuk AWS cloud storage."
keywords: "Amazon S3,AWS,bucket,AccessKey,cloud storage,konfigurasi S3,NocoBase"
---

# Storage Engine: Amazon S3

Storage engine berdasarkan Amazon S3, perlu menyiapkan akun dan permission terkait sebelum digunakan.

## Parameter Konfigurasi

![Contoh konfigurasi storage engine Amazon S3](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Tips}
Hanya memperkenalkan parameter spesifik untuk Amazon S3 storage engine. Untuk parameter umum lihat [Parameter Umum Engine](./index#parameter-umum-engine).
:::

### Region

Isi region storage S3, contohnya: `us-west-1`.

:::info{title=Tips}
Anda dapat melihat informasi region storage space di [Amazon S3 Console](https://console.aws.amazon.com/s3/), dan hanya perlu mengambil bagian prefix region saja (tidak perlu domain lengkap).
:::

### AccessKey ID

Isi ID Amazon S3 access key.

### AccessKey Secret

Isi Secret Amazon S3 access key.

### Bucket

Isi nama bucket S3 storage.
