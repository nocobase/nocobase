---
title: "nb api resource get"
description: "Referensi perintah nb api resource get: mengambil satu record dari resource NocoBase yang ditentukan."
keywords: "nb api resource get,NocoBase CLI,mengambil record,primary key"
---

# nb api resource get

Mengambil satu record dari resource yang ditentukan. Biasanya menggunakan `--filter-by-tk` untuk menentukan primary key.

## Penggunaan

```bash
nb api resource get --resource <resource> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--resource` | string | Nama resource, wajib diisi |
| `--data-source` | string | Key data source, default `main` |
| `--source-id` | string | ID record sumber dari resource asosiasi |
| `--filter-by-tk` | string | Nilai primary key, untuk key komposit atau ganda dapat berupa array JSON |
| `--fields` | string[] | Field query, dapat dimasukkan berulang atau berupa array JSON |
| `--appends` | string[] | Field asosiasi yang akan ditambahkan, dapat dimasukkan berulang atau berupa array JSON |
| `--except` | string[] | Field yang dikecualikan, dapat dimasukkan berulang atau berupa array JSON |

Juga mendukung parameter koneksi umum dari [`nb api resource`](./index.md).

## Contoh

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Perintah Terkait

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
