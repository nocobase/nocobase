---
title: "File Manager"
description: "Collection File, Field Lampiran, dan storage engine file, mendukung penyimpanan lokal, Aliyun OSS, Amazon S3, Tencent COS, mengelola meta info file dan upload."
keywords: "file manager,collection file,field lampiran,storage engine,OSS,S3,COS,NocoBase"
---

# File Manager

<PluginInfo name="file-manager"></PluginInfo>

## Pengantar

Plugin File Manager menyediakan Collection File, Field Lampiran, dan storage engine file, untuk mengelola file secara efektif. File adalah record Collection dengan struktur khusus. Collection dengan struktur khusus ini disebut Collection File, digunakan untuk menyimpan meta info file, dan dapat dikelola melalui File Manager. Field Lampiran adalah field relasi khusus yang terhubung ke Collection File. File mendukung berbagai cara penyimpanan. Storage engine file yang saat ini didukung meliputi penyimpanan lokal, Aliyun OSS, Amazon S3, dan Tencent COS.

## Panduan Penggunaan

### Collection File

Memiliki Collection attachments bawaan, untuk menyimpan semua file yang terhubung dengan field lampiran. Selain itu, Anda juga dapat membuat Collection File baru, untuk menyimpan file tertentu.

[Lihat dokumentasi pengantar Collection File untuk penggunaan lebih lanjut](/data-sources/file-manager/file-collection)

### Field Lampiran

Field Lampiran adalah field relasi khusus yang terhubung ke Collection File. Dapat dibuat melalui "Field Tipe Lampiran", atau dikonfigurasi melalui "Field Relasi".

[Lihat dokumentasi pengantar Field Lampiran untuk penggunaan lebih lanjut](/data-sources/file-manager/field-attachment)

### Storage Engine File

Storage engine file digunakan untuk menyimpan file ke layanan tertentu, termasuk penyimpanan lokal (disimpan ke hard disk server), penyimpanan cloud, dan lainnya.

[Lihat pengantar storage engine file untuk lebih lanjut](./storage/index.md)

### HTTP API

Upload file dapat diproses melalui HTTP API, lihat [HTTP API](./http-api.md).

## Pengembangan Ekstensi

* 
