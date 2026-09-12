---
title: "OSS Alibaba Cloud"
description: "Konfigurasi mesin penyimpanan OSS Alibaba Cloud: Bucket, Endpoint, AccessKey, mendukung akses publik dan internal."
keywords: "OSS Alibaba Cloud, penyimpanan objek Alibaba Cloud, penyimpanan OSS, penyimpanan cloud, NocoBase"
---

# OSS Alibaba Cloud

Mesin penyimpanan berbasis OSS Alibaba Cloud. Sebelum digunakan, siapkan akun dan izin yang diperlukan.

## Parameter konfigurasi

![Contoh konfigurasi mesin penyimpanan OSS Alibaba Cloud](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Catatan}
Hanya parameter khusus mesin penyimpanan OSS Alibaba Cloud yang dijelaskan di sini. Untuk parameter umum, lihat [Parameter umum mesin](./index.md#引擎通用参数).
:::

### Wilayah

Masukkan wilayah penyimpanan OSS, misalnya: `oss-cn-hangzhou`.

:::info{title=Catatan}
Informasi wilayah ruang penyimpanan dapat dilihat di [Konsol OSS Alibaba Cloud](https://oss.console.aliyun.com/). Anda hanya perlu mengambil bagian awalan wilayahnya (tidak perlu nama domain lengkap).
:::

### ID AccessKey

Masukkan ID kunci akses resmi Alibaba Cloud.

### Secret AccessKey

Masukkan Secret kunci akses resmi Alibaba Cloud.

### Bucket

Masukkan nama bucket penyimpanan OSS.
