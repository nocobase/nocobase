---
pkg: "@nocobase/plugin-file-manager"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Manajer File

## Pendahuluan

Plugin Manajer File menyediakan koleksi file, kolom lampiran, dan mesin penyimpanan file untuk mengelola file secara efektif. File adalah catatan dalam koleksi khusus, yang disebut koleksi file. Koleksi ini menyimpan metadata file dan dapat dikelola melalui Manajer File. Kolom lampiran adalah kolom asosiasi spesifik yang terkait dengan koleksi file. Plugin ini mendukung berbagai metode penyimpanan, termasuk penyimpanan lokal, Alibaba Cloud OSS, Amazon S3, dan Tencent Cloud COS.

## Panduan Pengguna

### Koleksi File

Koleksi `attachments` sudah tersedia secara bawaan untuk menyimpan semua file yang terkait dengan kolom lampiran. Selain itu, koleksi file baru juga dapat dibuat untuk menyimpan file tertentu.

[Pelajari lebih lanjut di dokumentasi Koleksi File](/data-sources/file-manager/file-collection)

### Kolom Lampiran

Kolom lampiran adalah kolom asosiasi spesifik yang terkait dengan koleksi file, yang dapat dibuat melalui tipe kolom "Lampiran" atau dikonfigurasi melalui kolom "Asosiasi".

[Pelajari lebih lanjut di dokumentasi Kolom Lampiran](/data-sources/file-manager/field-attachment)

### Mesin Penyimpanan File

Mesin penyimpanan file digunakan untuk menyimpan file ke layanan tertentu, termasuk penyimpanan lokal (menyimpan ke hard drive server), penyimpanan cloud, dll.

[Pelajari lebih lanjut di dokumentasi Mesin Penyimpanan File](./storage/index.md)

### API HTTP

Unggahan file dapat ditangani melalui API HTTP, lihat [API HTTP](./http-api.md).

## Pengembangan

*