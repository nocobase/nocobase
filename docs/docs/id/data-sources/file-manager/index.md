---
title: "Manajer File"
description: "Tabel file, field lampiran, dan mesin penyimpanan file, mendukung penyimpanan lokal, Alibaba Cloud OSS, Amazon S3, dan Tencent Cloud COS, serta pengelolaan metadata dan pengunggahan file."
keywords: "manajer file,tabel file,field lampiran,mesin penyimpanan,OSS,S3,COS,NocoBase"
---

# Manajer File

<PluginInfo name="file-manager"></PluginInfo>

## Pengenalan

Plugin Manajer File menyediakan tabel file, field lampiran, dan mesin penyimpanan file untuk mengelola file secara efektif. File adalah record tabel data dengan struktur khusus. Tabel data dengan struktur khusus ini disebut tabel file, yang digunakan untuk menyimpan metadata file dan dapat dikelola melalui Manajer File. Field lampiran adalah field relasi khusus yang terkait dengan tabel file. File mendukung berbagai metode penyimpanan. Saat ini, mesin penyimpanan file yang didukung meliputi penyimpanan lokal, Alibaba Cloud OSS, Amazon S3, dan Tencent Cloud COS.

## Panduan penggunaan

### Tabel file

Tabel attachments bawaan digunakan untuk menyimpan file yang terkait dengan semua field lampiran. Selain itu, Anda juga dapat membuat tabel file baru untuk menyimpan file tertentu.

[Lihat dokumentasi pengenalan tabel file untuk penggunaan lebih lanjut](/data-sources/file-manager/file-collection)

### Field lampiran

Field lampiran adalah field relasi khusus yang terkait dengan tabel file. Field ini dapat dibuat melalui «field tipe lampiran» atau dikonfigurasi melalui «field relasi».

[Lihat dokumentasi pengenalan field lampiran untuk penggunaan lebih lanjut](/data-sources/file-manager/field-attachment)

### Mesin penyimpanan file

Mesin penyimpanan file digunakan untuk menyimpan file ke layanan tertentu, termasuk penyimpanan lokal (disimpan di hard disk server), penyimpanan cloud, dan lainnya.

[Lihat pengenalan mesin penyimpanan file untuk informasi lebih lanjut](./storage/index.md)

### HTTP API

Pengunggahan file dapat diproses melalui HTTP API. Lihat [HTTP API](./http-api.md).

## Pengembangan ekstensi

*