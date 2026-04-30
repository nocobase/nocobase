---
title: "nb skills install"
description: "Referensi perintah nb skills install: menginstal NocoBase AI coding skills secara global."
keywords: "nb skills install,NocoBase CLI,instal skills"
---

# nb skills install

Menginstal NocoBase AI coding skills secara global. Jika sudah terinstal, perintah ini tidak akan melakukan update.

## Penggunaan

```bash
nb skills install [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Lewati konfirmasi instalasi |
| `--json` | boolean | Output JSON |
| `--verbose` | boolean | Menampilkan output instalasi detail |

## Contoh

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Perintah Terkait

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
