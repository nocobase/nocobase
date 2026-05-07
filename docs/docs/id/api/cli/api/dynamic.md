---
title: "nb api Perintah Dinamis"
description: "Referensi perintah dinamis nb api: perintah CLI API yang dihasilkan berdasarkan OpenAPI Schema NocoBase."
keywords: "nb api perintah dinamis,NocoBase CLI,OpenAPI,swagger"
---

# nb api Perintah Dinamis

Selain [`nb api resource`](./resource/index.md), di bawah `nb api` juga terdapat sekelompok perintah yang dihasilkan secara dinamis berdasarkan OpenAPI Schema aplikasi NocoBase. Perintah ini dihasilkan dan di-cache saat pertama kali menjalankan [`nb env add`](../env/add.md) atau [`nb env update`](../env/update.md).

## Grup Umum

| Grup Perintah | Penjelasan |
| --- | --- |
| `nb api acl` | Manajemen permission: role, permission resource, dan permission operasi |
| `nb api api-keys` | Manajemen API Key |
| `nb api app` | Manajemen aplikasi |
| `nb api authenticators` | Manajemen autentikasi: password, SMS, SSO, dll |
| `nb api data-modeling` | Pemodelan data: data source, tabel data, dan field |
| `nb api file-manager` | Manajemen file: layanan storage dan attachment |
| `nb api flow-surfaces` | Orkestrasi halaman: halaman, blok, field, dan action |
| `nb api system-settings` | Pengaturan sistem: judul, Logo, bahasa, dll |
| `nb api theme-editor` | Manajemen tema: warna, ukuran, dan pergantian tema |
| `nb api workflow` | Workflow: manajemen alur otomatis |

Grup dan perintah yang sebenarnya tersedia bergantung pada versi aplikasi NocoBase yang terhubung dan plugin yang diaktifkan. Jalankan perintah berikut untuk melihat perintah yang didukung oleh aplikasi saat ini:

```bash
nb api --help
nb api <topic> --help
```

## Parameter Request Body

Perintah dinamis dengan request body mendukung:

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--body` | string | Request body dalam bentuk string JSON |
| `--body-file` | string | Path file JSON |

`--body` dan `--body-file` saling eksklusif.

## Perintah Terkait

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
