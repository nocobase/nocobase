---
title: "nb plugin enable"
description: "Referensi perintah nb plugin enable: mengaktifkan satu atau lebih plugin di env NocoBase yang dipilih."
keywords: "nb plugin enable,NocoBase CLI,mengaktifkan plugin"
---

# nb plugin enable

Mengaktifkan satu atau lebih plugin di env yang dipilih.

## Penggunaan

```bash
nb plugin enable <packages...> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<packages...>` | string[] | Nama paket plugin, wajib diisi, mendukung memasukkan beberapa |
| `--env`, `-e` | string | Nama env CLI, jika dilewati menggunakan env saat ini |

## Contoh

```bash
nb plugin enable @nocobase/plugin-sample
nb plugin enable @nocobase/plugin-a @nocobase/plugin-b
nb plugin enable -e local @nocobase/plugin-sample
```

## Perintah Terkait

- [`nb plugin list`](./list.md)
- [`nb plugin disable`](./disable.md)
