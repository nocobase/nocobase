---
title: "nb scaffold migration"
description: "Referensi perintah nb scaffold migration: menghasilkan script migration plugin NocoBase."
keywords: "nb scaffold migration,NocoBase CLI,script migration,migration"
---

# nb scaffold migration

Menghasilkan file script migration plugin.

## Penggunaan

```bash
nb scaffold migration <name> --pkg <pkg> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<name>` | string | Nama script migration, wajib diisi |
| `--pkg` | string | Nama paket plugin yang dimiliki, wajib diisi |
| `--on` | string | Waktu eksekusi: `beforeLoad`, `afterSync`, atau `afterLoad` |

## Contoh

```bash
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
nb scaffold migration migration-name --pkg @nocobase/plugin-acl --on afterLoad
```

## Perintah Terkait

- [`nb scaffold plugin`](./plugin.md)
- [Pengembangan Plugin](../../../plugin-development/index.md)
