---
title: "nb license"
description: "Referensi perintah nb license: mengelola lisensi komersial dan plugin berlisensi NocoBase."
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

Mengelola lisensi komersial NocoBase, termasuk aktivasi dengan license key yang sudah ada, Instance ID, status lisensi, dan plugin berlisensi.

## Penggunaan

```bash
nb license <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb license activate`](./activate.md) | Mengaktifkan lisensi komersial untuk env saat ini dengan license key yang sudah ada |
| [`nb license id`](./id.md) | Menampilkan atau membuat instance ID untuk env saat ini |
| [`nb license status`](./status.md) | Menampilkan status lisensi komersial untuk env saat ini |
| [`nb license plugins`](./plugins/index.md) | Mengelola plugin komersial yang diizinkan oleh lisensi saat ini |

## Contoh

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Perintah Terkait

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
