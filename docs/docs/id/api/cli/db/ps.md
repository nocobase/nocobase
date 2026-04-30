---
title: "nb db ps"
description: "Referensi perintah nb db ps: melihat status runtime database bawaan dari env yang sudah dikonfigurasi."
keywords: "nb db ps,NocoBase CLI,status database"
---

# nb db ps

Melihat status runtime database bawaan, tidak akan memulai atau menghentikan resource apapun. Saat `--env` dilewati, akan menampilkan status database dari semua env yang sudah dikonfigurasi.

## Penggunaan

```bash
nb db ps [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan dilihat, jika dilewati menampilkan semua env |

## Contoh

```bash
nb db ps
nb db ps --env app1
```

## Perintah Terkait

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
