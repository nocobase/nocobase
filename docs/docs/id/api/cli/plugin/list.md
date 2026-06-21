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
| `--yes`, `-y` | boolean | Saat `--env` yang diberikan secara eksplisit menargetkan env yang berbeda dari env saat ini, lewati konfirmasi interaktif |

## Contoh

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

Jika Anda memberikan `--env` secara eksplisit dan nilainya berbeda dari env saat ini, CLI akan meminta konfirmasi terlebih dahulu. Pada terminal non-interaktif atau sesi AI agent, tambahkan `--yes` sendiri atau jalankan `nb env use <name>` terlebih dahulu lalu coba lagi.

## Perintah Terkait

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
