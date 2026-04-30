---
title: "nb plugin"
description: "Referensi perintah nb plugin: mengelola plugin dari env NocoBase yang dipilih."
keywords: "nb plugin,NocoBase CLI,manajemen plugin,enable,disable,list"
---

# nb plugin

Mengelola plugin dari env NocoBase yang dipilih. Env npm/Git akan menjalankan perintah plugin secara lokal, env Docker akan menjalankannya di container aplikasi yang tersimpan, env HTTP akan fallback ke API jika tersedia.

## Penggunaan

```bash
nb plugin <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb plugin list`](./list.md) | Menampilkan daftar plugin yang terinstal |
| [`nb plugin enable`](./enable.md) | Mengaktifkan satu atau lebih plugin |
| [`nb plugin disable`](./disable.md) | Menonaktifkan satu atau lebih plugin |

## Contoh

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Perintah Terkait

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
