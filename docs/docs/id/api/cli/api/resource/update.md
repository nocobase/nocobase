---
title: "nb api resource update"
description: "Referensi perintah nb api resource update: memperbarui record dari resource NocoBase yang ditentukan."
keywords: "nb api resource update,NocoBase CLI,memperbarui record,CRUD"
---

# nb api resource update

Memperbarui record dari resource yang ditentukan. Anda dapat menggunakan `--filter-by-tk` atau `--filter` untuk mencari record, dan memasukkan konten update melalui `--values`.

## Penggunaan

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--resource` | string | Nama resource, wajib diisi |
| `--data-source` | string | Key data source, default `main` |
| `--source-id` | string | ID record sumber dari resource asosiasi |
| `--filter-by-tk` | string | Nilai primary key, untuk key komposit atau ganda dapat berupa array JSON |
| `--filter` | string | Kondisi filter dalam bentuk objek JSON |
| `--values` | string | Data untuk record yang diperbarui, objek JSON, wajib diisi |
| `--whitelist` | string[] | Field yang diizinkan untuk ditulis, dapat dimasukkan berulang atau berupa array JSON |
| `--blacklist` | string[] | Field yang dilarang untuk ditulis, dapat dimasukkan berulang atau berupa array JSON |
| `--update-association-values` | string[] | Field asosiasi yang perlu diperbarui bersamaan, dapat dimasukkan berulang atau berupa array JSON |
| `--force-update` / `--no-force-update` | boolean | Apakah memaksa menulis nilai yang tidak berubah |

Juga mendukung parameter koneksi umum dari [`nb api resource`](./index.md).

## Contoh

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Perintah Terkait

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
