---
title: "nb skills update"
description: "Referensi perintah nb skills update: memperbarui NocoBase AI coding skills global."
keywords: "nb skills update,NocoBase CLI,update skills"
---

# nb skills update

Memperbarui NocoBase AI coding skills yang terinstal secara global. Perintah ini hanya memperbarui instalasi `@nocobase/skills` yang sudah ada.

## Penggunaan

```bash
nb skills update [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Lewati konfirmasi update |
| `--json` | boolean | Output JSON |
| `--verbose` | boolean | Menampilkan output update detail |

## Contoh

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## Perintah Terkait

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
