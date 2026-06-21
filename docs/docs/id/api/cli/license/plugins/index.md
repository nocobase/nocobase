---
title: "nb license plugins"
description: "Referensi perintah nb license plugins: memeriksa atau menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini."
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

Memeriksa atau menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini.

## Penggunaan

```bash
nb license plugins <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb license plugins list`](./list.md) | Menampilkan plugin komersial yang terkait dengan lisensi saat ini |
| [`nb license plugins sync`](./sync.md) | Menyinkronkan plugin komersial yang diizinkan oleh lisensi saat ini |
| [`nb license plugins clean`](./clean.md) | Menghapus plugin komersial yang sudah diunduh untuk env saat ini |

## Contoh

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Perintah Terkait

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
