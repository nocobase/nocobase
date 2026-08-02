---
title: "Bidang lampiran"
description: "Bidang lampiran, terkait dengan tabel file, untuk menyimpan gambar, dokumen, dan file lainnya."
keywords: "bidang lampiran,field-attachment,relasi file,gambar,dokumen,NocoBase"
---

# BIdang lampiran

## Pendahuluan

Sistem menyediakan tipe bidang bawaan "Lampiran" yang digunakan untuk mendukung pengguna mengunggah file di tabel data kustom.

Di balik layar, bidang lampiran merupakan bidang relasi many-to-many yang mengarah ke tabel file bawaan sistem "Lampiran" (`attachments`). Setelah bidang lampiran dibuat pada tabel data mana pun, tabel perantara relasi many-to-many ke tabel lampiran akan dibuat secara otomatis. Metadata file yang diunggah akan disimpan dalam tabel "Lampiran", sedangkan informasi file yang dirujuk dalam tabel data akan dihubungkan melalui tabel perantara ini.

## Konfigurasi bidang

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Batasan tipe MIME

Digunakan untuk membatasi tipe file yang diizinkan untuk diunggah, dengan menggunakan sintaks [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) untuk mendeskripsikan formatnya. Contoh: `image/*` mewakili file gambar. Beberapa tipe dapat dipisahkan dengan koma dalam bahasa Inggris, misalnya: `image/*,application/pdf` berarti mengizinkan file bertipe gambar dan PDF.

### Mesin penyimpanan

Pilih mesin penyimpanan yang digunakan untuk menyimpan file yang diunggah. Jika dikosongkan, mesin penyimpanan default sistem akan digunakan.
