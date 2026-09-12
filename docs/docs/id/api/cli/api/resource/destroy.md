---
title: "nb api resource destroy"
description: "Referensi perintah nb api resource destroy: menghapus record dari resource NocoBase yang ditentukan."
keywords: "nb api resource destroy,NocoBase CLI,menghapus record,CRUD"
---

# nb api resource destroy

Menghapus record dari resource yang ditentukan. Anda dapat menggunakan `--filter-by-tk` atau `--filter` untuk mencari record.

## Penggunaan

```bash
nb api resource destroy --resource <resource> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--resource` | string | Nama resource, wajib diisi |
| `--data-source` | string | Key data source, default `main` |
| `--source-id` | string | ID record sumber dari resource asosiasi |
| `--filter-by-tk` | string | Nilai primary key, untuk key komposit atau ganda dapat berupa array JSON |
| `--filter` | string | Kondisi filter dalam bentuk objek JSON |

Juga mendukung parameter koneksi umum dari [`nb api resource`](./index.md).

## Contoh

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Perintah Terkait

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
