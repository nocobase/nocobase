---
title: "nb app upgrade"
description: "Referensi perintah nb app upgrade: memperbarui source code atau image dan me-restart aplikasi NocoBase yang ditentukan."
keywords: "nb app upgrade,NocoBase CLI,upgrade,update,Docker image"
---

# nb app upgrade

Mengupgrade aplikasi NocoBase yang ditentukan. Instalasi npm/Git akan memuat ulang source code yang tersimpan dan me-restart dengan quickstart; instalasi Docker akan memuat ulang image yang tersimpan dan membangun ulang container aplikasi.

## Penggunaan

```bash
nb app upgrade [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--env`, `-e` | string | Nama env CLI yang akan diupgrade, jika dilewati menggunakan env saat ini |
| `--skip-code-update`, `-s` | boolean | Restart menggunakan source code lokal atau image Docker yang sudah tersimpan, tanpa mendownload pembaruan |
| `--verbose` | boolean | Menampilkan output perintah update dan restart yang mendasarinya |

## Contoh

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

## Perintah Terkait

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
