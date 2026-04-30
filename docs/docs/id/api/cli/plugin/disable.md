---
title: "nb plugin disable"
description: "Referensi perintah nb plugin disable: menonaktifkan satu atau lebih plugin di env NocoBase yang dipilih."
keywords: "nb plugin disable,NocoBase CLI,menonaktifkan plugin"
---

# nb plugin disable

Menonaktifkan satu atau lebih plugin di env yang dipilih.

## Penggunaan

```bash
nb plugin disable <packages...> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<packages...>` | string[] | Nama paket plugin, wajib diisi, mendukung memasukkan beberapa |
| `--env`, `-e` | string | Nama env CLI, jika dilewati menggunakan env saat ini |

## Contoh

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
```

## Perintah Terkait

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
