---
title: "nb scaffold plugin"
description: "Referensi perintah nb scaffold plugin: menghasilkan scaffold plugin NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold plugin"
---

# nb scaffold plugin

Menghasilkan kode scaffold plugin NocoBase.

## Penggunaan

```bash
nb scaffold plugin <pkg> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<pkg>` | string | Nama paket plugin, wajib diisi |
| `--force-recreate`, `-f` | boolean | Memaksa pembuatan ulang scaffold plugin |

## Contoh

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold plugin @nocobase-example/plugin-hello --force-recreate
```

## Perintah Terkait

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
