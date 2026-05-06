---
title: "nb config"
description: "Referensi perintah nb config: mengelola konfigurasi default CLI."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Mengelola konfigurasi default CLI. Key yang saat ini didukung:

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## Penggunaan

```bash
nb config <command>
```

## Subcommand

| Perintah | Penjelasan |
| --- | --- |
| [`nb config get`](./get.md) | Mengambil nilai efektif dari key konfigurasi |
| [`nb config set`](./set.md) | Menetapkan nilai konfigurasi |
| [`nb config delete`](./delete.md) | Menghapus nilai yang dikonfigurasi secara eksplisit |
| [`nb config list`](./list.md) | Menampilkan daftar nilai yang dikonfigurasi secara eksplisit |

## Contoh

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Perintah Terkait

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
