---
title: "Field Lampiran"
description: "Field lampiran, terhubung ke Collection file, menyimpan gambar, dokumen, dan file lainnya."
keywords: "field lampiran,field-attachment,relasi file,gambar,dokumen,NocoBase"
---

# Field Lampiran

## Pengantar

Field tipe "Lampiran" yang dibawakan sistem, digunakan untuk mendukung upload file oleh pengguna pada Collection custom.

Field lampiran pada dasarnya adalah field relasi Many to Many, menunjuk ke Collection file bawaan sistem "Lampiran" (`attachments`). Setelah field lampiran dibuat pada Collection mana pun, akan otomatis dibuat tabel perantara Many to Many ke Collection lampiran. Metadata file yang diupload akan disimpan di Collection "Lampiran", dan informasi file yang dirujuk dalam Collection akan terhubung melalui tabel perantara ini.

## Konfigurasi Field

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Pembatasan Tipe MIME

Digunakan untuk membatasi tipe file yang dapat diupload, menggunakan sintaks [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) untuk mendeskripsikan format. Contohnya: `image/*` mewakili file kategori gambar. Beberapa tipe dapat dipisahkan dengan koma, seperti: `image/*,application/pdf` yang berarti mengizinkan file tipe gambar dan PDF.

### Storage Engine

Pilih storage engine untuk menyimpan file yang diupload. Jika tidak diisi, akan menggunakan storage engine default sistem.
