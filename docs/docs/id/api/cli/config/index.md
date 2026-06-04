---
title: "nb config"
description: "Referensi perintah nb config: mengelola item konfigurasi default CLI NocoBase."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Mengelola konfigurasi default CLI. Key yang saat ini didukung:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Key umum

| Key | Nilai default | Penjelasan |
| --- | --- | --- |
| `locale` | aturan resolusi locale CLI saat ini | Menimpa bahasa yang digunakan oleh CLI |
| `update.policy` | `prompt` | Perilaku pembaruan saat startup: `prompt`, `auto`, atau `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Registry paket untuk paket komersial |
| `docker.network` | `nocobase` | Jaringan Docker default yang dipakai oleh aplikasi Docker yang dikelola CLI |
| `docker.container-prefix` | `nb` | Prefiks container default yang dipakai oleh aplikasi Docker yang dikelola CLI |
| `bin.docker` | `docker` | Menimpa path executable Docker |
| `bin.git` | `git` | Menimpa path executable Git |
| `bin.yarn` | `yarn` | Menimpa path executable Yarn |

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
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Perintah Terkait

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
