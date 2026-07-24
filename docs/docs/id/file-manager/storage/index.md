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
Saat "URL asli" dipilih, alamat storage akhir disusun dari beberapa bagian:

```
<basis akses URL>/<path>/<nama file><extension>
```

Seperti: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.

Saat "URL NocoBase" dipilih, record file mengembalikan path NocoBase dengan format `/files/...`. Konfigurasi di atas tetap digunakan saat mengakses service storage.
:::

## URL file dan kontrol akses

Storage engine dapat mengembalikan URL NocoBase atau URL asli dari service storage. URL NocoBase digunakan secara default. Pilih URL asli hanya ketika service eksternal harus menggunakan alamat storage secara langsung.

Konfigurasi ini berlaku per storage engine. Setelah disimpan, file yang sudah ada dan file baru yang di-upload di engine tersebut akan mengembalikan URL dalam bentuk yang dipilih. File tidak dipindahkan atau di-upload ulang.

![Konfigurasi URL file](https://static-docs.nocobase.com/20260723221234.png)

### URL NocoBase

Record file mengembalikan path akses yang disediakan oleh NocoBase, contohnya:

```text
/files/main/main/attachments/1.png
```

Request ke URL ini terlebih dahulu melewati NocoBase dan mengikuti izin melihat yang dikonfigurasi untuk record file terkait. NocoBase hanya membaca file atau mengalihkan ke alamat yang dibuat oleh service storage setelah pemeriksaan izin berhasil.

Ini adalah pilihan default yang direkomendasikan. Record file mengembalikan path NocoBase, sehingga pemanggil tidak perlu mengetahui apakah local storage atau cloud storage yang digunakan.

### URL asli

Record file langsung mengembalikan alamat yang dibuat oleh service storage, contohnya:

```text
https://storage.example.com/path/to/file.png
```

URL ini tidak melewati NocoBase dan tidak memeriksa izin melihat record file. Untuk local storage, URL ini adalah alamat file statis lokal. Untuk cloud storage, URL ini biasanya merupakan alamat object storage atau CDN.

Pilih URL asli hanya ketika Markdown, halaman eksternal, atau service pihak ketiga harus menggunakan alamat storage secara langsung.

:::warning Perhatian

Setelah URL asli dipilih, siapa pun yang memiliki URL valid dapat melewati pemeriksaan izin NocoBase dan mengakses file. Jika URL tidak memiliki tanda tangan atau masa berlaku, pastikan bucket dan file mengizinkan akses baca publik.

:::

### Izinkan akses publik

"Izinkan akses publik" hanya berlaku saat "URL NocoBase" dipilih. Saat dicentang, storage engine tetap mengembalikan URL NocoBase, tetapi NocoBase tidak lagi memeriksa izin record file ketika URL diakses. Siapa pun yang memiliki URL dapat mengakses file.

Opsi ini tidak mengubah konfigurasi baca publik milik service storage. Opsi ini hanya mengontrol apakah NocoBase memeriksa izin record file.

### Cara memilih

| Skenario penggunaan | URL file | Izinkan akses publik |
| --- | --- | --- |
| File harus mengikuti izin role dan data | URL NocoBase | Tidak dicentang |
| Diperlukan alamat file NocoBase yang dapat dibagikan secara publik | URL NocoBase | Dicentang |
| Markdown, halaman eksternal, atau service pihak ketiga harus membaca alamat storage secara langsung | URL asli | Tidak berlaku |

:::warning Perhatian

[Local Storage](./local), [Amazon S3](./amazon-s3), [Aliyun OSS](./aliyun-oss), dan [Tencent COS](./tencent-cos) tidak membuat URL bertanda tangan sementara. Meskipun URL NocoBase dan izin record file diaktifkan, siapa pun yang sudah memperoleh alamat asli service storage tetap dapat mengakses file secara langsung.

Untuk kontrak, dokumen identitas, materi internal, atau file lain yang tidak boleh publik, gunakan [S3 Pro](./s3-pro) dan lihat konfigurasi kontrol akses khususnya.

:::

Jika Anda sudah menggunakan storage engine publik dan ingin memigrasikan file yang ada ke S3 Pro, lihat [Migrasi ke S3 Pro](./migrate-to-s3-pro.md).
