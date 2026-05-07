---
title: "Aliyun OSS"
description: "Konfigurasi storage engine Aliyun OSS: Bucket, Endpoint, AccessKey, mendukung akses publik dan internal."
keywords: "Aliyun OSS,Aliyun Object Storage,OSS storage,cloud storage,NocoBase"
---

# Aliyun OSS

Storage engine berbasis Aliyun OSS, sebelum digunakan perlu menyiapkan akun dan izin terkait.

## Parameter Konfigurasi

![Contoh konfigurasi storage engine Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Tips}
Hanya menjelaskan parameter khusus storage engine Aliyun OSS, untuk parameter umum harap lihat [Parameter Umum Engine](./index.md#parameter-umum-engine).
:::

### Region

Isi region penyimpanan OSS, contoh: `oss-cn-hangzhou`.

:::info{title=Tips}
Anda dapat melihat informasi region storage space di [Aliyun OSS Console](https://oss.console.aliyun.com/), dan hanya perlu mengambil bagian prefix region (tanpa domain lengkap).
:::

### AccessKey ID

Isi ID access key Aliyun.

### AccessKey Secret

Isi Secret access key Aliyun.

### Bucket

Isi nama Bucket penyimpanan OSS.
