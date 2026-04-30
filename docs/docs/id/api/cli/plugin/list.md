---
title: "nb plugin list"
description: "Referensi perintah nb plugin list: menampilkan daftar plugin dari env NocoBase yang dipilih."
keywords: "nb plugin list,NocoBase CLI,daftar plugin"
---

# nb plugin list

Menampilkan daftar plugin yang terinstal dari env yang dipilih.

## Penggunaan

```bash
nb plugin list [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI, jika dilewati menggunakan env saat ini |

## Contoh

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local-docker
```

## Perintah Terkait

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
