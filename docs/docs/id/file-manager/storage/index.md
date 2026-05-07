---
pkg: '@nocobase/plugin-file-manager'
title: "Ikhtisar Storage Engine"
description: "Storage engine menyimpan file ke local atau cloud storage, mendukung Local, Amazon S3, Aliyun OSS, Tencent COS, S3 Pro, mengkonfigurasi path, akses URL, batasan ukuran, tipe MIME, dll."
keywords: "storage engine,Storage,local storage,S3,OSS,COS,batasan ukuran file,tipe MIME,NocoBase"
---

# Ikhtisar

## Pengantar

Storage engine digunakan untuk menyimpan file ke service tertentu, termasuk local storage (disimpan ke hard disk server), cloud storage, dll.

Sebelum menggunakan upload file apa pun, perlu mengkonfigurasi storage engine terlebih dahulu. Sistem akan otomatis menambahkan satu local storage engine saat instalasi, yang dapat langsung digunakan. Anda juga dapat menambahkan engine baru atau mengedit parameter engine yang sudah ada.

## Tipe Storage Engine

Saat ini tipe engine yang didukung built-in oleh NocoBase adalah sebagai berikut:

- [Local Storage](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent Cloud COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Sistem akan otomatis menambahkan satu local storage engine saat instalasi, yang dapat langsung digunakan. Anda juga dapat menambahkan engine baru atau mengedit parameter engine yang sudah ada.

## Parameter Umum Engine

Selain parameter spesifik untuk setiap kategori engine, bagian berikut adalah parameter umum (contoh dengan local storage):

![Contoh konfigurasi storage engine file](https://static-docs.nocobase.com/20240529115151.png)

### Title

Nama storage engine, untuk identifikasi manual.

### System Name

System name storage engine, untuk identifikasi sistem. Harus unik di sistem. Jika kosong akan otomatis dihasilkan secara random oleh sistem.

### Access URL Prefix

Prefix alamat URL yang dapat diakses untuk file ini, dapat berupa basis URL akses CDN, seperti: "`https://cdn.nocobase.com/app`" (tanpa "`/`" di akhir).

### Path

Relative path yang digunakan saat menyimpan file, bagian ini juga akan otomatis di-concat ke URL akhir saat akses. Seperti: "`user/avatar`" (tanpa "`/`" di awal dan akhir).

### Batasan Ukuran File

Batasan ukuran saat upload file di storage engine ini. File yang melebihi setting ukuran ini tidak akan dapat di-upload. Sistem default membatasi 20MB, dapat disesuaikan ke batasan maksimum 1GB.

### Tipe File

Dapat membatasi tipe file yang di-upload, menggunakan syntax [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) untuk mendeskripsikan format. Contohnya: `image/*` mewakili file tipe gambar. Beberapa tipe dapat dipisahkan dengan koma, seperti: `image/*, application/pdf` mewakili mengizinkan file tipe gambar dan PDF.

### Default Storage Engine

Setelah dicentang, diatur sebagai storage engine default sistem. Saat field attachment atau file collection tidak menentukan storage engine, file yang di-upload semua akan disimpan ke default storage engine. Default storage engine tidak dapat dihapus.

### Pertahankan File Saat Hapus Record

Setelah dicentang, saat record data attachment atau file collection dihapus, file yang sudah di-upload di storage engine tetap dipertahankan. Default tidak dicentang, yaitu saat hapus record akan sekaligus menghapus file di storage engine.

:::info{title=Tips}
Setelah file di-upload, akses path akhir akan terdiri dari beberapa bagian yang di-concat:

```
<basis akses URL>/<path>/<nama file><extension>
```

Seperti: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::
