---
title: "nb api resource create"
description: "Referensi perintah nb api resource create: membuat record dari resource NocoBase yang ditentukan."
keywords: "nb api resource create,NocoBase CLI,membuat record,CRUD"
---

# nb api resource create

Membuat record dari resource yang ditentukan. Konten record dimasukkan melalui `--values` sebagai objek JSON.

## Penggunaan

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--resource` | string | Nama resource, wajib diisi |
| `--data-source` | string | Key data source, default `main` |
| `--source-id` | string | ID record sumber dari resource asosiasi |
| `--values` | string | Data untuk record yang dibuat, objek JSON, wajib diisi |
| `--whitelist` | string[] | Field yang diizinkan untuk ditulis, dapat dimasukkan berulang atau berupa array JSON |
| `--blacklist` | string[] | Field yang dilarang untuk ditulis, dapat dimasukkan berulang atau berupa array JSON |

Juga mendukung parameter koneksi umum dari [`nb api resource`](./index.md).

## Contoh

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Perintah Terkait

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
