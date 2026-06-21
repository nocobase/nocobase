---
title: "Storage Engine File"
description: "Storage engine field lampiran: penyimpanan lokal, Aliyun OSS, Amazon S3, Tencent COS, S3 Pro, mengonfigurasi judul, path, URL akses, dan lainnya."
keywords: "penyimpanan file,Storage,OSS,S3,COS,penyimpanan lokal,cloud storage,NocoBase"
---

# Ikhtisar

## Engine Bawaan

Tipe engine yang saat ini didukung secara bawaan oleh NocoBase sebagai berikut:

- [Penyimpanan Lokal](./local.md)
- [Aliyun OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent COS](./tencent-cos.md)

Saat sistem diinstal, akan otomatis ditambahkan satu storage engine penyimpanan lokal, yang dapat langsung digunakan. Anda juga dapat menambahkan engine baru atau mengedit parameter engine yang sudah ada.

## Parameter Umum Engine

Selain parameter khusus dari masing-masing kategori engine, bagian berikut adalah parameter umum (mengambil contoh penyimpanan lokal):

![Contoh konfigurasi storage engine](https://static-docs.nocobase.com/20240529115151.png)

### Judul

Nama storage engine, digunakan untuk identifikasi manual.

### Nama Sistem

Nama sistem storage engine, digunakan untuk identifikasi sistem. Harus unik dalam sistem. Jika tidak diisi, akan otomatis dihasilkan acak oleh sistem.

### URL Akses Dasar

Bagian prefix alamat URL yang dapat diakses untuk file ini, dapat berupa URL akses dasar CDN, contohnya: "`https://cdn.nocobase.com/app`" (tanpa "`/`" di akhir).

### Path

Path relatif yang digunakan saat menyimpan file. Saat akses, bagian ini juga akan otomatis digabungkan ke URL final. Contoh: "`user/avatar`" (tanpa "`/`" di awal dan akhir).

### Batasan Ukuran File

Batasan ukuran saat upload file ke storage engine ini. File yang melebihi ukuran yang diatur tidak akan dapat diupload. Default sistem dibatasi 20MB, dapat disesuaikan hingga maksimum 1GB.

### Tipe File

Dapat membatasi tipe file yang diupload, menggunakan sintaks [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) untuk mendeskripsikan format. Contohnya: `image/*` mewakili file kategori gambar. Beberapa tipe dapat dipisahkan dengan koma, seperti: `image/*, application/pdf` yang berarti mengizinkan file tipe gambar dan PDF.

### Storage Engine Default

Setelah dicentang, akan diatur sebagai storage engine default sistem. Saat field lampiran atau Collection File tidak menentukan storage engine, file yang diupload semuanya akan disimpan ke storage engine default. Storage engine default tidak dapat dihapus.

### Pertahankan File saat Record Dihapus

Setelah dicentang, ketika record data Collection lampiran atau Collection File dihapus, file yang sudah diupload di storage engine tetap dipertahankan. Default tidak dicentang, yaitu saat record dihapus, file di storage engine juga akan dihapus secara bersamaan.

:::info{title=Tips}
Setelah file diupload, path akses final akan dibentuk dari beberapa bagian yang digabung:

```
<URL Akses Dasar>/<Path>/<Nama File><Ekstensi>
```

Contoh: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::
