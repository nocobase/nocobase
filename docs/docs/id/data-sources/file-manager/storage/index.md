---
title: "Mesin Penyimpanan File"
description: "Mesin penyimpanan untuk field lampiran: penyimpanan lokal, Alibaba Cloud OSS, Amazon S3, Tencent Cloud COS, S3 Pro, konfigurasi judul, jalur, URL akses, dan lainnya."
keywords: "Penyimpanan file,Storage,OSS,S3,COS,Penyimpanan lokal,Penyimpanan cloud,NocoBase"
---

# Ikhtisar

## Mesin Bawaan

Saat ini, NocoBase secara bawaan mendukung jenis mesin berikut:

- [Penyimpanan lokal](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Saat sistem diinstal, satu mesin penyimpanan lokal akan ditambahkan secara otomatis dan dapat langsung digunakan. Anda juga dapat menambahkan mesin baru atau mengedit parameter mesin yang sudah ada.

## Parameter Umum Mesin

Selain parameter khusus untuk setiap jenis mesin, bagian berikut berisi parameter umum, dengan penyimpanan lokal sebagai contoh:

![Contoh konfigurasi mesin penyimpanan file](https://static-docs.nocobase.com/20240529115151.png)

### Judul

Nama mesin penyimpanan, yang digunakan untuk identifikasi oleh pengguna.

### Nama Sistem

Nama sistem mesin penyimpanan, yang digunakan untuk identifikasi oleh sistem. Nama ini harus unik di dalam sistem. Jika tidak diisi, sistem akan membuat nama acak secara otomatis.

### Dasar URL Akses

Bagian awalan alamat URL yang dapat digunakan untuk mengakses file dari luar, yang dapat berupa dasar URL akses CDN, misalnya: “`https://cdn.nocobase.com/app`” (tidak perlu diakhiri dengan “`/`”).

### Jalur

Jalur relatif yang digunakan saat menyimpan file. Saat diakses, bagian ini juga akan otomatis digabungkan ke URL akhir. Misalnya: “`user/avatar`” (tidak perlu diawali atau diakhiri dengan “`/`”).

### Batas Ukuran File

Batas ukuran file saat mengunggah file ke mesin penyimpanan ini. File yang melebihi ukuran yang ditetapkan tidak dapat diunggah. Batas bawaan sistem adalah 20MB, dan dapat disesuaikan hingga maksimum 1GB.

### Jenis File

Jenis file yang diunggah dapat dibatasi menggunakan format deskripsi sintaksis [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Misalnya: `image/*` berarti file gambar. Beberapa jenis dapat dipisahkan dengan koma dalam bahasa Inggris, misalnya: `image/*, application/pdf` berarti mengizinkan file gambar dan PDF.

### Mesin Penyimpanan Default

Setelah dicentang, mesin ini ditetapkan sebagai mesin penyimpanan default sistem. Jika mesin penyimpanan tidak ditentukan pada field lampiran atau tabel file, file yang diunggah akan disimpan ke mesin penyimpanan default. Mesin penyimpanan default tidak dapat dihapus.

### Simpan File Saat Menghapus Data

Setelah dicentang, file yang telah diunggah ke mesin penyimpanan akan tetap dipertahankan saat data pada tabel lampiran atau tabel file dihapus. Secara default, opsi ini tidak dicentang, sehingga file dalam mesin penyimpanan juga akan dihapus saat data dihapus.

:::info{title=Catatan}
Setelah file diunggah, jalur akses akhirnya akan terbentuk dari penggabungan beberapa bagian:

```
<访问 URL 基础>/<路径>/<文件名><后缀名>
```

Contoh: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`。
:::