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
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |

## Contoh

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
