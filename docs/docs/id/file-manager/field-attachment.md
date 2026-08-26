---
pkg: '@nocobase/plugin-file-manager'
title: "Field Attachment"
description: "Field attachment digunakan untuk mendukung upload file di tabel data, di-back oleh many-to-many relation yang mengarah ke tabel attachments, dapat dikonfigurasi dengan batasan tipe MIME dan storage engine."
keywords: "field attachment,field attachment,upload file,tipe MIME,storage engine,attachments,NocoBase"
---

# Field Attachment

## Pengantar

Field tipe "Attachment" built-in sistem, digunakan untuk mendukung user upload file di tabel data kustom.

Field attachment di tingkat dasar adalah many-to-many relation field, mengarah ke tabel file built-in sistem "Attachment" (`attachments`). Setelah field attachment dibuat di tabel data apa pun, akan otomatis menghasilkan tabel intermediate many-to-many relation tabel attachment. Metadata file yang di-upload akan disimpan di tabel "Attachment", informasi file yang direferensikan di tabel data akan terkait melalui tabel intermediate ini.

## Konfigurasi Field

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Batasan Tipe MIME

Digunakan untuk membatasi tipe file yang diizinkan untuk upload, menggunakan syntax [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) untuk mendeskripsikan format. Contohnya: `image/*` mewakili file tipe gambar. Beberapa tipe dapat dipisahkan dengan koma, seperti: `image/*,application/pdf` mewakili mengizinkan file tipe gambar dan PDF.

### Storage Engine

Pilih storage engine yang digunakan untuk menyimpan file yang di-upload. Jika kosong akan menggunakan storage engine default sistem.
