---
title: "nb self"
description: "Referensi perintah nb self: memeriksa atau memperbarui NocoBase CLI yang terinstal."
keywords: "nb self,NocoBase CLI,pembaruan mandiri,pemeriksaan versi"
---

# nb self

Memeriksa atau memperbarui NocoBase CLI yang terinstal.

## Penggunaan

```bash
nb self <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb self check`](./check.md) | Memeriksa versi CLI saat ini dan dukungan pembaruan mandiri |
| [`nb self update`](./update.md) | Memperbarui NocoBase CLI yang terinstal global melalui npm |

## Contoh

```bash
nb self check
nb self check --json
nb self update --yes
```

## Perintah Terkait

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
