---
title: "Tencent Cloud COS"
description: "Konfigurasi mesin penyimpanan Tencent Cloud COS: Bucket, Region, SecretId, dan pengunggahan file ke penyimpanan objek."
keywords: "Tencent Cloud COS, penyimpanan objek Tencent Cloud, penyimpanan COS, penyimpanan cloud, NocoBase"
---

# Tencent Cloud COS

Mesin penyimpanan berbasis Tencent Cloud COS. Sebelum digunakan, Anda perlu menyiapkan akun dan izin terkait.

## Parameter konfigurasi

![Contoh konfigurasi mesin penyimpanan Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Catatan}
Hanya parameter khusus mesin penyimpanan Tencent Cloud COS yang dijelaskan. Untuk parameter umum, silakan lihat [parameter umum mesin](./index.md#引擎通用参数).
:::

### Region

Masukkan region penyimpanan COS, misalnya: `ap-chengdu`.

:::info{title=Catatan}
Informasi region ruang penyimpanan dapat dilihat di [Konsol Tencent Cloud COS](https://console.cloud.tencent.com/cos). Anda hanya perlu mengambil bagian awalan region (tidak perlu nama domain lengkap).
:::

### SecretId

Masukkan ID kunci akses resmi Tencent Cloud.

### SecretKey

Masukkan Secret kunci akses resmi Tencent Cloud.

### Bucket

Masukkan nama bucket penyimpanan COS, misalnya: `qing-cdn-1234189398`.