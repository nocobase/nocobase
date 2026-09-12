---
title: "nb scaffold"
description: "Referensi perintah nb scaffold: menghasilkan scaffold plugin NocoBase dan script migration."
keywords: "nb scaffold,NocoBase CLI,scaffold,plugin,migration"
---

# nb scaffold

Menghasilkan scaffold yang terkait dengan pengembangan plugin NocoBase.

## Penggunaan

```bash
nb scaffold <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb scaffold plugin`](./plugin.md) | Menghasilkan scaffold plugin NocoBase |
| [`nb scaffold migration`](./migration.md) | Menghasilkan script migration plugin |

## Contoh

```bash
nb scaffold plugin @nocobase-example/plugin-hello
nb scaffold migration migration-name --pkg @nocobase/plugin-acl
```

## Perintah Terkait

- [`nb plugin`](../plugin/index.md)
- [Pengembangan Plugin](../../../plugin-development/index.md)
