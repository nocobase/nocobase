---
title: "nb self update"
description: "Referensi perintah nb self update: memperbarui NocoBase CLI yang terinstal global melalui npm."
keywords: "nb self update,NocoBase CLI,update,pembaruan mandiri"
---

# nb self update

Memperbarui NocoBase CLI yang terinstal saat CLI saat ini dikelola oleh instalasi npm global standar.

## Penggunaan

```bash
nb self update [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `--channel` | string | Channel rilis untuk diupdate, default `auto`; opsi: `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Lewati konfirmasi update |
| `--json` | boolean | Output JSON |
| `--verbose` | boolean | Menampilkan output update detail |

## Contoh

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Perintah Terkait

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
